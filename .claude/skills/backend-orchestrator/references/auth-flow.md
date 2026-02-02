# Supabase JWT Authentication Flow

Detailed patterns for JWT verification in GridAgent's backend.

## Table of Contents

1. [Overview](#overview)
2. [JWT Structure](#jwt-structure)
3. [JWTVerifier Class](#jwtverifier-class)
4. [FastAPI Integration](#fastapi-integration)
5. [Local Development Mode](#local-development-mode)
6. [Error Handling](#error-handling)

## Overview

GridAgent uses Supabase for authentication. The flow:

1. Frontend authenticates user with Supabase
2. Frontend receives JWT token
3. Frontend sends JWT to backend in `Authorization: Bearer <token>` header
4. Backend verifies JWT using `SUPABASE_JWT_SECRET`
5. Backend extracts `user_id` and `user_name` from claims

## JWT Structure

Supabase JWTs contain these key claims:

```json
{
  "sub": "user-uuid-here",          // User ID (required)
  "email": "user@example.com",       // User email
  "exp": 1234567890,                 // Expiration timestamp (required)
  "aud": "authenticated",            // Audience (verified)
  "user_metadata": {
    "full_name": "John Doe",
    "name": "John"
  }
}
```

## JWTVerifier Class

### Configuration

```python
class JWTVerifier:
    """
    Verifies Supabase JWTs.

    Supabase uses HS256 (symmetric) with JWT secret for server-side verification.
    """

    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_KEY")
        self.jwt_secret = os.getenv("SUPABASE_JWT_SECRET")

        if not self.supabase_url:
            logger.warning("SUPABASE_URL not set - auth will fail")
        if not self.jwt_secret:
            logger.warning("SUPABASE_JWT_SECRET not set - auth will fail")
```

### verify_token() Method

```python
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
    # Remove 'Bearer ' prefix if present
    if token.startswith("Bearer "):
        token = token[7:]

    try:
        # Decode and verify the JWT
        payload = jwt.decode(
            token,
            self.jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",  # Supabase uses this audience
            options={
                "require": ["exp", "sub"],  # sub is the user_id
                "verify_exp": True,
                "verify_aud": True,
            }
        )

        # Extract user info from payload
        user_id = payload.get("sub")
        if not user_id:
            raise AuthError("Token missing user ID (sub claim)")

        # Extract user metadata
        user_metadata = payload.get("user_metadata", {})
        email = payload.get("email") or user_metadata.get("email")
        user_name = (
            user_metadata.get("full_name") or
            user_metadata.get("name") or
            email.split("@")[0] if email else None
        )

        return UserInfo(
            user_id=user_id,
            email=email,
            user_name=user_name
        )

    except ExpiredSignatureError:
        raise AuthError("Token has expired")
    except InvalidTokenError as e:
        raise AuthError(f"Invalid token: {str(e)}")
```

### UserInfo Data Class

```python
@dataclass
class UserInfo:
    """Authenticated user information extracted from JWT."""
    user_id: str
    email: Optional[str] = None
    user_name: Optional[str] = None
```

### AuthError Exception

```python
class AuthError(Exception):
    """Authentication error with HTTP status code."""
    def __init__(self, message: str, status_code: int = 401):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)
```

## FastAPI Integration

### Dependency for Protected Routes

```python
async def get_current_user(authorization: Optional[str] = Header(None)) -> UserInfo:
    """
    FastAPI dependency to verify JWT and get current user.

    Usage:
        @app.post("/api/start-session")
        async def start_session(user: UserInfo = Depends(get_current_user)):
            ...
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header required"
        )

    try:
        user_id, user_name = await verify_jwt_async(authorization)
        return UserInfo(user_id=user_id, user_name=user_name)
    except AuthError as e:
        raise HTTPException(
            status_code=e.status_code,
            detail=e.message
        )
```

### Singleton Verifier Pattern

```python
# Global verifier instance
_verifier: Optional[JWTVerifier] = None

def get_verifier() -> JWTVerifier:
    """Get or create the global JWT verifier instance."""
    global _verifier
    if _verifier is None:
        _verifier = JWTVerifier()
    return _verifier
```

### Convenience Functions

```python
def verify_jwt(token: str) -> Tuple[str, Optional[str]]:
    """
    Convenience function to verify JWT and return user info.

    Returns:
        Tuple of (user_id, user_name)
    """
    verifier = get_verifier()
    user_info = verifier.verify_token(token)
    return user_info.user_id, user_info.user_name


async def verify_jwt_async(token: str) -> Tuple[str, Optional[str]]:
    """
    Async version for FastAPI dependencies.

    JWT verification is CPU-bound, so this wraps the sync version.
    """
    return verify_jwt(token)
```

## Local Development Mode

For local testing without Supabase:

```python
# Set LOCAL_DEV=true in environment
LOCAL_DEV = os.getenv("LOCAL_DEV", "false").lower() == "true"

def verify_jwt(token: str) -> Tuple[str, Optional[str]]:
    # LOCAL DEV MODE: Return mock user
    if LOCAL_DEV:
        logger.info("LOCAL_DEV mode: bypassing JWT verification")
        return "local-dev-user", "Local Developer"

    # Normal verification
    verifier = get_verifier()
    user_info = verifier.verify_token(token)
    return user_info.user_id, user_info.user_name
```

## Error Handling

### Error Responses

| Status | Error | Cause |
|--------|-------|-------|
| 401 | "Authorization header required" | No Authorization header |
| 401 | "Token has expired" | JWT exp claim in the past |
| 401 | "Invalid token: ..." | Malformed JWT, wrong signature |
| 401 | "Token missing user ID (sub claim)" | No sub claim in payload |
| 500 | "Server configuration error: SUPABASE_JWT_SECRET not set" | Missing env var |

### Exception Handler (Optional)

```python
@app.exception_handler(AuthError)
async def auth_error_handler(request, exc: AuthError):
    """Handle authentication errors."""
    return HTTPException(
        status_code=exc.status_code,
        detail=exc.message
    )
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| SUPABASE_URL | Yes | Your Supabase project URL |
| SUPABASE_KEY | Yes | Supabase anon key (for future use) |
| SUPABASE_JWT_SECRET | Yes | JWT secret for HS256 verification |
| LOCAL_DEV | No | Set "true" to bypass auth |

## Finding Your JWT Secret

1. Go to Supabase Dashboard
2. Project Settings -> API
3. Under "JWT Settings", copy the "JWT Secret"
4. Set as `SUPABASE_JWT_SECRET` environment variable

## Testing Auth

### With curl

```bash
# Get a token from Supabase (frontend does this)
# Then test the endpoint:
curl -X POST http://localhost:8000/api/start-session \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### With LOCAL_DEV

```bash
# Set LOCAL_DEV=true
# Any token (or no token) will work
curl -X POST http://localhost:8000/api/start-session \
  -H "Authorization: Bearer fake-token" \
  -H "Content-Type: application/json" \
  -d '{}'
```
