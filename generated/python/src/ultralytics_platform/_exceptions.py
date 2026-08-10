from __future__ import annotations


class APIError(Exception):
    """Error returned by the Platform API."""

    def __init__(self, status_code: int, body: str, request_id: str | None = None) -> None:
        self.status_code = status_code
        self.body = body
        self.request_id = request_id
        super().__init__(f"API request failed with status {status_code}: {body}")


class APIConnectionError(Exception):
    """Network error raised while contacting the Platform API."""
