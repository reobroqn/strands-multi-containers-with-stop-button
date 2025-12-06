"""Response schemas for chat endpoints."""

from pydantic import BaseModel


class ChatListItem(BaseModel):
    """Individual chat item in list response."""

    chat_id: str
    status: str
    message_count: int
    updated_at: str | None = None


class ChatListResponse(BaseModel):
    """Response for listing all chats."""

    chats: list[ChatListItem]
    count: int


class DeleteChatResponse(BaseModel):
    """Response for chat deletion."""

    status: str
    chat_id: str
