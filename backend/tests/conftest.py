from collections.abc import Generator

import psycopg
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from src.main import app
from src.utils.config import Settings, get_settings
from src.database.connections import Base, get_db

TEST_DB_NAME = "writewise_test"


def _admin_dsn(settings: Settings) -> str:
    # Same server as DATABASE_URL, but the `postgres` maintenance database.
    return settings.database_url.replace("/writewise", "/postgres").replace(
        "postgresql+psycopg://", "postgresql://"
    )


def _test_database_url(settings: Settings) -> str:
    return settings.database_url.replace("/writewise", f"/{TEST_DB_NAME}")


@pytest.fixture(scope="session")
def test_settings() -> Settings:
    return get_settings()


@pytest.fixture(scope="session", autouse=True)
def _ensure_test_database(test_settings: Settings) -> None:
    """Creates the writewise_test database on the same Postgres server if missing."""
    admin_conn = psycopg.connect(_admin_dsn(test_settings), autocommit=True)
    try:
        with admin_conn.cursor() as cur:
            cur.execute("SELECT 1 FROM pg_database WHERE datname = %s", (TEST_DB_NAME,))
            if cur.fetchone() is None:
                cur.execute(f'CREATE DATABASE "{TEST_DB_NAME}"')
    finally:
        admin_conn.close()


@pytest.fixture(scope="session")
def test_engine(test_settings: Settings, _ensure_test_database: None):
    engine = create_engine(_test_database_url(test_settings))
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def db_session(test_engine) -> Generator[Session, None, None]:
    """Each test runs inside an outer transaction + SAVEPOINT so route-handler
    `session.commit()` calls don't leak data between tests (SQLAlchemy 2.0 pattern)."""
    connection = test_engine.connect()
    outer_transaction = connection.begin()

    TestSessionLocal = sessionmaker(
        bind=connection, join_transaction_mode="create_savepoint", autoflush=False
    )
    session = TestSessionLocal()

    try:
        yield session
    finally:
        session.close()
        outer_transaction.rollback()
        connection.close()


@pytest.fixture
def client(db_session: Session) -> Generator[TestClient, None, None]:
    def _override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    # base_url must be https:// — the refresh-token cookie is Secure (research.md decision 4),
    # and httpx's cookie jar (unlike curl's) correctly refuses to resend Secure cookies over a
    # plain http:// connection, which would otherwise break every multi-request test below.
    # This also matches production, where frontend and backend are both served over https.
    with TestClient(app, base_url="https://testserver") as test_client:
        yield test_client
    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def authed_client_factory(client: TestClient):
    """Returns a helper that signs up a fresh account and gives back
    (client, access_token, account_json) for tests that need an authenticated user."""

    def _make(email: str, password: str = "correcthorse123", display_name: str | None = None):
        payload = {"email": email, "password": password}
        if display_name:
            payload["display_name"] = display_name
        response = client.post("/api/v1/auth/signup", json=payload)
        assert response.status_code == 201, response.text
        body = response.json()
        return client, body["access_token"], body["user"]

    return _make
