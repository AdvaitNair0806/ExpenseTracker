from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from app.core.config import settings
from app.core.database import init_db, close_db
from app.api.v1.router import api_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions: connect to DB (MongoDB or PostgreSQL)
    await init_db()
    yield
    # Shutdown actions: clean up connections
    await close_db()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance backend for AI-powered expense tracking and receipt analysis.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# ------------------------------------------------------------------------------
# CORS Middleware Configuration
# ------------------------------------------------------------------------------
origins = settings.ALLOWED_ORIGINS
if not origins or "*" in origins:
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------------------
# Health Check & Root Endpoints
# ------------------------------------------------------------------------------
@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database_configured": settings.DATABASE_TYPE,
        "ai_enabled": bool(settings.GROQ_API_KEY and settings.GROQ_API_KEY != "gsk_your_groq_api_key_here"),
        "docs": "/docs",
    }

@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
    }

# ------------------------------------------------------------------------------
# API Router Registration
# ------------------------------------------------------------------------------
from routers.transactions import router as transactions_router

# Direct /api router (GET /api/transactions, POST /api/transactions/manual, ai-text, ai-receipt, GET /api/summary)
app.include_router(transactions_router)

# API v1 Versioned endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )
