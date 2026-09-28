"""PhysioCare — SQLModel ORM models: Patient, PrescribedExercise, SessionRecord, FlaggedClip."""

import uuid
from datetime import datetime
from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, TYPE_CHECKING

if TYPE_CHECKING:
    pass


class Patient(SQLModel, table=True):
    """A patient under the care of a therapist. Stores diagnosis, goals, and basic info."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    name: str
    therapist_id: str
    diagnosis: str = ""
    goals: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)


class PrescribedExercise(SQLModel, table=True):
    """An exercise prescribed by a therapist, with clinical goals and safety limits."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    name: str
    description: str = ""
    clinical_goal: str = ""
    target_sets: int = 3
    target_reps: int = 12
    safety_max_knee_valgus: float = 0.08
    safety_min_hip_angle: float = 60.0
    safety_max_back_arch: float = 40.0
    safety_max_pain_score: int = 7
    created_at: datetime = Field(default_factory=datetime.utcnow)


class SessionRecord(SQLModel, table=True):
    """A completed exercise session with form scores, danger levels, and pain self-report."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    patient_id: str = Field(foreign_key="patient.id")
    exercise_id: str = Field(foreign_key="prescribedexercise.id")
    reps_completed: int = 0
    sets_completed: int = 0
    avg_form_score: float = 0.0
    max_danger_score: float = 0.0
    pain_score: int = 0
    flagged: bool = False
    duration_seconds: int = 0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None


class FlaggedClip(SQLModel, table=True):
    """A 5-second video clip captured during a flagged session for therapist review."""

    id: str = Field(default_factory=lambda: str(uuid.uuid4()), primary_key=True)
    session_id: str = Field(foreign_key="sessionrecord.id")
    patient_id: str = Field(foreign_key="patient.id")
    clip_url: str = ""
    reason: str = ""
    reviewed: bool = False
    therapist_note: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)