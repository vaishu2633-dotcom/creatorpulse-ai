"""
CreatorPulse AI - Relational Repositories
Data access abstraction layer querying PostgreSQL / SQLite databases.
"""

from .post_repository import (
    get_posts,
    get_top_posts,
    get_bottom_posts,
    get_metric_snapshots,
    get_creators,
    get_creator_by_id,
    save_posts,
)
from .prediction_repository import (
    get_predictions,
    save_prediction,
    update_prediction_actual,
    get_brier_scoreboard,
)
from .draft_repository import (
    get_content_drafts,
    save_content_draft,
    delete_content_draft,
    get_content_calendar,
)
from .vibecheck_repository import (
    get_vibecheck_reports,
    get_vibecheck_report,
    save_vibecheck_report,
    delete_vibecheck_report,
    get_comments,
)
from .dataset_repository import (
    get_datasets,
    save_uploaded_dataset,
    get_user_preferences,
    save_user_preferences,
    get_trends,
)
from .integration_repository import (
    get_integration_metadata,
    get_all_integrations,
    save_integration_metadata,
    get_integration_secret,
)

__all__ = [
    "get_posts",
    "get_top_posts",
    "get_bottom_posts",
    "get_metric_snapshots",
    "get_creators",
    "get_creator_by_id",
    "save_posts",
    "get_predictions",
    "save_prediction",
    "update_prediction_actual",
    "get_brier_scoreboard",
    "get_content_drafts",
    "save_content_draft",
    "delete_content_draft",
    "get_content_calendar",
    "get_vibecheck_reports",
    "get_vibecheck_report",
    "save_vibecheck_report",
    "delete_vibecheck_report",
    "get_comments",
    "get_datasets",
    "save_uploaded_dataset",
    "get_user_preferences",
    "save_user_preferences",
    "get_trends",
    "get_integration_metadata",
    "get_all_integrations",
    "save_integration_metadata",
    "get_integration_secret",
]
