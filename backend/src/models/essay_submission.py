"""EssaySubmission model (T024) — data-model.md.

One row per submission ATTEMPT. Per FR-009 and data-model.md's State Transitions, a
retry after FAILED or a correction after REJECTED is a *new* row, never a mutation of
the old one: `status` is terminal for the attempt it describes. That keeps the state
machine trivial (Constitution VI) and preserves an honest audit trail of what the
learner actually submitted and what happened to it.
"""

from __future__ import annotations

import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.connections import Base


class TaskType(str, enum.Enum):
    TASK_1 = "TASK_1"
    TASK_2 = "TASK_2"


class SubmissionStatus(str, enum.Enum):
    SCORED = "SCORED"
    REJECTED = "REJECTED"
    FAILED = "FAILED"


class RejectionReason(str, enum.Enum):
    BELOW_MIN_WORDS = "BELOW_MIN_WORDS"
    UNSCOREABLE = "UNSCOREABLE"


class EssaySubmission(Base):
    __tablename__ = "essay_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    task_type: Mapped[TaskType] = mapped_column(
        Enum(TaskType, name="task_type"), nullable=False
    )
    prompt_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    essay_text: Mapped[str] = mapped_column(Text, nullable=False)
    word_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[SubmissionStatus] = mapped_column(
        Enum(SubmissionStatus, name="submission_status"), nullable=False, index=True
    )
    rejection_reason: Mapped[RejectionReason | None] = mapped_column(
        Enum(RejectionReason, name="rejection_reason"), nullable=True
    )
    # Kept for operators diagnosing a FAILED run; never returned to the learner, whose
    # 503 body is a fixed generic message per the OpenAPI contract.
    failure_detail: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    result: Mapped["AssessmentResult | None"] = relationship(
        back_populates="submission", cascade="all, delete-orphan", uselist=False
    )
