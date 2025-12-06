"""Response schemas for stop endpoint."""

from pydantic import BaseModel


class StopResponse(BaseModel):
    """Response for stopping a chat session."""

    chat_id: str
    status: str
    message: str
