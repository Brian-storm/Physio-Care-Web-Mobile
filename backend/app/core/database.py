"""PhysioCare — Database engine and session management via SQLModel."""

from sqlmodel import SQLModel, create_engine, Session
from app.core.config import settings

engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if "sqlite" in settings.database_url else {},
    echo=settings.debug,
)


def get_session():
    """Yield a SQLModel database session for dependency injection."""
    with Session(engine) as session:
        yield session


def init_db():
    """Create all defined SQLModel tables in the database."""
    SQLModel.metadata.create_all(engine)