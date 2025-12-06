"""Request and response schemas for API endpoints."""

from pydantic import BaseModel


class ChatRequest(BaseModel):
    message: str


class ChatResponse(BaseModel):
    chat_id: str
    message_count: int
    status: str  # "new", "active", or other states
