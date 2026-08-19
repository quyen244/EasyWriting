class AuthDomainError(Exception):
    """Base class for domain-level auth failures; each maps to one AuthError code+status."""

    error_code: str
    status_code: int


class EmailAlreadyRegisteredError(AuthDomainError):
    error_code = "EMAIL_ALREADY_REGISTERED"
    status_code = 409

    def __init__(self) -> None:
        super().__init__("An account with this email already exists.")


class WeakPasswordError(AuthDomainError):
    error_code = "WEAK_PASSWORD"
    status_code = 400

    def __init__(self) -> None:
        super().__init__("Password must be at least 8 characters long.")


class InvalidCredentialsError(AuthDomainError):
    error_code = "INVALID_CREDENTIALS"
    status_code = 401

    def __init__(self) -> None:
        super().__init__("Incorrect email or password.")


class TooManyAttemptsError(AuthDomainError):
    error_code = "TOO_MANY_ATTEMPTS"
    status_code = 429

    def __init__(self) -> None:
        super().__init__("Too many failed sign-in attempts. Try again later.")


class SessionExpiredError(AuthDomainError):
    error_code = "SESSION_EXPIRED"
    status_code = 401

    def __init__(self, message: str = "Session expired or invalid. Please sign in again.") -> None:
        super().__init__(message)
