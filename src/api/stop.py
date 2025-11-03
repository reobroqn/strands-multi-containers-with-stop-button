from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from loguru import logger
from pydantic import BaseModel

from src.services.redis_client import RedisClient

router = APIRouter()


# Dependency to check Redis availability
async def verify_redis():
    """Dependency to ensure Redis is available"""
    if not await RedisClient.ping():
        logger.error("Redis unavailable")
        raise HTTPException(status_code=503, detail="Redis service unavailable")


# Models
class StopResponse(BaseModel):
    chat_id: str
    status: str
    message: str


class BulkStopRequest(BaseModel):
    chat_ids: list[str]


@router.post("/stop/{chat_id}", response_model=StopResponse)
async def stop_chat(
    chat_id: str,
    _: Annotated[None, Depends(verify_redis)],
):
    """
    Stop an active chat session by setting a Redis stop signal.
    The agent will detect this signal and halt immediately.
    """
    logger.info(f"chat_id=<{chat_id}> | Stop requested")

    try:
        success = await RedisClient.set_stop_signal(chat_id)

        if success:
            return StopResponse(
                chat_id=chat_id,
                status="accepted",
                message=f"Stop signal sent for chat {chat_id}. Agent will halt shortly.",
            )
        else:
            raise HTTPException(status_code=500, detail="Failed to set stop signal")

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"chat_id=<{chat_id}> | Error setting stop signal: {e}")
        raise HTTPException(status_code=500, detail=str(e)) from e


@router.post("/stop/bulk")
async def stop_multiple_chats(
    request: BulkStopRequest,
    _: Annotated[None, Depends(verify_redis)],
):
    """
    Stop multiple chat sessions at once.
    Returns status for each chat ID.
    """
    logger.info(f"Bulk stop requested for {len(request.chat_ids)} chats")

    results = []
    for chat_id in request.chat_ids:
        try:
            success = await RedisClient.set_stop_signal(chat_id)
            results.append({"chat_id": chat_id, "status": "accepted" if success else "failed"})
        except Exception as e:
            logger.error(f"chat_id=<{chat_id}> | Bulk stop error: {e}")
            results.append({"chat_id": chat_id, "status": "error", "error": str(e)})

    successful = sum(1 for r in results if r["status"] == "accepted")
    logger.info(f"Bulk stop completed: {successful}/{len(results)} successful")

    return {
        "results": results,
        "total": len(results),
        "successful": successful,
        "failed": len(results) - successful,
    }
