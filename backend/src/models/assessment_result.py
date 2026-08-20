"""AssessmentResult model (T025) — data-model.md, research.md decision 4.

The four criterion scores live in a single JSONB `criteria` column rather than a
normalized child table. There are always exactly four, they are fixed at creation, and
nothing in this feature's scope queries or updates one independently of its parent.
A normalized table would be unjustified complexity today (Constitution VI).

That decision is reversible: the progress-dashboard feature ("your Lexical Resource
trend over time") would query criterion scores across many assessments, and *that* is
when normalizing earns its keep. Deferred until the need is concrete, not guessed at.
"""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.database.connections import Base


class AssessmentResult(Base):
    __tablename__ = "assessment_results"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submission_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("essay_submissions.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,  # 1:1 with a SCORED submission
        index=True,
    )
    overall_band: Mapped[float] = mapped_column(Numeric(2, 1), nullable=False)
    # Array of 4 CriterionScore objects; shape enforced at the pipeline layer before
    # persistence (data-model.md validation rules), not by the column type.
    criteria: Mapped[list] = mapped_column(JSONB, nullable=False)

    # Constitution IV provenance: which methodology produced this score. Without these,
    # a stored result cannot be traced to the config that generated it and the
    # before/after benchmark comparison is meaningless.
    # Which pipelines/*.yaml produced this, e.g. "pipeline-v1.0"
    pipeline_version: Mapped[str] = mapped_column(String(50), nullable=False)
    # Which prompts/<version>/ directory was used, e.g. "v1". Covers the message
    # templates AND the rubrics, since they live in the same versioned directory —
    # there is deliberately no separate rubric_version, which could only ever drift.
    prompt_version: Mapped[str] = mapped_column(String(50), nullable=False)
    model_used: Mapped[str] = mapped_column(String(120), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    submission: Mapped["EssaySubmission"] = relationship(back_populates="result")
