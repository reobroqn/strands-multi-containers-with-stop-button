import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from loguru import logger

from src.api import chat, stop
from src.config import settings
from src.services.redis_client import RedisClient

# Configure loguru
logger.remove()  # Remove default handler
logger.add(
    sys.stderr,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - <level>{message}</level>",
    level=settings.log_level,
    colorize=True,
)

# Add JSON logging for production
if settings.is_production:
    logger.add(
        "logs/app.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}",
        level="INFO",
        rotation="100 MB",
        retention="10 days",
        compression="zip",
        serialize=True,  # JSON format
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    logger.info("Starting FastAPI Agent Chat application")

    # Initialize Redis
    try:
        await RedisClient.initialize()
        logger.success("Redis initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Redis: {e}")
        raise

    yield

    # Cleanup
    await RedisClient.close()
    logger.info("Application shutdown complete")


# Create FastAPI app
app = FastAPI(
    title="FastAPI Agent Chat",
    description="AI agent chat with immediate stop functionality via Redis signals",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routers
app.include_router(chat.router, prefix="/api/v1", tags=["chat"])
app.include_router(stop.router, prefix="/api/v1", tags=["stop"])

# Static files (mount last to avoid conflicts)
app.mount("/", StaticFiles(directory="static", html=True), name="static")


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    redis_ok = await RedisClient.ping()
    return {
        "status": "healthy" if redis_ok else "degraded",
        "redis": "connected" if redis_ok else "disconnected",
    }


def main():
    """Main entry point"""
    import uvicorn

    logger.info(f"Starting server on {settings.host}:{settings.port}")

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
        workers=1,
        log_config=None,  # Use loguru instead
    )


if __name__ == "__main__":
    main()
