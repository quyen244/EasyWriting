import time
import uuid

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.auth.errors import AuthDomainError
from src.pipeline.errors import AssessmentDomainError, BelowMinWordsError
from src.routes.assessments import router as assessments_router
from src.routes.auth import router as auth_router
from src.utils.config import get_settings
from src.utils.logging import configure_logging, get_logger

settings = get_settings()
configure_logging()
logger = get_logger("api")

app = FastAPI(title="WriteWise API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=True,  # required so the frontend's cross-origin refresh cookie is sent
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context_and_timing(request: Request, call_next) -> Response:
    request_id = str(uuid.uuid4())
    start = time.perf_counter()
    response = await call_next(request)
    duration_ms = (time.perf_counter() - start) * 1000
    response.headers["X-Request-ID"] = request_id
    logger.info(
        '"request_id":"%s","method":"%s","path":"%s","status":%d,"duration_ms":%.1f',
        request_id,
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


@app.exception_handler(AuthDomainError)
async def auth_domain_error_handler(request: Request, exc: AuthDomainError) -> JSONResponse:
    headers = {"WWW-Authenticate": "Bearer"} if exc.status_code == 401 else None
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "message": str(exc)},
        headers=headers,
    )


@app.exception_handler(AssessmentDomainError)
async def assessment_domain_error_handler(
    request: Request, exc: AssessmentDomainError
) -> JSONResponse:
    """Render assessment errors as the flat bodies contracts/assessments-openapi.yaml
    defines. `minimum_words` is present only on BELOW_MIN_WORDS, exactly as specified."""
    content: dict[str, object] = {"error": exc.error_code, "message": str(exc)}
    if isinstance(exc, BelowMinWordsError):
        content["minimum_words"] = exc.minimum_words
    return JSONResponse(status_code=exc.status_code, content=content)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(auth_router)
app.include_router(assessments_router)
