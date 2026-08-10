from __future__ import annotations

from typing import Any, Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    ImagesDeleteBulkResponse,
    ImagesDeleteResponse,
    ImagesPredictResponse,
    ImagesRetrieveLabelsResponse,
    ImagesRetrieveMetadataResponse,
    ImagesRetrieveSignedUrlsResponse,
    ImagesUpdateBulkResponse,
    ImagesUpdateLabelsResponse,
    ImagesUpdateMetadataResponse,
)


class Images:
    """Images API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def retrieve_labels(self, image_id: str) -> ImagesRetrieveLabelsResponse:
        """Get image labels.

        Returns fullscreen annotations and class names for a specific image in the dataset.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints

        Returns:
            (ImagesRetrieveLabelsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesRetrieveLabelsResponse.model_validate(
            self._client.request("GET", f"/api/images/{image_id}/labels")
        )

    def update_labels(self, image_id: str, *, labels: list[dict[str, Any]]) -> ImagesUpdateLabelsResponse:
        """Update image labels.

        Replaces all annotations for a specific image. Updates dataset-level statistics (annotation count, labeled count) incrementally.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints
            labels (list[dict[str, Any]]): labels request value.

        Returns:
            (ImagesUpdateLabelsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesUpdateLabelsResponse.model_validate(
            self._client.request("PUT", f"/api/images/{image_id}/labels", json={"labels": labels})
        )

    def retrieve_metadata(self, image_id: str) -> ImagesRetrieveMetadataResponse:
        """Get image metadata.

        Returns custom metadata and Ultralytics-managed properties for one image.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints

        Returns:
            (ImagesRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesRetrieveMetadataResponse.model_validate(
            self._client.request("GET", f"/api/images/{image_id}/metadata")
        )

    def update_metadata(self, image_id: str, *, metadata: dict[str, Any]) -> ImagesUpdateMetadataResponse:
        """Update image metadata.

        Replaces the complete custom metadata object for one image. Send an empty object to clear it.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints
            metadata (dict[str, Any]): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.

        Returns:
            (ImagesUpdateMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesUpdateMetadataResponse.model_validate(
            self._client.request("PUT", f"/api/images/{image_id}/metadata", json={"metadata": metadata})
        )

    def update_bulk(
        self,
        *,
        image_ids: list[str],
        split: Literal["train", "val", "test"],
        conflict_policy: Literal["skip", "keep_both", "replace"] | None = None,
    ) -> ImagesUpdateBulkResponse:
        """Move images to a different split.

        Moves images to a target split (train, val, or test). Filename and content conflicts require one basket-wide skip, keep-both, or replace policy. Maximum 1000 per batch.

        Args:
            image_ids (list[str]): imageIds request value.
            split (Literal["train", "val", "test"]): Dataset split type
            conflict_policy (Literal["skip", "keep_both", "replace"], optional): How to handle filename or content conflicts

        Returns:
            (ImagesUpdateBulkResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesUpdateBulkResponse.model_validate(
            self._client.request(
                "PATCH",
                "/api/images/bulk",
                json={"imageIds": image_ids, "split": split, "conflictPolicy": conflict_policy},
            )
        )

    def delete_bulk(self, *, image_ids: list[str]) -> ImagesDeleteBulkResponse:
        """Delete images from dataset.

        Deletes multiple images and their annotations from the dataset. Removes files from storage in the background. Maximum 1000 images per batch.

        Args:
            image_ids (list[str]): imageIds request value.

        Returns:
            (ImagesDeleteBulkResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesDeleteBulkResponse.model_validate(
            self._client.request("DELETE", "/api/images/bulk", json={"imageIds": image_ids})
        )

    def predict(
        self, image_id: str, *, model_id: str | None = None, confidence: float | None = None, iou: float | None = None
    ) -> ImagesPredictResponse:
        """Auto-annotate an image.

        Runs YOLO inference on an image to generate label predictions for auto-annotation. Supports custom models via ul:// URI.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints
            model_id (str, optional): Model ul:// URI
            confidence (float, optional): Confidence threshold
            iou (float, optional): IoU threshold for non-maximum suppression

        Returns:
            (ImagesPredictResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesPredictResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/images/{image_id}/predict",
                json={"modelId": model_id, "confidence": confidence, "iou": iou},
            )
        )

    def retrieve_signed_urls(self, *, image_ids: list[str]) -> ImagesRetrieveSignedUrlsResponse:
        """Get signed image URLs.

        Args:
            image_ids (list[str]): imageIds request value.

        Returns:
            (ImagesRetrieveSignedUrlsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesRetrieveSignedUrlsResponse.model_validate(
            self._client.request("POST", "/api/images/urls", json={"imageIds": image_ids})
        )

    def delete(self, image_id: str) -> ImagesDeleteResponse:
        """Delete an image.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints

        Returns:
            (ImagesDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesDeleteResponse.model_validate(self._client.request("DELETE", f"/api/images/{image_id}"))


class AsyncImages:
    """Asynchronous Images API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def retrieve_labels(self, image_id: str) -> ImagesRetrieveLabelsResponse:
        """Get image labels.

        Returns fullscreen annotations and class names for a specific image in the dataset.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints

        Returns:
            (ImagesRetrieveLabelsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesRetrieveLabelsResponse.model_validate(
            await self._client.request("GET", f"/api/images/{image_id}/labels")
        )

    async def update_labels(self, image_id: str, *, labels: list[dict[str, Any]]) -> ImagesUpdateLabelsResponse:
        """Update image labels.

        Replaces all annotations for a specific image. Updates dataset-level statistics (annotation count, labeled count) incrementally.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints
            labels (list[dict[str, Any]]): labels request value.

        Returns:
            (ImagesUpdateLabelsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesUpdateLabelsResponse.model_validate(
            await self._client.request("PUT", f"/api/images/{image_id}/labels", json={"labels": labels})
        )

    async def retrieve_metadata(self, image_id: str) -> ImagesRetrieveMetadataResponse:
        """Get image metadata.

        Returns custom metadata and Ultralytics-managed properties for one image.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints

        Returns:
            (ImagesRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesRetrieveMetadataResponse.model_validate(
            await self._client.request("GET", f"/api/images/{image_id}/metadata")
        )

    async def update_metadata(self, image_id: str, *, metadata: dict[str, Any]) -> ImagesUpdateMetadataResponse:
        """Update image metadata.

        Replaces the complete custom metadata object for one image. Send an empty object to clear it.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints
            metadata (dict[str, Any]): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.

        Returns:
            (ImagesUpdateMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesUpdateMetadataResponse.model_validate(
            await self._client.request("PUT", f"/api/images/{image_id}/metadata", json={"metadata": metadata})
        )

    async def update_bulk(
        self,
        *,
        image_ids: list[str],
        split: Literal["train", "val", "test"],
        conflict_policy: Literal["skip", "keep_both", "replace"] | None = None,
    ) -> ImagesUpdateBulkResponse:
        """Move images to a different split.

        Moves images to a target split (train, val, or test). Filename and content conflicts require one basket-wide skip, keep-both, or replace policy. Maximum 1000 per batch.

        Args:
            image_ids (list[str]): imageIds request value.
            split (Literal["train", "val", "test"]): Dataset split type
            conflict_policy (Literal["skip", "keep_both", "replace"], optional): How to handle filename or content conflicts

        Returns:
            (ImagesUpdateBulkResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesUpdateBulkResponse.model_validate(
            await self._client.request(
                "PATCH",
                "/api/images/bulk",
                json={"imageIds": image_ids, "split": split, "conflictPolicy": conflict_policy},
            )
        )

    async def delete_bulk(self, *, image_ids: list[str]) -> ImagesDeleteBulkResponse:
        """Delete images from dataset.

        Deletes multiple images and their annotations from the dataset. Removes files from storage in the background. Maximum 1000 images per batch.

        Args:
            image_ids (list[str]): imageIds request value.

        Returns:
            (ImagesDeleteBulkResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesDeleteBulkResponse.model_validate(
            await self._client.request("DELETE", "/api/images/bulk", json={"imageIds": image_ids})
        )

    async def predict(
        self, image_id: str, *, model_id: str | None = None, confidence: float | None = None, iou: float | None = None
    ) -> ImagesPredictResponse:
        """Auto-annotate an image.

        Runs YOLO inference on an image to generate label predictions for auto-annotation. Supports custom models via ul:// URI.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints
            model_id (str, optional): Model ul:// URI
            confidence (float, optional): Confidence threshold
            iou (float, optional): IoU threshold for non-maximum suppression

        Returns:
            (ImagesPredictResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesPredictResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/images/{image_id}/predict",
                json={"modelId": model_id, "confidence": confidence, "iou": iou},
            )
        )

    async def retrieve_signed_urls(self, *, image_ids: list[str]) -> ImagesRetrieveSignedUrlsResponse:
        """Get signed image URLs.

        Args:
            image_ids (list[str]): imageIds request value.

        Returns:
            (ImagesRetrieveSignedUrlsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesRetrieveSignedUrlsResponse.model_validate(
            await self._client.request("POST", "/api/images/urls", json={"imageIds": image_ids})
        )

    async def delete(self, image_id: str) -> ImagesDeleteResponse:
        """Delete an image.

        Args:
            image_id (str): Unique image ID returned by dataset image endpoints

        Returns:
            (ImagesDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ImagesDeleteResponse.model_validate(await self._client.request("DELETE", f"/api/images/{image_id}"))
