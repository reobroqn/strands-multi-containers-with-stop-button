"""Stop endpoint for terminating agent sessions."""

from fastapi import APIRouter, HTTPException
from loguru import logger

from src.schemas.stop import StopResponse
from src.services.redis_client import RedisClient

router = APIRouter()


@router.post("/stop/{chat_id}", response_model=StopResponse)
async def stop_chat(chat_id: str) -> StopResponse:
    """Stop an active chat session by setting a Redis stop signal.

    The agent will check for this signal and terminate gracefully.
    """
    logger.info("chat_id=%s | Stop signal requested", chat_id)

    success = await RedisClient.set_stop_signal(chat_id)

    if success:
        logger.info("chat_id=%s | Stop signal set successfully", chat_id)
        return StopResponse(
            chat_id=chat_id,
            status="accepted",
            message="Stop signal sent to agent",
        )
    else:
        logger.error("chat_id=%s | Failed to set stop signal", chat_id)
        raise HTTPException(status_code=500, detail="Failed to set stop signal")
