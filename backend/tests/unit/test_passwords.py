from src.utils.passwords import hash_password, is_password_strong_enough, verify_password


def test_hash_and_verify_round_trip() -> None:
    password = "correcthorse123"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash) is True


def test_verify_rejects_wrong_password() -> None:
    password_hash = hash_password("correcthorse123")

    assert verify_password("wrongpassword", password_hash) is False


def test_verify_rejects_garbage_hash() -> None:
    assert verify_password("anything", "not-a-real-argon2-hash") is False


def test_weak_password_rejected() -> None:
    assert is_password_strong_enough("short1") is False


def test_minimum_length_password_accepted() -> None:
    assert is_password_strong_enough("12345678") is True
