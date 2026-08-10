from __future__ import annotations

import os

from ._client import SyncAPIClient
from .resources import (
    Account,
    Activity,
    Billing,
    Datasets,
    Deployments,
    Explore,
    Exports,
    Images,
    Models,
    Projects,
    Teams,
    Training,
    Upload,
)


class Platform:
    """Client for the Ultralytics Platform API."""

    def __init__(
        self,
        *,
        api_key: str | None = None,
        base_url: str = "https://platform.ultralytics.com",
        timeout: float = 60.0,
        max_retries: int = 2,
    ) -> None:
        """Initialize the client.

        Args:
            api_key (str, optional): API key. Defaults to ULTRALYTICS_API_KEY.
            base_url (str): API base URL.
            timeout (float): Request timeout in seconds.
            max_retries (int): Retries for connection errors and retryable responses.

        Raises:
            (ValueError): If no API key is provided.
        """
        resolved_api_key = api_key or os.environ.get("ULTRALYTICS_API_KEY")
        if not resolved_api_key:
            raise ValueError("Set ULTRALYTICS_API_KEY or pass api_key")
        self._client = SyncAPIClient(
            api_key=resolved_api_key, base_url=base_url, timeout=timeout, max_retries=max_retries
        )
        self.datasets = Datasets(self._client)
        self.images = Images(self._client)
        self.projects = Projects(self._client)
        self.models = Models(self._client)
        self.training = Training(self._client)
        self.exports = Exports(self._client)
        self.deployments = Deployments(self._client)
        self.account = Account(self._client)
        self.billing = Billing(self._client)
        self.activity = Activity(self._client)
        self.explore = Explore(self._client)
        self.upload = Upload(self._client)
        self.teams = Teams(self._client)

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()
