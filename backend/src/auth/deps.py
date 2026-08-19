from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from src.auth.errors import SessionExpiredError
from src.auth.tokens import InvalidAccessTokenError, decode_access_token
from src.database.connections import get_db
from src.models import Account

_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_account(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db),
) -> Account:
    """Real bearer-auth dependency (FR-005 / Constitution VII: backend-owned auth gate).

    Verifies the JWT access token and loads the Account it names. Raises SessionExpiredError
    (caught by the global AuthDomainError handler in src/main.py) so every 401 in this feature
    — including this one — returns the same flat {error, message} body the OpenAPI contract
    promises, instead of FastAPI's default HTTPException {"detail": {...}} wrapping.

    This is also the shared dependency 001-ielts-score-assessment's assessments endpoint gates
    essay submission behind (FR-008 there).
    """
    if credentials is None:
        raise SessionExpiredError("Not authenticated.")

    try:
        claims = decode_access_token(credentials.credentials)
    except InvalidAccessTokenError as exc:
        raise SessionExpiredError("Not authenticated.") from exc

    account = db.get(Account, claims.sub)
    if account is None:
        raise SessionExpiredError("Not authenticated.")

    return account
