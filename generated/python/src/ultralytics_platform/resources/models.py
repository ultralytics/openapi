from __future__ import annotations

from typing import Any, BinaryIO, Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    ModelsCloneResponse,
    ModelsCreateResponse,
    ModelsDeleteResponse,
    ModelsDeleteTrainingResponse,
    ModelsListCompletedResponse,
    ModelsListResponse,
    ModelsPredictResponse,
    ModelsRetrieveFilesResponse,
    ModelsRetrieveMetadataResponse,
    ModelsRetrieveResponse,
    ModelsRetrieveTrainingResponse,
    ModelsTrackDownloadResponse,
    ModelsUpdateResponse,
)


class Models:
    """Models API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def list(
        self,
        *,
        project_id: str | None = None,
        username: str | None = None,
        project_slug: str | None = None,
        limit: float | None = None,
        fields: str | None = None,
        ids: str | None = None,
    ) -> ModelsListResponse:
        """List models in a project.

        Returns models for a project. Specify the project by name or ID.

        Args:
            project_id (str, optional): Project name or ID
            username (str, optional): Project owner's username (for browsing other users' public models)
            project_slug (str, optional): Project name, e.g. `my-project` (use with username)
            limit (float, optional): Number of results to return (default 20, max 100)
            fields (str, optional): Response detail level: 'summary' or 'charts'
            ids (str, optional): Comma-separated model IDs to return

        Returns:
            (ModelsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsListResponse.model_validate(
            self._client.request(
                "GET",
                "/api/models",
                params={
                    "projectId": project_id,
                    "username": username,
                    "projectSlug": project_slug,
                    "limit": limit,
                    "fields": fields,
                    "ids": ids,
                },
            )
        )

    def create(
        self,
        *,
        project_id: str,
        slug: str | None = None,
        name: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = None,
        train_args: dict[str, Any] | None = None,
        train_results: list[dict[str, Any]] | None = None,
        epochs: float | None = None,
        metrics: dict[str, Any] | None = None,
        version: str | None = None,
        docs: str | None = None,
        environment: dict[str, Any] | None = None,
        completed_at: str | None = None,
    ) -> ModelsCreateResponse:
        """Create a new model.

        Creates a model inside a project. The model can then be trained or have weights uploaded.

        Args:
            project_id (str): projectId request value.
            slug (str, optional): slug request value.
            name (str, optional): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            task (Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"], optional): YOLO task type
            train_args (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            train_results (list[dict[str, Any]], optional): trainResults request value.
            epochs (float, optional): epochs request value.
            metrics (dict[str, Any], optional): metrics request value.
            version (str, optional): version request value.
            docs (str, optional): Documentation URL from .pt file
            environment (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            completed_at (str, optional): completedAt request value.

        Returns:
            (ModelsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsCreateResponse.model_validate(
            self._client.request(
                "POST",
                "/api/models",
                json={
                    "projectId": project_id,
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "task": task,
                    "trainArgs": train_args,
                    "trainResults": train_results,
                    "epochs": epochs,
                    "metrics": metrics,
                    "version": version,
                    "docs": docs,
                    "environment": environment,
                    "completedAt": completed_at,
                },
            )
        )

    def list_completed(self, *, owner: str | None = None) -> ModelsListCompletedResponse:
        """List usable models across projects.

        Returns models with usable weights across the account or workspace for training and deployment.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (ModelsListCompletedResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsListCompletedResponse.model_validate(
            self._client.request("GET", "/api/models/completed", params={"owner": owner})
        )

    def retrieve(
        self,
        model_id: str,
        *,
        username: str | None = None,
        project: str | None = None,
        project_id: str | None = None,
        analysis: Literal["1"] | None = None,
    ) -> ModelsRetrieveResponse:
        """Get model details.

        Returns model details including training status, per-epoch metrics, validation plots, and file info. Pass `analysis=1` to instead return the per-image validation analysis: worst and best cohorts with up to 100 example images each, TP/FP/FN/F1 at IoU 0.50, image traits, and trait-vs-F1 comparisons.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            username (str, optional): Owner username when using a model slug instead of an ID
            project (str, optional): Project slug or ID used to disambiguate model slugs
            project_id (str, optional): Alias of `project` accepted by the route
            analysis (Literal["1"], optional): Return the per-image validation analysis, not model details

        Returns:
            (ModelsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveResponse.model_validate(
            self._client.request(
                "GET",
                f"/api/models/{model_id}",
                params={"username": username, "project": project, "projectId": project_id, "analysis": analysis},
            )
        )

    def update(
        self,
        model_id: str,
        *,
        name: str | None = None,
        color: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        status: Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"]
        | None = None,
        license: Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None = None,
        dataset_slug: str | None = None,
        train_args: dict[str, Any] | None = None,
        train_results: list[dict[str, Any]] | None = None,
        epochs: float | None = None,
        best_epoch: float | None = None,
        best_fitness: float | None = None,
        version: str | None = None,
        training_error: dict[str, Any] | None = None,
    ) -> ModelsUpdateResponse:
        """Update a model.

        Update model properties like name, description, metadata, or training status.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            name (str, optional): name request value.
            color (str | None, optional): color request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            status (Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"], optional): Training/model status
            license (Literal["None", "Apache-2.0", "MIT", "BSD-3-Clause", "AGPL-3.0", "GPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.1", "Unlicense", "CC0-1.0", "Ultralytics-Enterprise", "Other"], optional): Project/model license identifier
            dataset_slug (str | None, optional): datasetSlug request value.
            train_args (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            train_results (list[dict[str, Any]], optional): trainResults request value.
            epochs (float, optional): epochs request value.
            best_epoch (float, optional): bestEpoch request value.
            best_fitness (float, optional): bestFitness request value.
            version (str, optional): version request value.
            training_error (dict[str, Any], optional): trainingError request value.

        Returns:
            (ModelsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsUpdateResponse.model_validate(
            self._client.request(
                "PATCH",
                f"/api/models/{model_id}",
                json={
                    "name": name,
                    "color": color,
                    "description": description,
                    "metadata": metadata,
                    "status": status,
                    "license": license,
                    "datasetSlug": dataset_slug,
                    "trainArgs": train_args,
                    "trainResults": train_results,
                    "epochs": epochs,
                    "bestEpoch": best_epoch,
                    "bestFitness": best_fitness,
                    "version": version,
                    "trainingError": training_error,
                },
            )
        )

    def delete(self, model_id: str) -> ModelsDeleteResponse:
        """Delete a model.

        Moves the model to trash. Can be restored within 30 days.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsDeleteResponse.model_validate(self._client.request("DELETE", f"/api/models/{model_id}"))

    def retrieve_metadata(self, model_id: str) -> ModelsRetrieveMetadataResponse:
        """Get model metadata.

        Returns custom metadata and Ultralytics-managed properties without adding them to normal payloads.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveMetadataResponse.model_validate(
            self._client.request("GET", f"/api/models/{model_id}/metadata")
        )

    def clone(
        self,
        model_id: str,
        *,
        target_project_slug: str,
        model_name: str | None = None,
        description: str | None = None,
        owner: str | None = None,
    ) -> ModelsCloneResponse:
        """Clone an accessible model.

        Copies a public, owned, or shared model into an existing project.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            target_project_slug (str): targetProjectSlug request value.
            model_name (str, optional): modelName request value.
            description (str, optional): description request value.
            owner (str, optional): owner request value.

        Returns:
            (ModelsCloneResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsCloneResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/models/{model_id}/clone",
                json={
                    "targetProjectSlug": target_project_slug,
                    "modelName": model_name,
                    "description": description,
                    "owner": owner,
                },
            )
        )

    def retrieve_files(self, model_id: str) -> ModelsRetrieveFilesResponse:
        """Download model files.

        Returns signed download URLs for model weights and exported files. URLs are valid for 1 hour.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsRetrieveFilesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveFilesResponse.model_validate(self._client.request("GET", f"/api/models/{model_id}/files"))

    def predict(
        self,
        model_id: str,
        *,
        conf: float | None = None,
        iou: float | None = None,
        imgsz: int | None = None,
        normalize: bool | None = None,
        decimals: int | None = None,
        bits: Literal[8, 12, 16] | None = None,
        file: BinaryIO | None = None,
        source: str | None = None,
    ) -> ModelsPredictResponse:
        """Run inference on a model.

        Send an image to run YOLO inference using shared GPU infrastructure. Supports all YOLO tasks (detect, segment, classify, pose, obb).

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            conf (float, optional): Confidence threshold (default 0.25)
            iou (float, optional): IoU threshold (default 0.7)
            imgsz (int, optional): Inference image size (default 640)
            normalize (bool, optional): Return normalized coordinates (default false)
            decimals (int, optional): Coordinate precision (default 5)
            bits (Literal[8, 12, 16], optional): Depth map quantization for depth models (default 8)
            file (BinaryIO, optional): Image or video file
            source (str, optional): Image URL or base64-encoded image

        Returns:
            (ModelsPredictResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsPredictResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/models/{model_id}/predict",
                data={
                    "conf": conf,
                    "iou": iou,
                    "imgsz": imgsz,
                    "normalize": normalize,
                    "decimals": decimals,
                    "bits": bits,
                    "file": file,
                    "source": source,
                },
            )
        )

    def retrieve_training(
        self, model_id: str, *, username: str | None = None, project: str | None = None, project_id: str | None = None
    ) -> ModelsRetrieveTrainingResponse:
        """Check training progress.

        Returns live status, epoch progress, timing, compute, metrics, and error details.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            username (str, optional): Owner username when using a model slug
            project (str, optional): Project slug or ID used to disambiguate model slugs
            project_id (str, optional): Alias of project

        Returns:
            (ModelsRetrieveTrainingResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveTrainingResponse.model_validate(
            self._client.request(
                "GET",
                f"/api/models/{model_id}/training",
                params={"username": username, "project": project, "projectId": project_id},
            )
        )

    def delete_training(self, model_id: str) -> ModelsDeleteTrainingResponse:
        """Cancel training.

        Terminates the compute instance and marks the model as cancelled.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsDeleteTrainingResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsDeleteTrainingResponse.model_validate(
            self._client.request("DELETE", f"/api/models/{model_id}/training")
        )

    def track_download(
        self, model_id: str, *, username: str | None = None, project: str | None = None, project_id: str | None = None
    ) -> ModelsTrackDownloadResponse:
        """Track a model download.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            username (str, optional): Model owner's username
            project (str, optional): Project slug or ID
            project_id (str, optional): Alias of project

        Returns:
            (ModelsTrackDownloadResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsTrackDownloadResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/models/{model_id}/track-download",
                params={"username": username, "project": project, "projectId": project_id},
            )
        )


class AsyncModels:
    """Asynchronous Models API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def list(
        self,
        *,
        project_id: str | None = None,
        username: str | None = None,
        project_slug: str | None = None,
        limit: float | None = None,
        fields: str | None = None,
        ids: str | None = None,
    ) -> ModelsListResponse:
        """List models in a project.

        Returns models for a project. Specify the project by name or ID.

        Args:
            project_id (str, optional): Project name or ID
            username (str, optional): Project owner's username (for browsing other users' public models)
            project_slug (str, optional): Project name, e.g. `my-project` (use with username)
            limit (float, optional): Number of results to return (default 20, max 100)
            fields (str, optional): Response detail level: 'summary' or 'charts'
            ids (str, optional): Comma-separated model IDs to return

        Returns:
            (ModelsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsListResponse.model_validate(
            await self._client.request(
                "GET",
                "/api/models",
                params={
                    "projectId": project_id,
                    "username": username,
                    "projectSlug": project_slug,
                    "limit": limit,
                    "fields": fields,
                    "ids": ids,
                },
            )
        )

    async def create(
        self,
        *,
        project_id: str,
        slug: str | None = None,
        name: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        task: Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"] | None = None,
        train_args: dict[str, Any] | None = None,
        train_results: list[dict[str, Any]] | None = None,
        epochs: float | None = None,
        metrics: dict[str, Any] | None = None,
        version: str | None = None,
        docs: str | None = None,
        environment: dict[str, Any] | None = None,
        completed_at: str | None = None,
    ) -> ModelsCreateResponse:
        """Create a new model.

        Creates a model inside a project. The model can then be trained or have weights uploaded.

        Args:
            project_id (str): projectId request value.
            slug (str, optional): slug request value.
            name (str, optional): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            task (Literal["detect", "segment", "semantic", "depth", "classify", "pose", "obb"], optional): YOLO task type
            train_args (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            train_results (list[dict[str, Any]], optional): trainResults request value.
            epochs (float, optional): epochs request value.
            metrics (dict[str, Any], optional): metrics request value.
            version (str, optional): version request value.
            docs (str, optional): Documentation URL from .pt file
            environment (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            completed_at (str, optional): completedAt request value.

        Returns:
            (ModelsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsCreateResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/models",
                json={
                    "projectId": project_id,
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "task": task,
                    "trainArgs": train_args,
                    "trainResults": train_results,
                    "epochs": epochs,
                    "metrics": metrics,
                    "version": version,
                    "docs": docs,
                    "environment": environment,
                    "completedAt": completed_at,
                },
            )
        )

    async def list_completed(self, *, owner: str | None = None) -> ModelsListCompletedResponse:
        """List usable models across projects.

        Returns models with usable weights across the account or workspace for training and deployment.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (ModelsListCompletedResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsListCompletedResponse.model_validate(
            await self._client.request("GET", "/api/models/completed", params={"owner": owner})
        )

    async def retrieve(
        self,
        model_id: str,
        *,
        username: str | None = None,
        project: str | None = None,
        project_id: str | None = None,
        analysis: Literal["1"] | None = None,
    ) -> ModelsRetrieveResponse:
        """Get model details.

        Returns model details including training status, per-epoch metrics, validation plots, and file info. Pass `analysis=1` to instead return the per-image validation analysis: worst and best cohorts with up to 100 example images each, TP/FP/FN/F1 at IoU 0.50, image traits, and trait-vs-F1 comparisons.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            username (str, optional): Owner username when using a model slug instead of an ID
            project (str, optional): Project slug or ID used to disambiguate model slugs
            project_id (str, optional): Alias of `project` accepted by the route
            analysis (Literal["1"], optional): Return the per-image validation analysis, not model details

        Returns:
            (ModelsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveResponse.model_validate(
            await self._client.request(
                "GET",
                f"/api/models/{model_id}",
                params={"username": username, "project": project, "projectId": project_id, "analysis": analysis},
            )
        )

    async def update(
        self,
        model_id: str,
        *,
        name: str | None = None,
        color: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        status: Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"]
        | None = None,
        license: Literal[
            "None",
            "Apache-2.0",
            "MIT",
            "BSD-3-Clause",
            "AGPL-3.0",
            "GPL-3.0",
            "LGPL-3.0",
            "MPL-2.0",
            "EUPL-1.1",
            "Unlicense",
            "CC0-1.0",
            "Ultralytics-Enterprise",
            "Other",
        ]
        | None = None,
        dataset_slug: str | None = None,
        train_args: dict[str, Any] | None = None,
        train_results: list[dict[str, Any]] | None = None,
        epochs: float | None = None,
        best_epoch: float | None = None,
        best_fitness: float | None = None,
        version: str | None = None,
        training_error: dict[str, Any] | None = None,
    ) -> ModelsUpdateResponse:
        """Update a model.

        Update model properties like name, description, metadata, or training status.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            name (str, optional): name request value.
            color (str | None, optional): color request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            status (Literal["pending", "untrained", "starting", "running", "completed", "failed", "cancelled"], optional): Training/model status
            license (Literal["None", "Apache-2.0", "MIT", "BSD-3-Clause", "AGPL-3.0", "GPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.1", "Unlicense", "CC0-1.0", "Ultralytics-Enterprise", "Other"], optional): Project/model license identifier
            dataset_slug (str | None, optional): datasetSlug request value.
            train_args (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            train_results (list[dict[str, Any]], optional): trainResults request value.
            epochs (float, optional): epochs request value.
            best_epoch (float, optional): bestEpoch request value.
            best_fitness (float, optional): bestFitness request value.
            version (str, optional): version request value.
            training_error (dict[str, Any], optional): trainingError request value.

        Returns:
            (ModelsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsUpdateResponse.model_validate(
            await self._client.request(
                "PATCH",
                f"/api/models/{model_id}",
                json={
                    "name": name,
                    "color": color,
                    "description": description,
                    "metadata": metadata,
                    "status": status,
                    "license": license,
                    "datasetSlug": dataset_slug,
                    "trainArgs": train_args,
                    "trainResults": train_results,
                    "epochs": epochs,
                    "bestEpoch": best_epoch,
                    "bestFitness": best_fitness,
                    "version": version,
                    "trainingError": training_error,
                },
            )
        )

    async def delete(self, model_id: str) -> ModelsDeleteResponse:
        """Delete a model.

        Moves the model to trash. Can be restored within 30 days.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsDeleteResponse.model_validate(await self._client.request("DELETE", f"/api/models/{model_id}"))

    async def retrieve_metadata(self, model_id: str) -> ModelsRetrieveMetadataResponse:
        """Get model metadata.

        Returns custom metadata and Ultralytics-managed properties without adding them to normal payloads.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveMetadataResponse.model_validate(
            await self._client.request("GET", f"/api/models/{model_id}/metadata")
        )

    async def clone(
        self,
        model_id: str,
        *,
        target_project_slug: str,
        model_name: str | None = None,
        description: str | None = None,
        owner: str | None = None,
    ) -> ModelsCloneResponse:
        """Clone an accessible model.

        Copies a public, owned, or shared model into an existing project.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            target_project_slug (str): targetProjectSlug request value.
            model_name (str, optional): modelName request value.
            description (str, optional): description request value.
            owner (str, optional): owner request value.

        Returns:
            (ModelsCloneResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsCloneResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/models/{model_id}/clone",
                json={
                    "targetProjectSlug": target_project_slug,
                    "modelName": model_name,
                    "description": description,
                    "owner": owner,
                },
            )
        )

    async def retrieve_files(self, model_id: str) -> ModelsRetrieveFilesResponse:
        """Download model files.

        Returns signed download URLs for model weights and exported files. URLs are valid for 1 hour.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsRetrieveFilesResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveFilesResponse.model_validate(
            await self._client.request("GET", f"/api/models/{model_id}/files")
        )

    async def predict(
        self,
        model_id: str,
        *,
        conf: float | None = None,
        iou: float | None = None,
        imgsz: int | None = None,
        normalize: bool | None = None,
        decimals: int | None = None,
        bits: Literal[8, 12, 16] | None = None,
        file: BinaryIO | None = None,
        source: str | None = None,
    ) -> ModelsPredictResponse:
        """Run inference on a model.

        Send an image to run YOLO inference using shared GPU infrastructure. Supports all YOLO tasks (detect, segment, classify, pose, obb).

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            conf (float, optional): Confidence threshold (default 0.25)
            iou (float, optional): IoU threshold (default 0.7)
            imgsz (int, optional): Inference image size (default 640)
            normalize (bool, optional): Return normalized coordinates (default false)
            decimals (int, optional): Coordinate precision (default 5)
            bits (Literal[8, 12, 16], optional): Depth map quantization for depth models (default 8)
            file (BinaryIO, optional): Image or video file
            source (str, optional): Image URL or base64-encoded image

        Returns:
            (ModelsPredictResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsPredictResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/models/{model_id}/predict",
                data={
                    "conf": conf,
                    "iou": iou,
                    "imgsz": imgsz,
                    "normalize": normalize,
                    "decimals": decimals,
                    "bits": bits,
                    "file": file,
                    "source": source,
                },
            )
        )

    async def retrieve_training(
        self, model_id: str, *, username: str | None = None, project: str | None = None, project_id: str | None = None
    ) -> ModelsRetrieveTrainingResponse:
        """Check training progress.

        Returns live status, epoch progress, timing, compute, metrics, and error details.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            username (str, optional): Owner username when using a model slug
            project (str, optional): Project slug or ID used to disambiguate model slugs
            project_id (str, optional): Alias of project

        Returns:
            (ModelsRetrieveTrainingResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsRetrieveTrainingResponse.model_validate(
            await self._client.request(
                "GET",
                f"/api/models/{model_id}/training",
                params={"username": username, "project": project, "projectId": project_id},
            )
        )

    async def delete_training(self, model_id: str) -> ModelsDeleteTrainingResponse:
        """Cancel training.

        Terminates the compute instance and marks the model as cancelled.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects

        Returns:
            (ModelsDeleteTrainingResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsDeleteTrainingResponse.model_validate(
            await self._client.request("DELETE", f"/api/models/{model_id}/training")
        )

    async def track_download(
        self, model_id: str, *, username: str | None = None, project: str | None = None, project_id: str | None = None
    ) -> ModelsTrackDownloadResponse:
        """Track a model download.

        Args:
            model_id (str): Model URL name or ID. Use `?project=my-project` to disambiguate models across projects
            username (str, optional): Model owner's username
            project (str, optional): Project slug or ID
            project_id (str, optional): Alias of project

        Returns:
            (ModelsTrackDownloadResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ModelsTrackDownloadResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/models/{model_id}/track-download",
                params={"username": username, "project": project, "projectId": project_id},
            )
        )
