"""
Face Recognition Attendance System - Main Application
Modular Monolith Architecture
"""
import asyncio
import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import service routers
from services.auth_service.api.routes import router as auth_router
from services.schedule_service.api.routes import router as schedule_router
from services.attendance_service.api.routes import router as attendance_router
from services.ai_service.api.routes import router as ai_router
from services.notification_service.api.routes import router as notification_router
from services.notification_service.api.websocket import websocket_router as notification_ws_router
from services.stats_service.api.routes import router as stats_router

# Import background tasks
from services.attendance_service.tasks.session_tasks import session_cleanup_loop


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.
    Handles startup and shutdown events.
    """
    # Startup: Start background tasks
    cleanup_task = asyncio.create_task(session_cleanup_loop(interval_seconds=60))
    
    yield
    
    # Shutdown: Cancel background tasks
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass
    
    # Shutdown AI adapter (cleanup thread pool)
    try:
        from services.ai_service.adapters.insightface_adapter import InsightFaceAdapter
        InsightFaceAdapter.shutdown()
    except Exception:
        pass


# Create FastAPI app
app = FastAPI(
    title="Face Recognition Attendance System",
    description="Automated attendance management using AI-powered face recognition",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS Configuration
origins = [
    "http://localhost:3000",  # React Frontend
    "http://localhost:5173",  # Vite Frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Service Routers
app.include_router(
    auth_router,
    prefix="/api/auth",
    tags=["Auth Service"]
)

app.include_router(
    schedule_router, 
    prefix="/api/schedule", 
    tags=["Schedule Service"]
)

app.include_router(
    attendance_router,
    prefix="/api/attendance",
    tags=["Attendance Service"]
)

app.include_router(
    ai_router,
    prefix="/api/ai",
    tags=["AI Service"]
)

app.include_router(
    notification_router,
    prefix="/api/notifications",
    tags=["Notification Service"]
)

# WebSocket Router (no prefix needed, path is in the router)
app.include_router(
    notification_ws_router,
    prefix="/api/notifications",
    tags=["Notification WebSocket"]
)

# Stats Service Router
app.include_router(
    stats_router,
    prefix="/api/stats",
    tags=["Stats Service"]
)

# Health Check Endpoint
@app.get("/", tags=["Health"])
def root():
    """Root endpoint - API health check"""
    return {
        "status": "healthy",
        "message": "Face Recognition Attendance System API",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Health check endpoint"""
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)