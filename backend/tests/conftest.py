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


# --------------------------------------------------------------------------- #
# 001-ielts-score-assessment fixtures
# --------------------------------------------------------------------------- #

# A real-shaped Task 2 essay, comfortably over the 250-word minimum. Written to contain
# specific quotable spans so evidence-verification tests can assert on genuine quotes
# rather than on strings that happen to appear.
TASK_2_ESSAY = """\
In recent decades, social media has fundamentally reshaped the way people communicate
with one another. Some commentators argue that this shift has impoverished human
relationships, while others maintain that it has widened access to community and
information. In my view, the benefits outweigh the drawbacks, provided that users
remain deliberate about how they spend their time online.

Those who criticise social media point to a decline in face-to-face interaction. It is
certainly true that a conversation conducted through short written messages lacks the
tone, expression and immediacy of speaking in person. Furthermore, the design of many
platforms rewards brevity and reaction rather than reflection, which can encourage
superficial exchanges. Critics also note that the constant visibility of other people's
curated lives may contribute to anxiety among younger users in particular.

Nevertheless, these criticisms overlook the genuine advantages that these technologies
have delivered. For people separated by distance, social media sustains relationships
that would previously have faded through simple lack of contact. Migrant workers can
speak to their children daily; patients with rare conditions can find others who
understand their experience. In professional contexts, these networks have flattened
access to expertise that was once confined to institutions.

The decisive question is not whether social media is inherently good or bad, but how it
is used. A platform that replaces every conversation is harmful; one that supplements
relationships already grounded in the physical world is not. Education therefore has an
important role to play in teaching young people to use these tools deliberately.

In conclusion, while the concerns raised by critics deserve serious attention, I believe
that social media has expanded human connection more than it has diminished it. The
responsibility lies with users and educators to ensure that the technology serves
relationships rather than substituting for them.
"""

# A genuine substring of TASK_2_ESSAY — used to exercise the verified-quote path.
REAL_QUOTE = "social media has fundamentally reshaped the way people communicate"

# Deliberately absent from TASK_2_ESSAY — exercises the fabrication-detection path.
FABRICATED_QUOTE = "the author categorically rejects all forms of modern technology"


@pytest.fixture
def fake_llm():
    """The default offline LLM double: band 6.0, quoting real essay text."""
    from tests.fakes.fake_llm_client import FakeLLMClient

    return FakeLLMClient(band=6.0, quote=REAL_QUOTE)


@pytest.fixture
def scoring_client(client: TestClient, fake_llm):
    """`client`, with the live OpenRouter dependency replaced by the offline fake.

    Every assessment test goes through this so the suite makes zero network calls and
    costs nothing to run (Constitution III + V).
    """
    from src.routes.assessments import get_llm_client

    app.dependency_overrides[get_llm_client] = lambda: fake_llm
    yield client
    app.dependency_overrides.pop(get_llm_client, None)


@pytest.fixture
def override_llm(client: TestClient):
    """Install a specific FakeLLMClient for tests needing non-default behaviour."""
    from src.routes.assessments import get_llm_client

    def _install(fake):
        app.dependency_overrides[get_llm_client] = lambda: fake
        return client

    yield _install
    app.dependency_overrides.pop(get_llm_client, None)
