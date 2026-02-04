"""
Tests for JWT authentication module.

Tests the JWTVerifier class and related functions including:
- Token format validation
- Signature verification
- Expiration handling
- Claim extraction
"""

import os
import pytest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch

import jwt


class TestJWTVerifier:
    """Tests for the JWTVerifier class."""

    def test_valid_token_accepted(self, jwt_secret, valid_jwt_token):
        """Valid JWT should be accepted and return user info."""
        # Temporarily disable LOCAL_DEV to test actual verification
        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            # Need to reimport to pick up new env
            from auth import JWTVerifier
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            user_info = verifier.verify_token(valid_jwt_token)

            assert user_info.user_id == "test-user-123"
            assert user_info.email == "test@example.com"
            assert user_info.user_name == "Test User"

    def test_expired_token_rejected(self, jwt_secret, expired_jwt_token):
        """Expired JWT should be rejected."""
        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier, AuthError
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            with pytest.raises(AuthError) as exc_info:
                verifier.verify_token(expired_jwt_token)

            assert exc_info.value.error_code == "token_expired"
            assert exc_info.value.status_code == 401

    def test_invalid_signature_rejected(self, jwt_secret, invalid_signature_token):
        """Token with wrong signature should be rejected."""
        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier, AuthError
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            with pytest.raises(AuthError) as exc_info:
                verifier.verify_token(invalid_signature_token)

            assert exc_info.value.error_code == "invalid_signature"

    def test_missing_sub_claim_rejected(self, jwt_secret):
        """Token without sub claim should be rejected."""
        payload = {
            "email": "test@example.com",
            "aud": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier, AuthError
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            with pytest.raises(AuthError) as exc_info:
                verifier.verify_token(token)

            assert exc_info.value.error_code == "missing_claim"

    def test_invalid_audience_rejected(self, jwt_secret):
        """Token with wrong audience should be rejected."""
        payload = {
            "sub": "test-user-123",
            "aud": "wrong-audience",  # Should be "authenticated"
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier, AuthError
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            with pytest.raises(AuthError) as exc_info:
                verifier.verify_token(token)

            assert exc_info.value.error_code == "invalid_audience"


class TestTokenFormatValidation:
    """Tests for token format validation."""

    def test_bearer_prefix_removed(self, jwt_secret, valid_jwt_token):
        """Bearer prefix should be automatically removed."""
        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            # Should work with Bearer prefix
            user_info = verifier.verify_token(f"Bearer {valid_jwt_token}")
            assert user_info.user_id == "test-user-123"

    def test_empty_token_rejected(self):
        """Empty token should be rejected."""
        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier, AuthError
            verifier = JWTVerifier()

            with pytest.raises(AuthError) as exc_info:
                verifier.verify_token("")

            assert exc_info.value.error_code == "missing_token"

    def test_invalid_format_rejected(self):
        """Token without proper JWT format should be rejected."""
        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier, AuthError
            verifier = JWTVerifier()

            with pytest.raises(AuthError) as exc_info:
                verifier.verify_token("not.a.valid.jwt.token.format")

            assert exc_info.value.error_code == "invalid_format"


class TestLocalDevMode:
    """Tests for LOCAL_DEV mode."""

    def test_local_dev_bypasses_verification(self):
        """In LOCAL_DEV mode, any token should return mock user."""
        with patch.dict(os.environ, {"LOCAL_DEV": "true"}):
            # Need fresh import to pick up env change
            import importlib
            import auth
            importlib.reload(auth)

            user_id, user_name = auth.verify_jwt("any-token-at-all")

            assert user_id == "local-dev-user"
            assert user_name == "Local Developer"

    def test_local_dev_works_without_secret(self):
        """LOCAL_DEV should work even without JWT secret configured."""
        with patch.dict(os.environ, {"LOCAL_DEV": "true", "SUPABASE_JWT_SECRET": ""}):
            import importlib
            import auth
            importlib.reload(auth)

            # Should not raise even with empty secret
            user_id, user_name = auth.verify_jwt("fake-token")
            assert user_id == "local-dev-user"


class TestUserInfoExtraction:
    """Tests for user info extraction from tokens."""

    def test_extracts_email_from_payload(self, jwt_secret):
        """Should extract email from top-level payload."""
        payload = {
            "sub": "user-123",
            "email": "user@example.com",
            "aud": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            user_info = verifier.verify_token(token)
            assert user_info.email == "user@example.com"

    def test_extracts_name_from_user_metadata(self, jwt_secret):
        """Should extract full_name from user_metadata."""
        payload = {
            "sub": "user-123",
            "aud": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "user_metadata": {
                "full_name": "John Doe"
            }
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            user_info = verifier.verify_token(token)
            assert user_info.user_name == "John Doe"

    def test_fallback_name_to_email_prefix(self, jwt_secret):
        """Should fallback to email prefix if no name in metadata."""
        payload = {
            "sub": "user-123",
            "email": "johndoe@example.com",
            "aud": "authenticated",
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
            "user_metadata": {}
        }
        token = jwt.encode(payload, jwt_secret, algorithm="HS256")

        with patch.dict(os.environ, {"LOCAL_DEV": "false"}):
            from auth import JWTVerifier
            verifier = JWTVerifier()
            verifier.jwt_secret = jwt_secret

            user_info = verifier.verify_token(token)
            assert user_info.user_name == "johndoe"
