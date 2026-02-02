"""
Supabase JWT Authentication Module

Handles JWT verification for user authentication.
Uses Supabase for JWT validation with HS256 algorithm.

Security Notes:
- Always verify audience claim to prevent token confusion attacks
- Enforce expiration to limit token validity window
- Log failed auth attempts for security monitoring
"""

import os
import logging
import re
from typing import Optional, Tuple
from dataclasses import dataclass

import jwt
from jwt.exceptions import (
    InvalidTokenError,
    ExpiredSignatureError,
    InvalidAudienceError,
    DecodeError,
    InvalidSignatureError,
    MissingRequiredClaimError
)

logger = logging.getLogger(__name__)

# Local development mode - set LOCAL_DEV=true to bypass auth
LOCAL_DEV = os.getenv("LOCAL_DEV", "false").lower() == "true"

# JWT token format validation (basic sanity check)
JWT_PATTERN = re.compile(r'^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$')


@dataclass
class UserInfo:
    """Authenticated user information extracted from JWT."""
    user_id: str
    email: Optional[str] = None
    user_name: Optional[str] = None

    def __post_init__(self):
        """Validate user_id is not empty."""
        if not self.user_id or not self.user_id.strip():
            raise ValueError("user_id cannot be empty")


class AuthError(Exception):
    """
    Authentication error with HTTP status code.

    Attributes:
        message: Human-readable error message
        status_code: HTTP status code (401 for auth failures, 500 for config errors)
        error_code: Machine-readable error code for frontend handling
    """
    def __init__(self, message: str, status_code: int = 401, error_code: str = "auth_failed"):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        super().__init__(self.message)


class JWTVerifier:
    """
    Verifies Supabase JWTs using HS256 algorithm.

    Supabase uses HS256 (symmetric) with JWT secret for server-side verification.
    This is more common and simpler than RS256/JWKS for backend services.

    Security Features:
    - Validates token format before decoding
    - Requires and verifies 'exp' (expiration) claim
    - Requires and verifies 'sub' (subject/user_id) claim
    - Verifies 'aud' (audience) matches 'authenticated'
    - Only allows HS256 algorithm (prevents algorithm confusion attacks)
    """

    # Supabase audience claim
    EXPECTED_AUDIENCE = "authenticated"

    # Only allow HS256 (prevent algorithm confusion attacks)
    ALLOWED_ALGORITHMS = ["HS256"]

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

        # Log configuration status at initialization
        if not self.supabase_url:
            logger.warning("SUPABASE_URL not set - auth will fail in production")
        if not self.jwt_secret:
            logger.warning("SUPABASE_JWT_SECRET not set - auth will fail in production")

    def _validate_config(self) -> None:
        """Ensure required configuration is present."""
        if not self.jwt_secret:
            raise AuthError(
                "Server configuration error: SUPABASE_JWT_SECRET not set",
                status_code=500,
                error_code="config_error"
            )

    def _validate_token_format(self, token: str) -> str:
        """
        Validate and clean token format.

        Args:
            token: Raw token string (may include 'Bearer ' prefix)

        Returns:
            Cleaned token without prefix

        Raises:
            AuthError: If token format is invalid
        """
        if not token:
            raise AuthError("No token provided", error_code="missing_token")

        # Remove 'Bearer ' prefix if present (case-insensitive)
        if token.lower().startswith("bearer "):
            token = token[7:]

        # Strip whitespace
        token = token.strip()

        if not token:
            raise AuthError("Empty token after prefix removal", error_code="empty_token")

        # Basic JWT format validation (three base64url parts separated by dots)
        if not JWT_PATTERN.match(token):
            logger.warning("Invalid JWT format received")
            raise AuthError("Invalid token format", error_code="invalid_format")

        return token

    def verify_token(self, token: str) -> UserInfo:
        """
        Verify a Supabase JWT and extract user information.

        Args:
            token: The JWT token (with or without 'Bearer ' prefix)

        Returns:
            UserInfo with user_id, email, and user_name

        Raises:
            AuthError: If token is invalid, expired, or verification fails
        """
        self._validate_config()

        # Validate and clean token format
        token = self._validate_token_format(token)

        try:
            # Decode and verify the JWT
            payload = jwt.decode(
                token,
                self.jwt_secret,
                algorithms=self.ALLOWED_ALGORITHMS,
                audience=self.EXPECTED_AUDIENCE,
                options={
                    "require": ["exp", "sub"],
                    "verify_exp": True,
                    "verify_aud": True,
                    "verify_signature": True,
                }
            )

            # Extract user info from payload
            user_id = payload.get("sub")
            if not user_id:
                raise AuthError("Token missing user ID (sub claim)", error_code="missing_sub")

            # Supabase includes user metadata in the token
            user_metadata = payload.get("user_metadata", {})
            email = payload.get("email") or user_metadata.get("email")

            # Extract display name with fallback chain
            user_name = (
                user_metadata.get("full_name") or
                user_metadata.get("name") or
                (email.split("@")[0] if email else None)
            )

            logger.info(f"Successfully verified token for user: {user_id[:8]}...")

            return UserInfo(
                user_id=user_id,
                email=email,
                user_name=user_name
            )

        except ExpiredSignatureError:
            logger.warning("Token expired")
            raise AuthError("Token has expired", error_code="token_expired")
        except InvalidAudienceError:
            logger.warning("Invalid audience in token")
            raise AuthError("Invalid token audience", error_code="invalid_audience")
        except InvalidSignatureError:
            logger.warning("Invalid signature in token")
            raise AuthError("Invalid token signature", error_code="invalid_signature")
        except MissingRequiredClaimError as e:
            logger.warning(f"Missing required claim: {e}")
            raise AuthError(f"Token missing required claim", error_code="missing_claim")
        except DecodeError as e:
            logger.warning(f"Token decode error: {e}")
            raise AuthError("Failed to decode token", error_code="decode_error")
        except InvalidTokenError as e:
            logger.warning(f"Invalid token: {e}")
            raise AuthError(f"Invalid token: {str(e)}", error_code="invalid_token")
        except Exception as e:
            logger.error(f"Unexpected error verifying token: {type(e).__name__}: {e}")
            raise AuthError("Token verification failed", error_code="verification_failed")


# Global verifier instance
_verifier: Optional[JWTVerifier] = None


def get_verifier() -> JWTVerifier:
    """Get or create the global JWT verifier instance."""
    global _verifier
    if _verifier is None:
        _verifier = JWTVerifier()
    return _verifier


def verify_jwt(token: str) -> Tuple[str, Optional[str]]:
    """
    Convenience function to verify JWT and return user info.

    Args:
        token: JWT token (with or without 'Bearer ' prefix)

    Returns:
        Tuple of (user_id, user_name)

    Raises:
        AuthError: If verification fails (401) or server config error (500)
    """
    # LOCAL DEV MODE: Return mock user, skip actual JWT verification
    if LOCAL_DEV:
        logger.info("LOCAL_DEV mode: bypassing JWT verification")
        return "local-dev-user", "Local Developer"

    verifier = get_verifier()
    user_info = verifier.verify_token(token)
    return user_info.user_id, user_info.user_name


async def verify_jwt_async(token: str) -> Tuple[str, Optional[str]]:
    """
    Async version of verify_jwt for use in FastAPI dependencies.

    JWT verification is CPU-bound, so this just wraps the sync version.
    For JWKS-based verification with HTTP calls, this would be truly async.
    """
    return verify_jwt(token)
