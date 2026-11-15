"""
CreatorPulse AI - Database Connection Manager
Manages SQLAlchemy engine, session factories, and explicit storage modes.
"""

import os
from contextlib import contextmanager
from typing import Generator, Optional
from sqlalchemy import create_engine, Engine, text, event
from sqlalchemy.orm import sessionmaker, Session

from .models import Base


class DatabaseConnectionError(RuntimeError):
    """Raised when a strict database connection requirement is violated."""
    pass


def get_storage_mode() -> str:
    """
    Returns active storage mode: 'json_mock' | 'sqlite' | 'postgres'.
    Default is 'json_mock' if not explicitly configured.
    """
    mode = os.getenv("STORAGE_MODE", "").lower().strip()
    if mode in ("postgres", "postgresql"):
        return "postgres"
    if mode == "sqlite":
        return "sqlite"
    if mode == "json_mock":
        return "json_mock"

    # If DATABASE_URL is set and points to Postgres, treat as postgres
    db_url = os.getenv("DATABASE_URL", "").lower().strip()
    if db_url.startswith("postgres"):
        return "postgres"
    if db_url.startswith("sqlite"):
        return "sqlite"

    return "json_mock"


def get_database_url() -> str:
    """Returns database connection string based on environment."""
    url = os.getenv("DATABASE_URL")
    if url:
        # Standardize postgres:// to postgresql+psycopg2:// for SQLAlchemy 2.0
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+"):
            url = url.replace("postgresql://", "postgresql+psycopg2://", 1)
        return url

    mode = get_storage_mode()
    if mode == "postgres":
        raise DatabaseConnectionError(
            "STORAGE_MODE is set to 'postgres' but DATABASE_URL environment variable is missing. "
            "Silent fallback to JSON is strictly prohibited in production mode."
        )
    
    # Default SQLite database path in backend directory
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    default_db_path = os.path.join(base_dir, "creatorpulse.db")
    return f"sqlite:///{default_db_path}"


_ENGINE: Optional[Engine] = None
_SESSION_FACTORY: Optional[sessionmaker[Session]] = None
_CACHED_URL: Optional[str] = None
_CACHED_MODE: Optional[str] = None


def reset_engine_cache() -> None:
    """Resets cached engine and sessions (useful for test isolation and mode switching)."""
    global _ENGINE, _SESSION_FACTORY, _CACHED_URL, _CACHED_MODE, _DB_INITIALIZED
    _ENGINE = None
    _SESSION_FACTORY = None
    _CACHED_URL = None
    _CACHED_MODE = None
    _DB_INITIALIZED = False


def get_engine(db_url: Optional[str] = None) -> Engine:
    global _ENGINE, _SESSION_FACTORY, _CACHED_URL, _CACHED_MODE

    url = db_url or get_database_url()
    mode = get_storage_mode()

    if _ENGINE is not None and db_url is None and _CACHED_URL == url and _CACHED_MODE == mode:
        return _ENGINE

    connect_args = {}
    if url.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    try:
        engine = create_engine(
            url,
            connect_args=connect_args,
            pool_pre_ping=True,
            echo=False,
        )

        # Enable SQLite foreign key enforcement
        if url.startswith("sqlite"):
            @event.listens_for(engine, "connect")
            def set_sqlite_pragma(dbapi_connection, connection_record):
                cursor = dbapi_connection.cursor()
                cursor.execute("PRAGMA foreign_keys=ON")
                cursor.close()

        # In strict postgres mode, verify connection immediately
        if mode == "postgres":
            try:
                with engine.connect() as conn:
                    conn.execute(text("SELECT 1"))
            except Exception as e:
                raise DatabaseConnectionError(
                    f"Strict PostgreSQL mode connection verification failed: {e}. "
                    "Silent fallback to JSON is strictly prohibited."
                ) from e

        if db_url is None:
            _ENGINE = engine
            _SESSION_FACTORY = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
            _CACHED_URL = url
            _CACHED_MODE = mode

        return engine

    except DatabaseConnectionError:
        raise
    except Exception as e:
        if mode == "postgres":
            raise DatabaseConnectionError(
                f"Failed to initialize database engine for '{url}': {e}"
            ) from e
        raise


def get_session_factory(db_url: Optional[str] = None) -> sessionmaker[Session]:
    global _SESSION_FACTORY, _CACHED_URL, _CACHED_MODE
    engine = get_engine(db_url)
    if _SESSION_FACTORY is not None and db_url is None:
        return _SESSION_FACTORY
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
    if db_url is None:
        _SESSION_FACTORY = factory
    return factory


@contextmanager
def get_db(db_url: Optional[str] = None) -> Generator[Session, None, None]:
    """Context manager yielding a transactional database session."""
    factory = get_session_factory(db_url)
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_db_session() -> Generator[Session, None, None]:
    """FastAPI dependency yielding a transactional session."""
    factory = get_session_factory()
    session: Session = factory()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def init_db(engine: Optional[Engine] = None) -> None:
    """Initializes tables for development/testing."""
    eng = engine or get_engine()
    Base.metadata.create_all(bind=eng)


_INITIALIZED_URL: Optional[str] = None


def ensure_database_ready() -> None:
    """Ensures database tables are initialized and seeded if empty when in relational mode."""
    global _INITIALIZED_URL

    mode = get_storage_mode()
    if mode in ("sqlite", "postgres"):
        url = get_database_url()
        if _INITIALIZED_URL == url:
            return

        init_db()
        with get_db() as session:
            from .models import SocialPost
            from sqlalchemy import select, func
            count = session.scalar(select(func.count(SocialPost.id)))
            if count == 0:
                from .seeder import seed_from_json
                seed_from_json(session)

        _INITIALIZED_URL = url
