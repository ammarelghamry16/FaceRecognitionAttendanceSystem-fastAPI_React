"""
Face Recognition Attendance System - Main Application
Modular Monolith Architecture
"""
import asyncio
import uvicorn
import logging
import time
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-8s | %(name)s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("api")

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


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log all incoming requests and outgoing responses.
    Logs: method, path, query params, headers, body (for non-file uploads), 
    response status, and timing.
    """
    
    # Paths to skip detailed logging (high frequency or sensitive)
    SKIP_BODY_PATHS = ["/api/ai/enroll", "/api/ai/recognize", "/api/ai/enroll/multiple"]
    SKIP_PATHS = ["/health", "/docs", "/redoc", "/openapi.json"]
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Skip logging for certain paths
        if any(request.url.path.startswith(p) for p in self.SKIP_PATHS):
            return await call_next(request)
        
        start_time = time.time()
        request_id = f"{int(start_time * 1000) % 100000:05d}"
        
        # Log request details
        log_parts = [
            f"[{request_id}] ➡️  {request.method} {request.url.path}"
        ]
        
        # Add query params if present
        if request.query_params:
            log_parts.append(f"Query: {dict(request.query_params)}")
        
        # Log relevant headers
        headers_to_log = {}
        for key in ["content-type", "authorization", "user-agent", "origin"]:
            if key in request.headers:
                value = request.headers[key]
                # Mask authorization token
                if key == "authorization":
                    value = value[:20] + "..." if len(value) > 20 else value
                headers_to_log[key] = value
        if headers_to_log:
            log_parts.append(f"Headers: {headers_to_log}")
        
        # Log request body for non-file uploads
        body_logged = False
        if request.method in ["POST", "PUT", "PATCH"]:
            content_type = request.headers.get("content-type", "")
            if "multipart/form-data" in content_type:
                log_parts.append("Body: [multipart/form-data - file upload]")
                body_logged = True
            elif "application/json" in content_type:
                try:
                    body = await request.body()
                    if body:
                        body_json = json.loads(body)
                        # Mask sensitive fields
                        if "password" in body_json:
                            body_json["password"] = "***"
                        log_parts.append(f"Body: {json.dumps(body_json)[:500]}")
                        body_logged = True
                except Exception:
                    pass
        
        logger.info(" | ".join(log_parts))
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log response
            status_emoji = "✅" if response.status_code < 400 else "❌"
            logger.info(
                f"[{request_id}] {status_emoji} {request.method} {request.url.path} "
                f"→ {response.status_code} ({duration_ms:.1f}ms)"
            )
            
            return response
            
        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000
            logger.error(
                f"[{request_id}] 💥 {request.method} {request.url.path} "
                f"→ ERROR: {str(e)} ({duration_ms:.1f}ms)"
            )
            raise


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
        if hasattr(InsightFaceAdapter, 'shutdown'):
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
    "http://localhost:3001",  # React Frontend (alternate port)
    "http://localhost:5173",  # Vite Frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https://.*\.vercel\.app",  # Allow all Vercel deployments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add request logging middleware
app.add_middleware(RequestLoggingMiddleware)

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