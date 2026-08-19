import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.connections import Base


class Account(Base):
    """The learner account record.

    Base identity fields (id, email, created_at) are the prerequisite shape
    001-ielts-score-assessment's data-model.md describes; the authentication fields
    (password_hash, display_name, updated_at) are owned by 003-account-authentication
    per its data-model.md. Named `Account`, not `Learner`/`User`, per /speckit-analyze
    finding I2 (canonical name across 001/002/003).
    """

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(320), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    display_name: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    refresh_sessions: Mapped[list["RefreshSession"]] = relationship(
        back_populates="account", cascade="all, delete-orphan"
    )
