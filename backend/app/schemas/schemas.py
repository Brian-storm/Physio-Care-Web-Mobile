"""PhysioCare — Pydantic request/response schemas for API endpoints."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class SessionReportRequest(BaseModel):
    total_reps: int = Field(..., ge=0)
    total_sets: int = Field(..., ge=0)
    avg_knee_angle: float
    avg_torso_lean: float
    form_score: int = Field(..., ge=0, le=100)
    flag_count: int = Field(0, ge=0)
    pain_score: int | None = Field(None, ge=0, le=10)

class SessionReportResponse(BaseModel):
    summary: str

class PatientCreate(BaseModel):
    """Request body for creating a new patient."""
    name: str
    therapist_id: str
    diagnosis: str = ""
    goals: str = ""


class PatientResponse(BaseModel):
    """Response body for a patient record."""
    id: str
    name: str
    therapist_id: str
    diagnosis: str
    goals: str
    created_at: datetime
    updated_at: datetime


class ExerciseCreate(BaseModel):
    """Request body for prescribing an exercise to a patient."""
    patient_id: str
    name: str
    description: str = ""
    clinical_goal: str = ""
    target_sets: int = 3
    target_reps: int = 12
    safety_max_knee_valgus: float = 0.08
    safety_min_hip_angle: float = 60.0
    safety_max_back_arch: float = 40.0
    safety_max_pain_score: int = 7


class ExerciseResponse(BaseModel):
    """Response body for a prescribed exercise."""
    id: str
    patient_id: str
    name: str
    description: str
    clinical_goal: str
    target_sets: int
    target_reps: int
    safety_max_knee_valgus: float
    safety_min_hip_angle: float
    safety_max_back_arch: float
    safety_max_pain_score: int


class SessionCreate(BaseModel):
    """Request body for recording a completed exercise session."""
    patient_id: str
    exercise_id: str
    reps_completed: int
    sets_completed: int
    avg_form_score: float
    max_danger_score: float
    pain_score: int = 0
    flagged: bool = False
    duration_seconds: int


class SessionResponse(BaseModel):
    """Response body for a session record."""
    id: str
    patient_id: str
    exercise_id: str
    reps_completed: int
    sets_completed: int
    avg_form_score: float
    max_danger_score: float
    pain_score: int
    flagged: bool
    duration_seconds: int
    started_at: datetime
    completed_at: Optional[datetime]


class ProgressReport(BaseModel):
    """Aggregated progress report for a patient, with trend analysis."""
    patient_id: str
    patient_name: str
    total_sessions: int
    total_reps: int
    avg_form_score: float
    avg_danger_score: float
    flagged_sessions: int
    latest_session: Optional[SessionResponse]
    trend: str = ""