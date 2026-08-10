from __future__ import annotations

from typing import Any, BinaryIO, Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    DatasetsCloneResponse,
    DatasetsCreateEmbeddingsResponse,
    DatasetsCreateExportResponse,
    DatasetsCreateIconResponse,
    DatasetsCreateResponse,
    DatasetsDeleteClassesResponse,
    DatasetsDeleteEmbeddingsResponse,
    DatasetsDeleteIconResponse,
    DatasetsDeleteResponse,
    DatasetsImportFromRoboflowResponse,
    DatasetsIngestResponse,
    DatasetsListImagesResponse,
    DatasetsListModelsResponse,
    DatasetsListResponse,
    DatasetsMergeClassesResponse,
    DatasetsPreviewRoboflowImportResponse,
    DatasetsRedistributeSplitsResponse,
    DatasetsRestoreResponse,
    DatasetsRetrieveClassStatsResponse,
    DatasetsRetrieveEmbeddingsResponse,
    DatasetsRetrieveExportResponse,
    DatasetsRetrieveImagesClusteringResponse,
    DatasetsRetrieveMetadataResponse,
    DatasetsRetrieveResponse,
    DatasetsRetrieveSelectedImagesResponse,
    DatasetsUpdateExportResponse,
    DatasetsUpdateResponse,
)


