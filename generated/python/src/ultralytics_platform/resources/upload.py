from __future__ import annotations

from typing import Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    UploadCompleteResponse,
    UploadRetrieveFileUrlResponse,
)


class Upload:
    """Upload API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def retrieve_file_url(
        self,
        *,
        asset_type: Literal["models", "datasets", "images", "videos"],
        asset_id: str,
        filename: str,
        content_type: str,
        total_bytes: float,
    ) -> UploadRetrieveFileUrlResponse:
        """Get a file upload URL.

        Generates a pre-signed URL for uploading a file directly to cloud storage. Upload the file with a PUT request to the returned URL. For dataset archives, pass assetType "datasets" and the target dataset ID as assetId, then complete the upload and call /api/datasets/ingest with the returned sessionId. Dataset filenames must end in .zip, .tar, .tar.gz, .tgz, or .ndjson — package loose images into an archive.

        Args:
            asset_type (Literal["models", "datasets", "images", "videos"]): Asset type being uploaded
            asset_id (str): assetId request value.
            filename (str): filename request value.
            content_type (str): contentType request value.
            total_bytes (float): totalBytes request value.

        Returns:
            (UploadRetrieveFileUrlResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return UploadRetrieveFileUrlResponse.model_validate(
            self._client.request(
                "POST",
                "/api/upload/signed-url",
                json={
                    "assetType": asset_type,
                    "assetId": asset_id,
                    "filename": filename,
                    "contentType": content_type,
                    "totalBytes": total_bytes,
                },
            )
        )

    def complete(self, *, session_id: str, checksum: str | None = None) -> UploadCompleteResponse:
        """Confirm file upload.

        Call this after uploading a file to the signed URL. Dataset uploads are verified here, then processed by a separate /api/datasets/ingest call.

        Args:
            session_id (str): sessionId request value.
            checksum (str, optional): checksum request value.

        Returns:
            (UploadCompleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return UploadCompleteResponse.model_validate(
            self._client.request("POST", "/api/upload/complete", json={"sessionId": session_id, "checksum": checksum})
        )


class AsyncUpload:
    """Asynchronous Upload API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def retrieve_file_url(
        self,
        *,
        asset_type: Literal["models", "datasets", "images", "videos"],
        asset_id: str,
        filename: str,
        content_type: str,
        total_bytes: float,
    ) -> UploadRetrieveFileUrlResponse:
        """Get a file upload URL.

        Generates a pre-signed URL for uploading a file directly to cloud storage. Upload the file with a PUT request to the returned URL. For dataset archives, pass assetType "datasets" and the target dataset ID as assetId, then complete the upload and call /api/datasets/ingest with the returned sessionId. Dataset filenames must end in .zip, .tar, .tar.gz, .tgz, or .ndjson — package loose images into an archive.

        Args:
            asset_type (Literal["models", "datasets", "images", "videos"]): Asset type being uploaded
            asset_id (str): assetId request value.
            filename (str): filename request value.
            content_type (str): contentType request value.
            total_bytes (float): totalBytes request value.

        Returns:
            (UploadRetrieveFileUrlResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return UploadRetrieveFileUrlResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/upload/signed-url",
                json={
                    "assetType": asset_type,
                    "assetId": asset_id,
                    "filename": filename,
                    "contentType": content_type,
                    "totalBytes": total_bytes,
                },
            )
        )

    async def complete(self, *, session_id: str, checksum: str | None = None) -> UploadCompleteResponse:
        """Confirm file upload.

        Call this after uploading a file to the signed URL. Dataset uploads are verified here, then processed by a separate /api/datasets/ingest call.

        Args:
            session_id (str): sessionId request value.
            checksum (str, optional): checksum request value.

        Returns:
            (UploadCompleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return UploadCompleteResponse.model_validate(
            await self._client.request(
                "POST", "/api/upload/complete", json={"sessionId": session_id, "checksum": checksum}
            )
        )
