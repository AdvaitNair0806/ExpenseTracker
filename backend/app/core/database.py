"""
Database connection manager supporting both MongoDB (via Motor) and PostgreSQL (via SQLAlchemy async).
Toggle configured via DATABASE_TYPE in .env.
"""
import logging
from app.core.config import settings

logger = logging.getLogger(__name__)

# MongoDB Client instance (placeholder / lazy loaded)
mongodb_client = None
mongodb_db = None

# PostgreSQL Session Factory placeholder
postgres_engine = None
postgres_session_local = None

async def init_db():
    global mongodb_client, mongodb_db, postgres_engine, postgres_session_local
    
    if settings.DATABASE_TYPE == "mongodb":
        try:
            from motor.motor_asyncio import AsyncIOMotorClient
            mongodb_client = AsyncIOMotorClient(settings.MONGODB_URI)
            mongodb_db = mongodb_client[settings.MONGODB_DB_NAME]
            logger.info("Connected to MongoDB: %s", settings.MONGODB_DB_NAME)
        except Exception as e:
            logger.warning("MongoDB connection could not be established: %s", e)
            
    elif settings.DATABASE_TYPE == "postgresql":
        try:
            from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
            postgres_engine = create_async_engine(settings.DATABASE_URL, echo=settings.DEBUG)
            postgres_session_local = async_sessionmaker(autocommit=False, autoflush=False, bind=postgres_engine)
            logger.info("Connected to PostgreSQL via SQLAlchemy async")
        except Exception as e:
            logger.warning("PostgreSQL connection could not be established: %s", e)

async def close_db():
    global mongodb_client, postgres_engine
    if mongodb_client:
        mongodb_client.close()
        logger.info("Closed MongoDB connection.")
    if postgres_engine:
        await postgres_engine.dispose()
        logger.info("Disposed PostgreSQL engine.")