class Datasets:
    """Datasets API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def list(
        self,
        *,
        limit: int | None = None,
        username: str | None = None,
        owner: str | None = None,
        region: str | None = None,
        include_image_urls: bool | None = None,
        include_samples: bool | None = None,
    ) -> DatasetsListResponse:
        """List your datasets.

        Returns your datasets with pagination. Public datasets from other users are also accessible when filtering by username.

        Args:
            limit (int, optional): Number of results to return (default 1000)
            username (str, optional): Show datasets from this user instead of your own
            owner (str, optional): Team workspace to browse
            region (str, optional): Data region: us, eu, or ap
            include_image_urls (bool, optional): Set true to include signed full-size sample image URLs (thumbnail fallback)
            include_samples (bool, optional): Set false to omit sample images from the response

        Returns:
            (DatasetsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsListResponse.model_validate(
            self._client.request(
                "GET",
                "/api/datasets",
                params={
                    "limit": limit,
                    "username": username,
                    "owner": owner,
                    "region": region,
                    "includeImageUrls": include_image_urls,
                    "includeSamples": include_samples,
                },
            )
        )

    def create(
        self,
        *,
        slug: str,
        name: str,
        task: Literal["detect", "segment", "semantic", "classify", "pose", "obb"],
        image_count: int,
        format: Literal["yolo", "coco", "voc", "raw", "ndjson"],
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        class_names: list[str] | None = None,
        tags: list[str] | None = None,
        license: Literal[
            "None",
            "CC0-1.0",
            "PDM-1.0",
            "CC-BY-2.5",
            "CC-BY-4.0",
            "CC-BY-NC-2.0",
            "CC-BY-SA-4.0",
            "CC-BY-NC-4.0",
            "CC-BY-NC-SA-3.0",
            "CC-BY-NC-SA-4.0",
            "CC-BY-ND-4.0",
            "CC-BY-NC-ND-4.0",
            "Apache-2.0",
            "MIT",
            "AGPL-3.0",
            "GPL-3.0",
            "Research-Only",
            "Other",
        ]
        | None = None,
        owner: str | None = None,
    ) -> DatasetsCreateResponse:
        """Create a new dataset.

        Args:
            slug (str): slug request value.
            name (str): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            task (Literal["detect", "segment", "semantic", "classify", "pose", "obb"]): Dataset task type (depth coming soon)
            image_count (int): imageCount request value.
            class_names (list[str], optional): classNames request value.
            format (Literal["yolo", "coco", "voc", "raw", "ndjson"]): Dataset annotation format
            tags (list[str], optional): tags request value.
            license (Literal["None", "CC0-1.0", "PDM-1.0", "CC-BY-2.5", "CC-BY-4.0", "CC-BY-NC-2.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC-BY-NC-SA-3.0", "CC-BY-NC-SA-4.0", "CC-BY-ND-4.0", "CC-BY-NC-ND-4.0", "Apache-2.0", "MIT", "AGPL-3.0", "GPL-3.0", "Research-Only", "Other"], optional): Dataset license identifier
            owner (str, optional): Team owner username (creates resource in their workspace)

        Returns:
            (DatasetsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateResponse.model_validate(
            self._client.request(
                "POST",
                "/api/datasets",
                json={
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "task": task,
                    "imageCount": image_count,
                    "classNames": class_names,
                    "format": format,
                    "tags": tags,
                    "license": license,
                    "owner": owner,
                },
            )
        )

    def retrieve(self, dataset_id: str, *, username: str | None = None) -> DatasetsRetrieveResponse:
        """Get dataset details.

        Returns full details for a dataset including class names, split counts, and sample images.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Owner username when using a dataset slug instead of an ID

        Returns:
            (DatasetsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveResponse.model_validate(
            self._client.request("GET", f"/api/datasets/{dataset_id}", params={"username": username})
        )

    def update(
        self,
        dataset_id: str,
        *,
        name: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        tags: list[str] | None = None,
        class_names: list[str] | None = None,
        class_colors: dict[str, Any] | None = None,
        format: Literal["yolo", "coco", "voc", "raw", "ndjson"] | None = None,
        task: Literal["detect", "segment", "semantic", "classify", "pose", "obb"] | None = None,
        license: Literal[
            "None",
            "CC0-1.0",
            "PDM-1.0",
            "CC-BY-2.5",
            "CC-BY-4.0",
            "CC-BY-NC-2.0",
            "CC-BY-SA-4.0",
            "CC-BY-NC-4.0",
            "CC-BY-NC-SA-3.0",
            "CC-BY-NC-SA-4.0",
            "CC-BY-ND-4.0",
            "CC-BY-NC-ND-4.0",
            "Apache-2.0",
            "MIT",
            "AGPL-3.0",
            "GPL-3.0",
            "Research-Only",
            "Other",
        ]
        | None = None,
        icon_color: str | None = None,
        icon_letter: str | Literal[""] | None = None,
    ) -> DatasetsUpdateResponse:
        """Update a dataset.

        Update dataset properties like name, description, metadata, visibility, tags, or class names.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            name (str, optional): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            tags (list[str], optional): tags request value.
            class_names (list[str], optional): classNames request value.
            class_colors (dict[str, Any], optional): classColors request value.
            format (Literal["yolo", "coco", "voc", "raw", "ndjson"], optional): Dataset annotation format
            task (Literal["detect", "segment", "semantic", "classify", "pose", "obb"], optional): Dataset task type (depth coming soon)
            license (Literal["None", "CC0-1.0", "PDM-1.0", "CC-BY-2.5", "CC-BY-4.0", "CC-BY-NC-2.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC-BY-NC-SA-3.0", "CC-BY-NC-SA-4.0", "CC-BY-ND-4.0", "CC-BY-NC-ND-4.0", "Apache-2.0", "MIT", "AGPL-3.0", "GPL-3.0", "Research-Only", "Other"], optional): Dataset license identifier
            icon_color (str, optional): iconColor request value.
            icon_letter (str | Literal[""], optional): iconLetter request value.

        Returns:
            (DatasetsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsUpdateResponse.model_validate(
            self._client.request(
                "PATCH",
                f"/api/datasets/{dataset_id}",
                json={
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "tags": tags,
                    "classNames": class_names,
                    "classColors": class_colors,
                    "format": format,
                    "task": task,
                    "license": license,
                    "iconColor": icon_color,
                    "iconLetter": icon_letter,
                },
            )
        )

    def delete(self, dataset_id: str) -> DatasetsDeleteResponse:
        """Delete a dataset.

        Moves the dataset to trash. It can be restored within 30 days before permanent deletion.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteResponse.model_validate(self._client.request("DELETE", f"/api/datasets/{dataset_id}"))

    def retrieve_metadata(self, dataset_id: str) -> DatasetsRetrieveMetadataResponse:
        """Get dataset metadata.

        Returns custom metadata and Ultralytics-managed properties without adding them to normal payloads.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveMetadataResponse.model_validate(
            self._client.request("GET", f"/api/datasets/{dataset_id}/metadata")
        )

    def clone(
        self,
        dataset_id: str,
        *,
        name: str | None = None,
        slug: str | None = None,
        description: str | None = None,
        visibility: Literal["public", "private"] | None = None,
        license: str | None = None,
        owner: str | None = None,
    ) -> DatasetsCloneResponse:
        """Clone an accessible dataset.

        Copies a public, owned, or shared dataset into your account or a workspace.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            name (str, optional): name request value.
            slug (str, optional): slug request value.
            description (str, optional): description request value.
            visibility (Literal["public", "private"], optional): Resource visibility
            license (str, optional): license request value.
            owner (str, optional): owner request value.

        Returns:
            (DatasetsCloneResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCloneResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/clone",
                json={
                    "name": name,
                    "slug": slug,
                    "description": description,
                    "visibility": visibility,
                    "license": license,
                    "owner": owner,
                },
            )
        )

    def retrieve_class_stats(self, dataset_id: str) -> DatasetsRetrieveClassStatsResponse:
        """Get class statistics.

        Returns per-class annotation counts, image dimension distributions, and location heatmap data.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsRetrieveClassStatsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveClassStatsResponse.model_validate(
            self._client.request("GET", f"/api/datasets/{dataset_id}/class-stats")
        )

    def merge_classes(
        self, dataset_id: str, *, source_class_ids: list[int], target_class_id: int
    ) -> DatasetsMergeClassesResponse:
        """Merge dataset classes.

        Reassigns annotations from source classes to a target class, removes the source classes, and shifts remaining class IDs. This operation is not idempotent; re-fetch the dataset before retrying.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            source_class_ids (list[int]): sourceClassIds request value.
            target_class_id (int): targetClassId request value.

        Returns:
            (DatasetsMergeClassesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsMergeClassesResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/classes/merge",
                json={"sourceClassIds": source_class_ids, "targetClassId": target_class_id},
            )
        )

    def delete_classes(self, dataset_id: str, *, class_ids: list[int]) -> DatasetsDeleteClassesResponse:
        """Delete dataset classes.

        Deletes annotations in the selected classes, removes the classes, and shifts remaining class IDs.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            class_ids (list[int]): classIds request value.

        Returns:
            (DatasetsDeleteClassesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteClassesResponse.model_validate(
            self._client.request("POST", f"/api/datasets/{dataset_id}/classes/delete", json={"classIds": class_ids})
        )

    def redistribute_splits(
        self, dataset_id: str, *, train: int, val: int, test: int
    ) -> DatasetsRedistributeSplitsResponse:
        """Redistribute dataset splits.

        Randomly reassigns images to train, validation, and test splits using percentages that total 100.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            train (int): Train split percentage
            val (int): Validation split percentage
            test (int): Test split percentage

        Returns:
            (DatasetsRedistributeSplitsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRedistributeSplitsResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/splits/redistribute",
                json={"train": train, "val": val, "test": test},
            )
        )

    def list_images(
        self,
        dataset_id: str,
        *,
        username: str | None = None,
        limit: float | None = None,
        offset: float | None = None,
        cursor: str | None = None,
        include_total: bool | None = None,
        split: Literal["train", "val", "test"] | None = None,
        has_error: bool | None = None,
        has_label: bool | None = None,
        class_ids: str | None = None,
        search: str | None = None,
        sort: Literal[
            "newest",
            "oldest",
            "name-asc",
            "name-desc",
            "height-asc",
            "height-desc",
            "width-asc",
            "width-desc",
            "size-asc",
            "size-desc",
            "labels-desc",
            "labels-asc",
        ]
        | None = None,
        include_thumbnails: bool | None = None,
        include_image_urls: bool | None = None,
        include_labels: bool | None = None,
        overlay_labels: bool | None = None,
        for_export: bool | None = None,
    ) -> DatasetsListImagesResponse:
        """List images in a dataset.

        Returns paginated dataset images. Labels are omitted by default and only included as capped preview annotations when includeLabels=true or overlayLabels=true.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Owner username for public dataset access
            limit (float, optional): Number of images to return (default 50, max 5000)
            offset (float, optional): Skip this many images for pagination
            cursor (str, optional): Cursor from a previous response for efficient newest/oldest pagination
            include_total (bool, optional): Set false to skip the total count
            split (Literal["train", "val", "test"], optional): Show only images in this split
            has_error (bool, optional): Filter by images with processing errors
            has_label (bool, optional): Filter by labeled status
            class_ids (str, optional): Comma-separated class IDs. Matches images containing any of the listed classes
            search (str, optional): Case-insensitive substring search over the image name and custom metadata keys, scalar values, and array entries (name suffix optional). Values nested inside sub-objects are not matched. A 32-character hex string is an exact hash lookup instead
            sort (Literal["newest", "oldest", "name-asc", "name-desc", "height-asc", "height-desc", "width-asc", "width-desc", "size-asc", "size-desc", "labels-desc", "labels-asc"], optional): Sort order
            include_thumbnails (bool, optional): Set false to omit signed thumbnail URLs
            include_image_urls (bool, optional): Set true to include signed full-size image URLs
            include_labels (bool, optional): Set true to include capped preview labels
            overlay_labels (bool, optional): Alias for includeLabels used by gallery overlays
            for_export (bool, optional): Set true to include full labels and image URLs for export-style consumers

        Returns:
            (DatasetsListImagesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsListImagesResponse.model_validate(
            self._client.request(
                "GET",
                f"/api/datasets/{dataset_id}/images",
                params={
                    "username": username,
                    "limit": limit,
                    "offset": offset,
                    "cursor": cursor,
                    "includeTotal": include_total,
                    "split": split,
                    "hasError": has_error,
                    "hasLabel": has_label,
                    "classIds": class_ids,
                    "search": search,
                    "sort": sort,
                    "includeThumbnails": include_thumbnails,
                    "includeImageUrls": include_image_urls,
                    "includeLabels": include_labels,
                    "overlayLabels": overlay_labels,
                    "forExport": for_export,
                },
            )
        )

    def retrieve_selected_images(
        self,
        dataset_id: str,
        *,
        image_ids: list[str],
        username: str | None = None,
        include_labels: bool | None = None,
        overlay_labels: bool | None = None,
        include_thumbnails: bool | None = None,
        include_image_urls: bool | None = None,
        for_export: bool | None = None,
        sort: str | None = None,
    ) -> DatasetsRetrieveSelectedImagesResponse:
        """Get selected dataset images.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username
            include_labels (bool, optional): includeLabels query parameter.
            overlay_labels (bool, optional): overlayLabels query parameter.
            include_thumbnails (bool, optional): includeThumbnails query parameter.
            include_image_urls (bool, optional): includeImageUrls query parameter.
            for_export (bool, optional): forExport query parameter.
            sort (str, optional): sort query parameter.
            image_ids (list[str]): imageIds request value.

        Returns:
            (DatasetsRetrieveSelectedImagesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveSelectedImagesResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/images",
                params={
                    "username": username,
                    "includeLabels": include_labels,
                    "overlayLabels": overlay_labels,
                    "includeThumbnails": include_thumbnails,
                    "includeImageUrls": include_image_urls,
                    "forExport": for_export,
                    "sort": sort,
                },
                json={"imageIds": image_ids},
            )
        )

    def retrieve_export(self, dataset_id: str, *, v: int | None = None) -> DatasetsRetrieveExportResponse:
        """Download a dataset export.

        Returns a signed URL for the current dataset or a saved version snapshot.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            v (int, optional): Saved version number

        Returns:
            (DatasetsRetrieveExportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveExportResponse.model_validate(
            self._client.request("GET", f"/api/datasets/{dataset_id}/export", params={"v": v})
        )

    def create_export(self, dataset_id: str, *, description: str | None = None) -> DatasetsCreateExportResponse:
        """Create a dataset version.

        Creates an immutable numbered snapshot and returns its signed NDJSON download URL.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            description (str, optional): description request value.

        Returns:
            (DatasetsCreateExportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateExportResponse.model_validate(
            self._client.request("POST", f"/api/datasets/{dataset_id}/export", json={"description": description})
        )

    def update_export(self, dataset_id: str, *, version: int, description: str) -> DatasetsUpdateExportResponse:
        """Update a dataset version description.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            version (int): version request value.
            description (str): description request value.

        Returns:
            (DatasetsUpdateExportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsUpdateExportResponse.model_validate(
            self._client.request(
                "PATCH", f"/api/datasets/{dataset_id}/export", json={"version": version, "description": description}
            )
        )

    def ingest(
        self,
        *,
        dataset_id: str,
        session_id: str | None = None,
        source_url: str | None = None,
        reference: Any | None = None,
        target_split: Literal["train", "val", "test"] | None = None,
        class_mapping: dict[str, Any] | None = None,
        conflict_policy: Literal["skip", "keep_both", "replace"] | None = None,
        image_metadata: dict[str, Any] | None = None,
    ) -> DatasetsIngestResponse:
        """Upload and process a dataset.

        Creates a dataset ingest job for an existing dataset. The request body requires datasetId plus exactly one of sessionId (for a completed signed-URL upload) or sourceUrl (for a remote ZIP, TAR, TAR.GZ, TGZ, or NDJSON import). Uploaded sessions must be bound to the same dataset via the signed-url assetId. For archives, imageMetadata maps archive-relative image paths to metadata objects. Ultralytics NDJSON image records may instead include a metadata object; record-local metadata takes precedence over imageMetadata.

        Args:
            dataset_id (str): Dataset ID to process
            session_id (str, optional): Upload session ID from signed-url response
            source_url (str, optional): Remote dataset archive or NDJSON URL
            reference (Any, optional): Connected cloud folder, or On Premise folder or archive
            target_split (Literal["train", "val", "test"], optional): Target split for new images (overrides ZIP structure)
            class_mapping (dict[str, Any], optional): User-confirmed mapping from incoming class names to existing
            conflict_policy (Literal["skip", "keep_both", "replace"], optional): How to handle filename or content conflicts
            image_metadata (dict[str, Any], optional): Custom metadata keyed by each image's archive-relative path or NDJSON file value. Paths are limited to 1,024 characters, top-level metadata keys to 128 characters, and the entire serialized map to 500,000 characters.

        Returns:
            (DatasetsIngestResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsIngestResponse.model_validate(
            self._client.request(
                "POST",
                "/api/datasets/ingest",
                json={
                    "datasetId": dataset_id,
                    "sessionId": session_id,
                    "sourceUrl": source_url,
                    "reference": reference,
                    "targetSplit": target_split,
                    "classMapping": class_mapping,
                    "conflictPolicy": conflict_policy,
                    "imageMetadata": image_metadata,
                },
            )
        )

    def retrieve_embeddings(
        self, dataset_id: str, *, username: str | None = None
    ) -> DatasetsRetrieveEmbeddingsResponse:
        """Get dataset analysis status.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsRetrieveEmbeddingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveEmbeddingsResponse.model_validate(
            self._client.request("GET", f"/api/datasets/{dataset_id}/embeddings", params={"username": username})
        )

    def create_embeddings(self, dataset_id: str, *, username: str | None = None) -> DatasetsCreateEmbeddingsResponse:
        """Analyze dataset embeddings.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsCreateEmbeddingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateEmbeddingsResponse.model_validate(
            self._client.request("POST", f"/api/datasets/{dataset_id}/embeddings", params={"username": username})
        )

    def delete_embeddings(self, dataset_id: str, *, username: str | None = None) -> DatasetsDeleteEmbeddingsResponse:
        """Cancel dataset analysis.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsDeleteEmbeddingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteEmbeddingsResponse.model_validate(
            self._client.request("DELETE", f"/api/datasets/{dataset_id}/embeddings", params={"username": username})
        )

    def retrieve_images_clustering(
        self, dataset_id: str, *, username: str | None = None, offset: int | None = None, limit: int | None = None
    ) -> DatasetsRetrieveImagesClusteringResponse:
        """Get dataset clustering layout.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username
            offset (int, optional): offset query parameter.
            limit (int, optional): limit query parameter.

        Returns:
            (DatasetsRetrieveImagesClusteringResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveImagesClusteringResponse.model_validate(
            self._client.request(
                "GET",
                f"/api/datasets/{dataset_id}/images/clustering",
                params={"username": username, "offset": offset, "limit": limit},
            )
        )

    def list_models(self, dataset_id: str, *, username: str | None = None) -> DatasetsListModelsResponse:
        """List models trained on a dataset.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsListModelsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsListModelsResponse.model_validate(
            self._client.request("GET", f"/api/datasets/{dataset_id}/models", params={"username": username})
        )

    def restore(self, dataset_id: str, *, version: int) -> DatasetsRestoreResponse:
        """Restore a saved dataset version.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            version (int): version request value.

        Returns:
            (DatasetsRestoreResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRestoreResponse.model_validate(
            self._client.request("POST", f"/api/datasets/{dataset_id}/restore", json={"version": version})
        )

    def preview_roboflow_import(
        self, *, api_key: str, owner: str | None = None
    ) -> DatasetsPreviewRoboflowImportResponse:
        """Preview a Roboflow import.

        Args:
            owner (str, optional): Workspace username
            api_key (str): apiKey request value.

        Returns:
            (DatasetsPreviewRoboflowImportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsPreviewRoboflowImportResponse.model_validate(
            self._client.request(
                "POST", "/api/integrations/roboflow/preview", params={"owner": owner}, json={"apiKey": api_key}
            )
        )

    def import_from_roboflow(
        self, *, api_key: str, items: list[dict[str, Any]], owner: str | None = None
    ) -> DatasetsImportFromRoboflowResponse:
        """Import datasets from Roboflow.

        Args:
            owner (str, optional): Workspace username
            api_key (str): apiKey request value.
            items (list[dict[str, Any]]): items request value.

        Returns:
            (DatasetsImportFromRoboflowResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsImportFromRoboflowResponse.model_validate(
            self._client.request(
                "POST",
                "/api/integrations/roboflow/import",
                params={"owner": owner},
                json={"apiKey": api_key, "items": items},
            )
        )

    def create_icon(
        self, dataset_id: str, *, image: BinaryIO, icon_color: str | None = None, icon_letter: str | None = None
    ) -> DatasetsCreateIconResponse:
        """Upload a dataset icon.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            image (BinaryIO): WebP image, maximum 5 MB
            icon_color (str, optional): iconColor request value.
            icon_letter (str, optional): iconLetter request value.

        Returns:
            (DatasetsCreateIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateIconResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/icon",
                data={"iconColor": icon_color, "iconLetter": icon_letter},
                files={"image": image},
            )
        )

    def delete_icon(self, dataset_id: str) -> DatasetsDeleteIconResponse:
        """Delete a dataset icon.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsDeleteIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteIconResponse.model_validate(
            self._client.request("DELETE", f"/api/datasets/{dataset_id}/icon")
        )


class AsyncDatasets:
    """Asynchronous Datasets API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def list(
        self,
        *,
        limit: int | None = None,
        username: str | None = None,
        owner: str | None = None,
        region: str | None = None,
        include_image_urls: bool | None = None,
        include_samples: bool | None = None,
    ) -> DatasetsListResponse:
        """List your datasets.

        Returns your datasets with pagination. Public datasets from other users are also accessible when filtering by username.

        Args:
            limit (int, optional): Number of results to return (default 1000)
            username (str, optional): Show datasets from this user instead of your own
            owner (str, optional): Team workspace to browse
            region (str, optional): Data region: us, eu, or ap
            include_image_urls (bool, optional): Set true to include signed full-size sample image URLs (thumbnail fallback)
            include_samples (bool, optional): Set false to omit sample images from the response

        Returns:
            (DatasetsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsListResponse.model_validate(
            await self._client.request(
                "GET",
                "/api/datasets",
                params={
                    "limit": limit,
                    "username": username,
                    "owner": owner,
                    "region": region,
                    "includeImageUrls": include_image_urls,
                    "includeSamples": include_samples,
                },
            )
        )

    async def create(
        self,
        *,
        slug: str,
        name: str,
        task: Literal["detect", "segment", "semantic", "classify", "pose", "obb"],
        image_count: int,
        format: Literal["yolo", "coco", "voc", "raw", "ndjson"],
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        class_names: list[str] | None = None,
        tags: list[str] | None = None,
        license: Literal[
            "None",
            "CC0-1.0",
            "PDM-1.0",
            "CC-BY-2.5",
            "CC-BY-4.0",
            "CC-BY-NC-2.0",
            "CC-BY-SA-4.0",
            "CC-BY-NC-4.0",
            "CC-BY-NC-SA-3.0",
            "CC-BY-NC-SA-4.0",
            "CC-BY-ND-4.0",
            "CC-BY-NC-ND-4.0",
            "Apache-2.0",
            "MIT",
            "AGPL-3.0",
            "GPL-3.0",
            "Research-Only",
            "Other",
        ]
        | None = None,
        owner: str | None = None,
    ) -> DatasetsCreateResponse:
        """Create a new dataset.

        Args:
            slug (str): slug request value.
            name (str): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            task (Literal["detect", "segment", "semantic", "classify", "pose", "obb"]): Dataset task type (depth coming soon)
            image_count (int): imageCount request value.
            class_names (list[str], optional): classNames request value.
            format (Literal["yolo", "coco", "voc", "raw", "ndjson"]): Dataset annotation format
            tags (list[str], optional): tags request value.
            license (Literal["None", "CC0-1.0", "PDM-1.0", "CC-BY-2.5", "CC-BY-4.0", "CC-BY-NC-2.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC-BY-NC-SA-3.0", "CC-BY-NC-SA-4.0", "CC-BY-ND-4.0", "CC-BY-NC-ND-4.0", "Apache-2.0", "MIT", "AGPL-3.0", "GPL-3.0", "Research-Only", "Other"], optional): Dataset license identifier
            owner (str, optional): Team owner username (creates resource in their workspace)

        Returns:
            (DatasetsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/datasets",
                json={
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "task": task,
                    "imageCount": image_count,
                    "classNames": class_names,
                    "format": format,
                    "tags": tags,
                    "license": license,
                    "owner": owner,
                },
            )
        )

    async def retrieve(self, dataset_id: str, *, username: str | None = None) -> DatasetsRetrieveResponse:
        """Get dataset details.

        Returns full details for a dataset including class names, split counts, and sample images.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Owner username when using a dataset slug instead of an ID

        Returns:
            (DatasetsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveResponse.model_validate(
            await self._client.request("GET", f"/api/datasets/{dataset_id}", params={"username": username})
        )

    async def update(
        self,
        dataset_id: str,
        *,
        name: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        tags: list[str] | None = None,
        class_names: list[str] | None = None,
        class_colors: dict[str, Any] | None = None,
        format: Literal["yolo", "coco", "voc", "raw", "ndjson"] | None = None,
        task: Literal["detect", "segment", "semantic", "classify", "pose", "obb"] | None = None,
        license: Literal[
            "None",
            "CC0-1.0",
            "PDM-1.0",
            "CC-BY-2.5",
            "CC-BY-4.0",
            "CC-BY-NC-2.0",
            "CC-BY-SA-4.0",
            "CC-BY-NC-4.0",
            "CC-BY-NC-SA-3.0",
            "CC-BY-NC-SA-4.0",
            "CC-BY-ND-4.0",
            "CC-BY-NC-ND-4.0",
            "Apache-2.0",
            "MIT",
            "AGPL-3.0",
            "GPL-3.0",
            "Research-Only",
            "Other",
        ]
        | None = None,
        icon_color: str | None = None,
        icon_letter: str | Literal[""] | None = None,
    ) -> DatasetsUpdateResponse:
        """Update a dataset.

        Update dataset properties like name, description, metadata, visibility, tags, or class names.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            name (str, optional): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            tags (list[str], optional): tags request value.
            class_names (list[str], optional): classNames request value.
            class_colors (dict[str, Any], optional): classColors request value.
            format (Literal["yolo", "coco", "voc", "raw", "ndjson"], optional): Dataset annotation format
            task (Literal["detect", "segment", "semantic", "classify", "pose", "obb"], optional): Dataset task type (depth coming soon)
            license (Literal["None", "CC0-1.0", "PDM-1.0", "CC-BY-2.5", "CC-BY-4.0", "CC-BY-NC-2.0", "CC-BY-SA-4.0", "CC-BY-NC-4.0", "CC-BY-NC-SA-3.0", "CC-BY-NC-SA-4.0", "CC-BY-ND-4.0", "CC-BY-NC-ND-4.0", "Apache-2.0", "MIT", "AGPL-3.0", "GPL-3.0", "Research-Only", "Other"], optional): Dataset license identifier
            icon_color (str, optional): iconColor request value.
            icon_letter (str | Literal[""], optional): iconLetter request value.

        Returns:
            (DatasetsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsUpdateResponse.model_validate(
            await self._client.request(
                "PATCH",
                f"/api/datasets/{dataset_id}",
                json={
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "tags": tags,
                    "classNames": class_names,
                    "classColors": class_colors,
                    "format": format,
                    "task": task,
                    "license": license,
                    "iconColor": icon_color,
                    "iconLetter": icon_letter,
                },
            )
        )

    async def delete(self, dataset_id: str) -> DatasetsDeleteResponse:
        """Delete a dataset.

        Moves the dataset to trash. It can be restored within 30 days before permanent deletion.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteResponse.model_validate(
            await self._client.request("DELETE", f"/api/datasets/{dataset_id}")
        )

    async def retrieve_metadata(self, dataset_id: str) -> DatasetsRetrieveMetadataResponse:
        """Get dataset metadata.

        Returns custom metadata and Ultralytics-managed properties without adding them to normal payloads.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveMetadataResponse.model_validate(
            await self._client.request("GET", f"/api/datasets/{dataset_id}/metadata")
        )

    async def clone(
        self,
        dataset_id: str,
        *,
        name: str | None = None,
        slug: str | None = None,
        description: str | None = None,
        visibility: Literal["public", "private"] | None = None,
        license: str | None = None,
        owner: str | None = None,
    ) -> DatasetsCloneResponse:
        """Clone an accessible dataset.

        Copies a public, owned, or shared dataset into your account or a workspace.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            name (str, optional): name request value.
            slug (str, optional): slug request value.
            description (str, optional): description request value.
            visibility (Literal["public", "private"], optional): Resource visibility
            license (str, optional): license request value.
            owner (str, optional): owner request value.

        Returns:
            (DatasetsCloneResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCloneResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/clone",
                json={
                    "name": name,
                    "slug": slug,
                    "description": description,
                    "visibility": visibility,
                    "license": license,
                    "owner": owner,
                },
            )
        )

    async def retrieve_class_stats(self, dataset_id: str) -> DatasetsRetrieveClassStatsResponse:
        """Get class statistics.

        Returns per-class annotation counts, image dimension distributions, and location heatmap data.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsRetrieveClassStatsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveClassStatsResponse.model_validate(
            await self._client.request("GET", f"/api/datasets/{dataset_id}/class-stats")
        )

    async def merge_classes(
        self, dataset_id: str, *, source_class_ids: list[int], target_class_id: int
    ) -> DatasetsMergeClassesResponse:
        """Merge dataset classes.

        Reassigns annotations from source classes to a target class, removes the source classes, and shifts remaining class IDs. This operation is not idempotent; re-fetch the dataset before retrying.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            source_class_ids (list[int]): sourceClassIds request value.
            target_class_id (int): targetClassId request value.

        Returns:
            (DatasetsMergeClassesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsMergeClassesResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/classes/merge",
                json={"sourceClassIds": source_class_ids, "targetClassId": target_class_id},
            )
        )

    async def delete_classes(self, dataset_id: str, *, class_ids: list[int]) -> DatasetsDeleteClassesResponse:
        """Delete dataset classes.

        Deletes annotations in the selected classes, removes the classes, and shifts remaining class IDs.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            class_ids (list[int]): classIds request value.

        Returns:
            (DatasetsDeleteClassesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteClassesResponse.model_validate(
            await self._client.request(
                "POST", f"/api/datasets/{dataset_id}/classes/delete", json={"classIds": class_ids}
            )
        )

    async def redistribute_splits(
        self, dataset_id: str, *, train: int, val: int, test: int
    ) -> DatasetsRedistributeSplitsResponse:
        """Redistribute dataset splits.

        Randomly reassigns images to train, validation, and test splits using percentages that total 100.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            train (int): Train split percentage
            val (int): Validation split percentage
            test (int): Test split percentage

        Returns:
            (DatasetsRedistributeSplitsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRedistributeSplitsResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/splits/redistribute",
                json={"train": train, "val": val, "test": test},
            )
        )

    async def list_images(
        self,
        dataset_id: str,
        *,
        username: str | None = None,
        limit: float | None = None,
        offset: float | None = None,
        cursor: str | None = None,
        include_total: bool | None = None,
        split: Literal["train", "val", "test"] | None = None,
        has_error: bool | None = None,
        has_label: bool | None = None,
        class_ids: str | None = None,
        search: str | None = None,
        sort: Literal[
            "newest",
            "oldest",
            "name-asc",
            "name-desc",
            "height-asc",
            "height-desc",
            "width-asc",
            "width-desc",
            "size-asc",
            "size-desc",
            "labels-desc",
            "labels-asc",
        ]
        | None = None,
        include_thumbnails: bool | None = None,
        include_image_urls: bool | None = None,
        include_labels: bool | None = None,
        overlay_labels: bool | None = None,
        for_export: bool | None = None,
    ) -> DatasetsListImagesResponse:
        """List images in a dataset.

        Returns paginated dataset images. Labels are omitted by default and only included as capped preview annotations when includeLabels=true or overlayLabels=true.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Owner username for public dataset access
            limit (float, optional): Number of images to return (default 50, max 5000)
            offset (float, optional): Skip this many images for pagination
            cursor (str, optional): Cursor from a previous response for efficient newest/oldest pagination
            include_total (bool, optional): Set false to skip the total count
            split (Literal["train", "val", "test"], optional): Show only images in this split
            has_error (bool, optional): Filter by images with processing errors
            has_label (bool, optional): Filter by labeled status
            class_ids (str, optional): Comma-separated class IDs. Matches images containing any of the listed classes
            search (str, optional): Case-insensitive substring search over the image name and custom metadata keys, scalar values, and array entries (name suffix optional). Values nested inside sub-objects are not matched. A 32-character hex string is an exact hash lookup instead
            sort (Literal["newest", "oldest", "name-asc", "name-desc", "height-asc", "height-desc", "width-asc", "width-desc", "size-asc", "size-desc", "labels-desc", "labels-asc"], optional): Sort order
            include_thumbnails (bool, optional): Set false to omit signed thumbnail URLs
            include_image_urls (bool, optional): Set true to include signed full-size image URLs
            include_labels (bool, optional): Set true to include capped preview labels
            overlay_labels (bool, optional): Alias for includeLabels used by gallery overlays
            for_export (bool, optional): Set true to include full labels and image URLs for export-style consumers

        Returns:
            (DatasetsListImagesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsListImagesResponse.model_validate(
            await self._client.request(
                "GET",
                f"/api/datasets/{dataset_id}/images",
                params={
                    "username": username,
                    "limit": limit,
                    "offset": offset,
                    "cursor": cursor,
                    "includeTotal": include_total,
                    "split": split,
                    "hasError": has_error,
                    "hasLabel": has_label,
                    "classIds": class_ids,
                    "search": search,
                    "sort": sort,
                    "includeThumbnails": include_thumbnails,
                    "includeImageUrls": include_image_urls,
                    "includeLabels": include_labels,
                    "overlayLabels": overlay_labels,
                    "forExport": for_export,
                },
            )
        )

    async def retrieve_selected_images(
        self,
        dataset_id: str,
        *,
        image_ids: list[str],
        username: str | None = None,
        include_labels: bool | None = None,
        overlay_labels: bool | None = None,
        include_thumbnails: bool | None = None,
        include_image_urls: bool | None = None,
        for_export: bool | None = None,
        sort: str | None = None,
    ) -> DatasetsRetrieveSelectedImagesResponse:
        """Get selected dataset images.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username
            include_labels (bool, optional): includeLabels query parameter.
            overlay_labels (bool, optional): overlayLabels query parameter.
            include_thumbnails (bool, optional): includeThumbnails query parameter.
            include_image_urls (bool, optional): includeImageUrls query parameter.
            for_export (bool, optional): forExport query parameter.
            sort (str, optional): sort query parameter.
            image_ids (list[str]): imageIds request value.

        Returns:
            (DatasetsRetrieveSelectedImagesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveSelectedImagesResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/images",
                params={
                    "username": username,
                    "includeLabels": include_labels,
                    "overlayLabels": overlay_labels,
                    "includeThumbnails": include_thumbnails,
                    "includeImageUrls": include_image_urls,
                    "forExport": for_export,
                    "sort": sort,
                },
                json={"imageIds": image_ids},
            )
        )

    async def retrieve_export(self, dataset_id: str, *, v: int | None = None) -> DatasetsRetrieveExportResponse:
        """Download a dataset export.

        Returns a signed URL for the current dataset or a saved version snapshot.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            v (int, optional): Saved version number

        Returns:
            (DatasetsRetrieveExportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveExportResponse.model_validate(
            await self._client.request("GET", f"/api/datasets/{dataset_id}/export", params={"v": v})
        )

    async def create_export(self, dataset_id: str, *, description: str | None = None) -> DatasetsCreateExportResponse:
        """Create a dataset version.

        Creates an immutable numbered snapshot and returns its signed NDJSON download URL.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            description (str, optional): description request value.

        Returns:
            (DatasetsCreateExportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateExportResponse.model_validate(
            await self._client.request("POST", f"/api/datasets/{dataset_id}/export", json={"description": description})
        )

    async def update_export(self, dataset_id: str, *, version: int, description: str) -> DatasetsUpdateExportResponse:
        """Update a dataset version description.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            version (int): version request value.
            description (str): description request value.

        Returns:
            (DatasetsUpdateExportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsUpdateExportResponse.model_validate(
            await self._client.request(
                "PATCH", f"/api/datasets/{dataset_id}/export", json={"version": version, "description": description}
            )
        )

    async def ingest(
        self,
        *,
        dataset_id: str,
        session_id: str | None = None,
        source_url: str | None = None,
        reference: Any | None = None,
        target_split: Literal["train", "val", "test"] | None = None,
        class_mapping: dict[str, Any] | None = None,
        conflict_policy: Literal["skip", "keep_both", "replace"] | None = None,
        image_metadata: dict[str, Any] | None = None,
    ) -> DatasetsIngestResponse:
        """Upload and process a dataset.

        Creates a dataset ingest job for an existing dataset. The request body requires datasetId plus exactly one of sessionId (for a completed signed-URL upload) or sourceUrl (for a remote ZIP, TAR, TAR.GZ, TGZ, or NDJSON import). Uploaded sessions must be bound to the same dataset via the signed-url assetId. For archives, imageMetadata maps archive-relative image paths to metadata objects. Ultralytics NDJSON image records may instead include a metadata object; record-local metadata takes precedence over imageMetadata.

        Args:
            dataset_id (str): Dataset ID to process
            session_id (str, optional): Upload session ID from signed-url response
            source_url (str, optional): Remote dataset archive or NDJSON URL
            reference (Any, optional): Connected cloud folder, or On Premise folder or archive
            target_split (Literal["train", "val", "test"], optional): Target split for new images (overrides ZIP structure)
            class_mapping (dict[str, Any], optional): User-confirmed mapping from incoming class names to existing
            conflict_policy (Literal["skip", "keep_both", "replace"], optional): How to handle filename or content conflicts
            image_metadata (dict[str, Any], optional): Custom metadata keyed by each image's archive-relative path or NDJSON file value. Paths are limited to 1,024 characters, top-level metadata keys to 128 characters, and the entire serialized map to 500,000 characters.

        Returns:
            (DatasetsIngestResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsIngestResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/datasets/ingest",
                json={
                    "datasetId": dataset_id,
                    "sessionId": session_id,
                    "sourceUrl": source_url,
                    "reference": reference,
                    "targetSplit": target_split,
                    "classMapping": class_mapping,
                    "conflictPolicy": conflict_policy,
                    "imageMetadata": image_metadata,
                },
            )
        )

    async def retrieve_embeddings(
        self, dataset_id: str, *, username: str | None = None
    ) -> DatasetsRetrieveEmbeddingsResponse:
        """Get dataset analysis status.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsRetrieveEmbeddingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveEmbeddingsResponse.model_validate(
            await self._client.request("GET", f"/api/datasets/{dataset_id}/embeddings", params={"username": username})
        )

    async def create_embeddings(
        self, dataset_id: str, *, username: str | None = None
    ) -> DatasetsCreateEmbeddingsResponse:
        """Analyze dataset embeddings.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsCreateEmbeddingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateEmbeddingsResponse.model_validate(
            await self._client.request("POST", f"/api/datasets/{dataset_id}/embeddings", params={"username": username})
        )

    async def delete_embeddings(
        self, dataset_id: str, *, username: str | None = None
    ) -> DatasetsDeleteEmbeddingsResponse:
        """Cancel dataset analysis.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsDeleteEmbeddingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteEmbeddingsResponse.model_validate(
            await self._client.request(
                "DELETE", f"/api/datasets/{dataset_id}/embeddings", params={"username": username}
            )
        )

    async def retrieve_images_clustering(
        self, dataset_id: str, *, username: str | None = None, offset: int | None = None, limit: int | None = None
    ) -> DatasetsRetrieveImagesClusteringResponse:
        """Get dataset clustering layout.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username
            offset (int, optional): offset query parameter.
            limit (int, optional): limit query parameter.

        Returns:
            (DatasetsRetrieveImagesClusteringResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRetrieveImagesClusteringResponse.model_validate(
            await self._client.request(
                "GET",
                f"/api/datasets/{dataset_id}/images/clustering",
                params={"username": username, "offset": offset, "limit": limit},
            )
        )

    async def list_models(self, dataset_id: str, *, username: str | None = None) -> DatasetsListModelsResponse:
        """List models trained on a dataset.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            username (str, optional): Dataset owner's username

        Returns:
            (DatasetsListModelsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsListModelsResponse.model_validate(
            await self._client.request("GET", f"/api/datasets/{dataset_id}/models", params={"username": username})
        )

    async def restore(self, dataset_id: str, *, version: int) -> DatasetsRestoreResponse:
        """Restore a saved dataset version.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            version (int): version request value.

        Returns:
            (DatasetsRestoreResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsRestoreResponse.model_validate(
            await self._client.request("POST", f"/api/datasets/{dataset_id}/restore", json={"version": version})
        )

    async def preview_roboflow_import(
        self, *, api_key: str, owner: str | None = None
    ) -> DatasetsPreviewRoboflowImportResponse:
        """Preview a Roboflow import.

        Args:
            owner (str, optional): Workspace username
            api_key (str): apiKey request value.

        Returns:
            (DatasetsPreviewRoboflowImportResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsPreviewRoboflowImportResponse.model_validate(
            await self._client.request(
                "POST", "/api/integrations/roboflow/preview", params={"owner": owner}, json={"apiKey": api_key}
            )
        )

    async def import_from_roboflow(
        self, *, api_key: str, items: list[dict[str, Any]], owner: str | None = None
    ) -> DatasetsImportFromRoboflowResponse:
        """Import datasets from Roboflow.

        Args:
            owner (str, optional): Workspace username
            api_key (str): apiKey request value.
            items (list[dict[str, Any]]): items request value.

        Returns:
            (DatasetsImportFromRoboflowResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsImportFromRoboflowResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/integrations/roboflow/import",
                params={"owner": owner},
                json={"apiKey": api_key, "items": items},
            )
        )

    async def create_icon(
        self, dataset_id: str, *, image: BinaryIO, icon_color: str | None = None, icon_letter: str | None = None
    ) -> DatasetsCreateIconResponse:
        """Upload a dataset icon.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset
            image (BinaryIO): WebP image, maximum 5 MB
            icon_color (str, optional): iconColor request value.
            icon_letter (str, optional): iconLetter request value.

        Returns:
            (DatasetsCreateIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsCreateIconResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/datasets/{dataset_id}/icon",
                data={"iconColor": icon_color, "iconLetter": icon_letter},
                files={"image": image},
            )
        )

    async def delete_icon(self, dataset_id: str) -> DatasetsDeleteIconResponse:
        """Delete a dataset icon.

        Args:
            dataset_id (str): Dataset URL name or ID, e.g. `my-dataset` from platform.ultralytics.com/username/datasets/my-dataset

        Returns:
            (DatasetsDeleteIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DatasetsDeleteIconResponse.model_validate(
            await self._client.request("DELETE", f"/api/datasets/{dataset_id}/icon")
        )
