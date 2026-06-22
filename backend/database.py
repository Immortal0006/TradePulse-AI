import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Fetch database credentials from Docker environment config (fall back to localhost for local testing)
DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:postgres@localhost:5432/tradepulse"
)

# Create high-performance connections pooling for PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True  # Automatically checks and discards dead pool connections
)

# Session Local factory for spawning transactional blocks
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative database models mapping
Base = declarative_base()

def get_db():
    """
    FastAPI Dependency to inject transactional database sessions cleanly.
    Closes database handles safely even if exceptions or crashes occur.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()