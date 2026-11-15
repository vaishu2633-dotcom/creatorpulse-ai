"""
CreatorPulse AI - Database Security & Secret Encryption
Fernet-based symmetric encryption for sensitive columns (e.g., API secrets, credentials).
"""

import os
import base64
import hashlib
from typing import Optional
from cryptography.fernet import Fernet

# Default salt/derivation for dev environment if DATABASE_ENCRYPTION_KEY is not explicitly provided
_DEFAULT_KEY_SEED = "creatorpulse-ai-internal-key-seed-production-override-recommended"


def _get_fernet_key() -> bytes:
    key_env = os.getenv("DATABASE_ENCRYPTION_KEY")
    if key_env:
        # If provided key is already a valid 32-byte url-safe base64, use directly
        try:
            decoded = base64.urlsafe_b64decode(key_env)
            if len(decoded) == 32:
                return key_env.encode("utf-8")
        except Exception:
            pass
        # Derive a 32-byte SHA256 key from provided string
        derived = hashlib.sha256(key_env.encode("utf-8")).digest()
        return base64.urlsafe_b64encode(derived)
    
    # Dev fallback derived key
    derived = hashlib.sha256(_DEFAULT_KEY_SEED.encode("utf-8")).digest()
    return base64.urlsafe_b64encode(derived)


_FERNET_INSTANCE: Optional[Fernet] = None


def get_cipher() -> Fernet:
    global _FERNET_INSTANCE
    if _FERNET_INSTANCE is None:
        _FERNET_INSTANCE = Fernet(_get_fernet_key())
    return _FERNET_INSTANCE


def encrypt_secret(plaintext: Optional[str]) -> Optional[str]:
    """Encrypts plaintext string into base64 ciphertext token. Returns None if input is None."""
    if plaintext is None:
        return None
    cipher = get_cipher()
    token = cipher.encrypt(plaintext.encode("utf-8"))
    return token.decode("utf-8")


def decrypt_secret(ciphertext: Optional[str]) -> Optional[str]:
    """Decrypts ciphertext token into original plaintext string. Returns None if input is None."""
    if ciphertext is None:
        return None
    cipher = get_cipher()
    try:
        decrypted = cipher.decrypt(ciphertext.encode("utf-8"))
        return decrypted.decode("utf-8")
    except Exception:
        # Return None or empty string if token is invalid/corrupt
        return None
