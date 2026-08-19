from fastapi import APIRouter, Depends, Request, Response, status
from sqlalchemy.orm import Session

from src.auth.deps import get_current_account
from src.auth.errors import AuthDomainError, InvalidCredentialsError, SessionExpiredError
from src.auth.sessions import (
    issue_refresh_session,
    revoke_session_by_raw_token,
    rotate_refresh_session,
)
from src.auth.throttle import ensure_not_throttled, record_failed_attempt
from src.auth.tokens import create_access_token
from src.auth.validation import ensure_signup_is_valid, normalize_email
from src.database.connections import get_db
from src.models import Account
from src.schemas import Account as AccountSchema
from src.schemas import AuthResponse, SigninRequest, SignupRequest
from src.utils.config import get_settings
from src.utils.logging import get_logger, redact
from src.utils.passwords import hash_password, verify_password

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
logger = get_logger("auth")
settings = get_settings()

REFRESH_COOKIE_NAME = "refresh_token"


def _client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _set_refresh_cookie(response: Response, raw_token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        path="/api/v1/auth",
    )


def _clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(key=REFRESH_COOKIE_NAME, path="/api/v1/auth", samesite="none")


def _auth_response(db: Session, account: Account) -> AuthResponse:
    access_token, expires_in = create_access_token(account.id)
    return AuthResponse(
        access_token=access_token,
        expires_in=expires_in,
        user=AccountSchema.model_validate(account),
    )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    ensure_signup_is_valid(db, email, payload.password)

    account = Account(
        email=email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name or email.split("@")[0],
    )
    db.add(account)
    db.flush()

    _, raw_refresh_token = issue_refresh_session(
        db, account.id, ip_address=_client_ip(request), user_agent=request.headers.get("user-agent")
    )
    db.commit()
    db.refresh(account)

    _set_refresh_cookie(response, raw_refresh_token)
    logger.info("auth_event", extra=redact({"event": "signup", "account_id": str(account.id)}))
    return _auth_response(db, account)


@router.post("/signin", response_model=AuthResponse)
def signin(payload: SigninRequest, request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    email = normalize_email(payload.email)
    ip_address = _client_ip(request)

    ensure_not_throttled(db, email, ip_address)

    account = db.query(Account).filter(Account.email == email).first()
    if account is None or not verify_password(payload.password, account.password_hash):
        record_failed_attempt(db, email, ip_address)
        db.commit()
        logger.info("auth_event", extra=redact({"event": "signin_failed", "email": email}))
        raise InvalidCredentialsError()

    _, raw_refresh_token = issue_refresh_session(
        db, account.id, ip_address=ip_address, user_agent=request.headers.get("user-agent")
    )
    db.commit()
    db.refresh(account)

    _set_refresh_cookie(response, raw_refresh_token)
    logger.info("auth_event", extra=redact({"event": "signin", "account_id": str(account.id)}))
    return _auth_response(db, account)


@router.post("/refresh", response_model=AuthResponse)
def refresh(request: Request, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_token is None:
        raise SessionExpiredError("No refresh session present.")

    try:
        new_session, new_raw_token = rotate_refresh_session(
            db,
            raw_token,
            ip_address=_client_ip(request),
            user_agent=request.headers.get("user-agent"),
        )
    except AuthDomainError:
        db.commit()  # persist any reuse-detection revocation even though this request 401s
        logger.warning("auth_event", extra=redact({"event": "refresh_rejected"}))
        raise

    account = db.get(Account, new_session.user_id)
    db.commit()
    db.refresh(account)

    _set_refresh_cookie(response, new_raw_token)
    logger.info("auth_event", extra=redact({"event": "refresh", "account_id": str(account.id)}))
    return _auth_response(db, account)


@router.post("/signout", status_code=status.HTTP_204_NO_CONTENT)
def signout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    current_account: Account = Depends(get_current_account),
) -> Response:
    raw_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_token is None or not revoke_session_by_raw_token(db, raw_token):
        raise SessionExpiredError("No valid session to sign out of.")
    db.commit()
    _clear_refresh_cookie(response)
    logger.info(
        "auth_event", extra=redact({"event": "signout", "account_id": str(current_account.id)})
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/me", response_model=AccountSchema)
def me(current_account: Account = Depends(get_current_account)) -> AccountSchema:
    return AccountSchema.model_validate(current_account)
