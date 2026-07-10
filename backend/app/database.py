from sqlalchemy import create_engine, MetaData
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# Strict naming conventions prevent constraint migration bugs in PostgreSQL
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

metadata = MetaData(naming_convention=convention)
Base = declarative_base(metadata=metadata)

# Cloud optimized connection engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=5,             # Keeps a stable pool of connections open to Neon
    max_overflow=10,         # Allows extra burst connections if web traffic spikes
    pool_pre_ping=True       # Checks if connection is dead before trying to use it
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()