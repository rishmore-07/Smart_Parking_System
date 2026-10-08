from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
from app.api.v1.router import api_router
from app.schemas.common import APIResponse, HealthResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Smart Parking Finder Backend API — Intelligent Parking Assistant for Smart Cities",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Root"])
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR,
    }


@app.get("/health", response_model=APIResponse[HealthResponse], tags=["Health"])
def health_check():
    db_status = "connected"
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return APIResponse(
        success=(db_status == "connected"),
        message="System health status",
        data=HealthResponse(
            status="healthy" if db_status == "connected" else "degraded",
            version=settings.VERSION,
            environment=settings.ENVIRONMENT,
            database=db_status,
        )
    )


# Include API v1 and base /api Routers
app.include_router(api_router, prefix=settings.API_V1_STR)
app.include_router(api_router, prefix="/api")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": "An unexpected server error occurred.",
            "error": str(exc),
            "data": None
        }
    )
