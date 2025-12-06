"""Bridge module to convert Strands agent events to ag-ui protocol events."""

import uuid
from collections.abc import AsyncGenerator

from ag_ui.core import (
    EventType,
    RunErrorEvent,
    RunFinishedEvent,
    RunStartedEvent,
    TextMessageChunkEvent,
)
from ag_ui.encoder import EventEncoder
from loguru import logger


class StrandsToAGUIBridge:
    """Converts Strands agent streaming events to ag-ui protocol events."""

    def __init__(
        self, thread_id: str, run_id: str | None = None, accept_header: str | None = None
    ):
        """Initialize the bridge.

        Args:
            thread_id: Unique identifier for the conversation thread
            run_id: Unique identifier for this specific run (auto-generated if not provided)
            accept_header: Accept header from request for proper encoding
        """
        self.thread_id = thread_id
        self.run_id = run_id or str(uuid.uuid4())
        self.current_message_id: str | None = None
        self.current_tool_call_id: str | None = None
        self.encoder = EventEncoder(accept=accept_header)

    async def convert_stream(self, strands_stream: AsyncGenerator) -> AsyncGenerator[bytes]:
        """Convert Strands agent stream to encoded ag-ui events.

        Args:
            strands_stream: Async generator yielding Strands event strings

        Yields:
            Encoded ag-ui protocol events as bytes
        """
        try:
            # Emit RUN_STARTED
            yield self.encoder.encode(
                RunStartedEvent(
                    type=EventType.RUN_STARTED,
                    thread_id=self.thread_id,
                    run_id=self.run_id,
                )
            )

            logger.info("Started ag-ui run: thread=%s, run=%s", self.thread_id, self.run_id)

            # Process Strands events
            async for event_data in strands_stream:
                # Check if this is a stop signal
                if event_data == "[STOPPED]":
                    logger.info("Received stop signal from Strands agent")
                    yield self.encoder.encode(
                        TextMessageChunkEvent(
                            type=EventType.TEXT_MESSAGE_CHUNK,
                            message_id=self._get_or_create_message_id(),
                            delta="\n[Agent stopped by user]",
                        )
                    )
                    break

                # Convert text content to TEXT_MESSAGE_CHUNK
                if isinstance(event_data, str) and event_data.strip():
                    yield self.encoder.encode(
                        TextMessageChunkEvent(
                            type=EventType.TEXT_MESSAGE_CHUNK,
                            message_id=self._get_or_create_message_id(),
                            delta=event_data,
                        )
                    )

            # Emit RUN_FINISHED
            yield self.encoder.encode(
                RunFinishedEvent(
                    type=EventType.RUN_FINISHED,
                    thread_id=self.thread_id,
                    run_id=self.run_id,
                )
            )

            logger.info("Finished ag-ui run: thread=%s, run=%s", self.thread_id, self.run_id)

        except Exception as error:
            logger.error("Error in ag-ui bridge: %s", error)
            # Emit RUN_ERROR to properly close the stream
            yield self.encoder.encode(
                RunErrorEvent(
                    type=EventType.RUN_ERROR,
                    message=str(error),
                )
            )

    def _get_or_create_message_id(self) -> str:
        """Get or create a message ID for the current response."""
        if self.current_message_id is None:
            self.current_message_id = str(uuid.uuid4())
        return self.current_message_id

    def get_content_type(self) -> str:
        """Get the content type for the response."""
        return self.encoder.get_content_type()
