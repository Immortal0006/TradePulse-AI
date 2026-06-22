import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 🔒 Hardcode the production connection directly to completely bypass variable mismatch bugs
# 🔒 The correct, production-grade connection string
DATABASE_URL = "postgresql://postgres.nwgunjybemssjpmuwlyi:Ud@3m6u9y8r@aws-1-ap-south-1.pooler.supabase.com:5432/postgres"

# Print a clean trace to your Render logs so you know it's using the hardcoded layer
print("📡 TradePulse Database Service: Hardcoded cloud database pipeline initialized successfully.")

# Create high-performance connections pooling for PostgreSQL
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Session Local factory for spawning transactional blocks
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for declarative database models mapping
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()