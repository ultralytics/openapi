from __future__ import annotations

from typing import Any, cast

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    TrainingStartResponse,
)


class Training:
    """Training API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def start(self, *, model_id: str, train_args: dict[str, Any], gpu_type: str | None = None) -> TrainingStartResponse:
        """Start cloud training.

        Launches YOLO training on a cloud GPU. Training costs are deducted from your credit balance based on GPU type and duration.

        Args:
            model_id (str): Model to train (name or ID)
            gpu_type (str, optional): GPU to use (default: rtx-4090). Options: rtx-4090, a100, h100
            train_args (dict[str, Any]): trainArgs request value.

        Returns:
            (TrainingStartResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TrainingStartResponse.model_validate(
            self._client.request(
                "POST", "/api/training/start", json={"modelId": model_id, "gpuType": gpu_type, "trainArgs": train_args}
            )
        )

    def retrieve_gpu_availability(self) -> dict[str, Any]:
        """Get GPU availability.

        Returns:
            (dict[str, Any]): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return cast(dict[str, Any], self._client.request("GET", "/api/training/gpu-availability"))


class AsyncTraining:
    """Asynchronous Training API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def start(
        self, *, model_id: str, train_args: dict[str, Any], gpu_type: str | None = None
    ) -> TrainingStartResponse:
        """Start cloud training.

        Launches YOLO training on a cloud GPU. Training costs are deducted from your credit balance based on GPU type and duration.

        Args:
            model_id (str): Model to train (name or ID)
            gpu_type (str, optional): GPU to use (default: rtx-4090). Options: rtx-4090, a100, h100
            train_args (dict[str, Any]): trainArgs request value.

        Returns:
            (TrainingStartResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TrainingStartResponse.model_validate(
            await self._client.request(
                "POST", "/api/training/start", json={"modelId": model_id, "gpuType": gpu_type, "trainArgs": train_args}
            )
        )

    async def retrieve_gpu_availability(self) -> dict[str, Any]:
        """Get GPU availability.

        Returns:
            (dict[str, Any]): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return cast(dict[str, Any], await self._client.request("GET", "/api/training/gpu-availability"))
