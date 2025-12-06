"""Chat endpoint for agent interaction with ag-ui protocol integration."""

import json
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi import Path as PathParam
from fastapi.responses import StreamingResponse
from loguru import logger

from src.agent.agent_core import AgentOrchestrator
from src.agent.agui_bridge import StrandsToAGUIBridge
from src.config import settings
from src.schemas import ChatRequest, ChatResponse
from src.schemas.chat import ChatListItem, ChatListResponse, DeleteChatResponse

router = APIRouter()


@router.post("/chat/{chat_id}", response_model=None)
async def start_chat(
    chat_id: str = PathParam(..., description="Unique identifier for the chat session"),
    *,
    request: Request,
    chat_request: ChatRequest,
) -> StreamingResponse:
    """Start or continue a chat session with the agent using ag-ui protocol.

    Streams ag-ui protocol events (RUN_STARTED, TEXT_MESSAGE_CHUNK, RUN_FINISHED).
    """
    logger.info("Chat request: chat_id=%s", chat_id)

    async def event_generator():
        """Generate ag-ui events from Strands agent stream."""
        # Create agent orchestrator
        orchestrator = AgentOrchestrator(chat_id=chat_id)

        # Create bridge (generates run_id internally)
        bridge = StrandsToAGUIBridge(thread_id=chat_id, accept_header=request.headers.get("accept"))

        # Stream Strands events and convert to encoded ag-ui events
        strands_stream = orchestrator.stream_response(chat_request.message)

        async for encoded_event in bridge.convert_stream(strands_stream):
            yield encoded_event

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/chats", response_model=ChatListResponse)
async def list_chats() -> ChatListResponse:
    """List all chat sessions.

    Returns:
        ChatListResponse with list of chats and total count
    """
    session_dir = Path(settings.session_dir)

    if not session_dir.exists():
        return ChatListResponse(chats=[], count=0)

    chats = []
    for session_file in session_dir.glob("*.json"):
        try:
            with open(session_file) as f:
                data = json.load(f)

            chats.append(
                ChatListItem(
                    chat_id=data.get("agent_id", session_file.stem),
                    status="active",
                    message_count=len(data.get("messages", [])),
                    updated_at=data.get("updated_at"),
                )
            )
        except Exception as e:
            logger.warning("Failed to read session %s: %s", session_file.name, e)
            continue

    logger.info("Listed %d chats", len(chats))
    return ChatListResponse(chats=chats, count=len(chats))


@router.get("/chat/{chat_id}", response_model=ChatResponse)
async def get_chat(chat_id: str) -> ChatResponse:
    """Get chat session details.

    Returns chat information including message count and status.
    """
    session_dir = Path(settings.session_dir)
    session_file = session_dir / f"{chat_id}.json"

    if not session_file.exists():
        # Return new chat info instead of 404 for better UX
        return ChatResponse(
            chat_id=chat_id,
            message_count=0,
            status="new",
        )

    with open(session_file) as f:
        data = json.load(f)

    return ChatResponse(
        chat_id=chat_id,
        message_count=len(data.get("messages", [])),
        status="active",
    )


@router.delete("/chat/{chat_id}", response_model=DeleteChatResponse)
async def delete_chat(chat_id: str) -> DeleteChatResponse:
    """Delete a chat session.

    Returns status of the deletion operation.
    """
    session_dir = Path(settings.session_dir)
    session_file = session_dir / f"{chat_id}.json"

    if session_file.exists():
        session_file.unlink()
        logger.info("chat_id=%s | Deleted chat session", chat_id)
        return DeleteChatResponse(status="deleted", chat_id=chat_id)
    else:
        return DeleteChatResponse(status="not_found", chat_id=chat_id)
