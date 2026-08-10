from __future__ import annotations

import os

from ._client import AsyncAPIClient
from .resources import (
    AsyncAccount,
    AsyncActivity,
    AsyncBilling,
    AsyncDatasets,
    AsyncDeployments,
    AsyncExplore,
    AsyncExports,
    AsyncImages,
    AsyncModels,
    AsyncProjects,
    AsyncTeams,
    AsyncTraining,
    AsyncUpload,
)


class AsyncPlatform:
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
        """
        resolved_api_key = api_key or os.environ.get("ULTRALYTICS_API_KEY")
        self._client = AsyncAPIClient(
            api_key=resolved_api_key, base_url=base_url, timeout=timeout, max_retries=max_retries
        )
        self.datasets = AsyncDatasets(self._client)
        self.images = AsyncImages(self._client)
        self.projects = AsyncProjects(self._client)
        self.models = AsyncModels(self._client)
        self.training = AsyncTraining(self._client)
        self.exports = AsyncExports(self._client)
        self.deployments = AsyncDeployments(self._client)
        self.account = AsyncAccount(self._client)
        self.billing = AsyncBilling(self._client)
        self.activity = AsyncActivity(self._client)
        self.explore = AsyncExplore(self._client)
        self.upload = AsyncUpload(self._client)
        self.teams = AsyncTeams(self._client)

    async def close(self) -> None:
        """Close the underlying HTTP client."""
        await self._client.close()
