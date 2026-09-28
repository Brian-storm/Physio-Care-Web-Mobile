"""PhysioCare — REST API endpoints for patients, exercises, sessions, and progress reports."""

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select
from app.core.database import get_session
from app.models.models import Patient, PrescribedExercise, SessionRecord
from app.schemas.schemas import (
    PatientCreate,
    PatientResponse,
    ExerciseCreate,
    ExerciseResponse,
    SessionCreate,
    SessionResponse,
    ProgressReport,
)

router = APIRouter(prefix="/api/v1", tags=["patients"])


@router.post("/patients", response_model=PatientResponse)
def create_patient(data: PatientCreate, session: Session = Depends(get_session)):
    """Create a new patient record."""
    patient = Patient(**data.model_dump())
    session.add(patient)
    session.commit()
    session.refresh(patient)
    return patient


@router.get("/patients", response_model=list[PatientResponse])
def list_patients(session: Session = Depends(get_session)):
    """List all patients."""
    return session.exec(select(Patient)).all()


@router.get("/patients/{patient_id}", response_model=PatientResponse)
def get_patient(patient_id: str, session: Session = Depends(get_session)):
    """Get a single patient by ID."""
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient


@router.post("/exercises", response_model=ExerciseResponse)
def create_exercise(data: ExerciseCreate, session: Session = Depends(get_session)):
    """Prescribe an exercise for a patient."""
    exercise = PrescribedExercise(**data.model_dump())
    session.add(exercise)
    session.commit()
    session.refresh(exercise)
    return exercise


@router.get("/patients/{patient_id}/exercises", response_model=list[ExerciseResponse])
def list_patient_exercises(patient_id: str, session: Session = Depends(get_session)):
    """Get all exercises prescribed to a patient."""
    return session.exec(
        select(PrescribedExercise).where(PrescribedExercise.patient_id == patient_id)
    ).all()


@router.post("/sessions", response_model=SessionResponse)
def create_session(data: SessionCreate, session: Session = Depends(get_session)):
    """Record a completed exercise session with scores and flags."""
    record = SessionRecord(**data.model_dump())
    session.add(record)
    session.commit()
    session.refresh(record)
    return record


@router.get("/patients/{patient_id}/sessions", response_model=list[SessionResponse])
def list_patient_sessions(patient_id: str, session: Session = Depends(get_session)):
    """List all exercise sessions for a patient, most recent first."""
    return session.exec(
        select(SessionRecord)
        .where(SessionRecord.patient_id == patient_id)
        .order_by(SessionRecord.started_at.desc())
    ).all()


@router.get("/patients/{patient_id}/progress", response_model=ProgressReport)
def get_progress_report(patient_id: str, session: Session = Depends(get_session)):
    """Generate an aggregated progress report with trend analysis for a patient."""
    patient = session.get(Patient, patient_id)
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    sessions = session.exec(
        select(SessionRecord)
        .where(SessionRecord.patient_id == patient_id)
        .order_by(SessionRecord.started_at.desc())
    ).all()

    if not sessions:
        return ProgressReport(
            patient_id=patient_id,
            patient_name=patient.name,
            total_sessions=0,
            total_reps=0,
            avg_form_score=0.0,
            avg_danger_score=0.0,
            flagged_sessions=0,
            latest_session=None,
        )

    total_sessions = len(sessions)
    total_reps = sum(s.reps_completed for s in sessions)
    avg_form = sum(s.avg_form_score for s in sessions) / total_sessions
    avg_danger = sum(s.max_danger_score for s in sessions) / total_sessions
    flagged = sum(1 for s in sessions if s.flagged)

    latest = sessions[0]

    # Simple trend: compare first half vs second half form scores
    mid = total_sessions // 2
    if mid >= 2:
        first_half = sessions[mid:]
        second_half = sessions[:mid]
        avg_first = sum(s.avg_form_score for s in first_half) / len(first_half)
        avg_second = sum(s.avg_form_score for s in second_half) / len(second_half)
        trend = "improving" if avg_second >= avg_first else "declining"
    else:
        trend = "insufficient data"

    return ProgressReport(
        patient_id=patient_id,
        patient_name=patient.name,
        total_sessions=total_sessions,
        total_reps=total_reps,
        avg_form_score=round(avg_form, 1),
        avg_danger_score=round(avg_danger, 1),
        flagged_sessions=flagged,
        latest_session=SessionResponse(**latest.model_dump()),
        trend=trend,
    )