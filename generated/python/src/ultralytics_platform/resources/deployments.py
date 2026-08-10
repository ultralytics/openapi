from __future__ import annotations

from typing import BinaryIO, Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    DeploymentsCreateResponse,
    DeploymentsDeleteResponse,
    DeploymentsListResponse,
    DeploymentsPredictResponse,
    DeploymentsRetrieveHealthResponse,
    DeploymentsRetrieveLogsResponse,
    DeploymentsRetrieveMetricsResponse,
    DeploymentsRetrieveResponse,
    DeploymentsStartResponse,
    DeploymentsStopResponse,
    DeploymentsUpdateResponse,
)


class Deployments:
    """Deployments API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def list(
        self, *, model_id: str | None = None, status: str | None = None, limit: float | None = None
    ) -> DeploymentsListResponse:
        """List your deployments.

        Returns your deployed inference endpoints.

        Args:
            model_id (str, optional): Filter by model (name or ID)
            status (str, optional): Filter by status: creating, ready, stopped, failed
            limit (float, optional): Number of results to return (default 20, max 100)

        Returns:
            (DeploymentsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsListResponse.model_validate(
            self._client.request(
                "GET", "/api/deployments", params={"modelId": model_id, "status": status, "limit": limit}
            )
        )

    def create(
        self,
        *,
        model_id: str,
        name: str,
        region: Literal[
            "asia-east1",
            "asia-northeast1",
            "asia-northeast2",
            "asia-south1",
            "asia-southeast3",
            "europe-north1",
            "europe-north2",
            "europe-southwest1",
            "europe-west1",
            "europe-west4",
            "europe-west8",
            "europe-west9",
            "me-west1",
            "northamerica-south1",
            "us-central1",
            "us-east1",
            "us-east4",
            "us-east5",
            "us-south1",
            "us-west1",
            "africa-south1",
            "asia-east2",
            "asia-northeast3",
            "asia-southeast1",
            "asia-southeast2",
            "asia-south2",
            "australia-southeast1",
            "australia-southeast2",
            "europe-central2",
            "europe-west10",
            "europe-west12",
            "europe-west2",
            "europe-west3",
            "europe-west6",
            "me-central1",
            "northamerica-northeast1",
            "northamerica-northeast2",
            "southamerica-east1",
            "southamerica-west1",
            "us-west2",
            "us-west3",
            "us-west4",
        ],
    ) -> DeploymentsCreateResponse:
        """Deploy a model.

        Creates a dedicated inference endpoint for a model. The endpoint runs on Google Cloud and scales automatically.

        Args:
            model_id (str): modelId request value.
            name (str): name request value.
            region (Literal["asia-east1", "asia-northeast1", "asia-northeast2", "asia-south1", "asia-southeast3", "europe-north1", "europe-north2", "europe-southwest1", "europe-west1", "europe-west4", "europe-west8", "europe-west9", "me-west1", "northamerica-south1", "us-central1", "us-east1", "us-east4", "us-east5", "us-south1", "us-west1", "africa-south1", "asia-east2", "asia-northeast3", "asia-southeast1", "asia-southeast2", "asia-south2", "australia-southeast1", "australia-southeast2", "europe-central2", "europe-west10", "europe-west12", "europe-west2", "europe-west3", "europe-west6", "me-central1", "northamerica-northeast1", "northamerica-northeast2", "southamerica-east1", "southamerica-west1", "us-west2", "us-west3", "us-west4"]): region request value.

        Returns:
            (DeploymentsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsCreateResponse.model_validate(
            self._client.request("POST", "/api/deployments", json={"modelId": model_id, "name": name, "region": region})
        )

    def retrieve(self, deployment_id: str) -> DeploymentsRetrieveResponse:
        """Get deployment details.

        Returns deployment configuration, status, and service URL.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveResponse.model_validate(
            self._client.request("GET", f"/api/deployments/{deployment_id}")
        )

    def update(self, deployment_id: str, *, model_id: str, name: str | None = None) -> DeploymentsUpdateResponse:
        """Replace a deployment model.

        Rolls out a new model revision while preserving the deployment ID, region, API key, and endpoint URL. An optional name is applied when the replacement becomes ready. The current revision continues serving until then.

        Args:
            deployment_id (str): Deployment URL name or ID
            model_id (str): modelId request value.
            name (str, optional): Optional new deployment display name

        Returns:
            (DeploymentsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsUpdateResponse.model_validate(
            self._client.request("PATCH", f"/api/deployments/{deployment_id}", json={"modelId": model_id, "name": name})
        )

    def delete(self, deployment_id: str) -> DeploymentsDeleteResponse:
        """Delete a deployment.

        Permanently stops and removes the inference endpoint. This cannot be undone.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsDeleteResponse.model_validate(
            self._client.request("DELETE", f"/api/deployments/{deployment_id}")
        )

    def predict(
        self,
        deployment_id: str,
        *,
        conf: float | None = None,
        iou: float | None = None,
        imgsz: int | None = None,
        normalize: bool | None = None,
        decimals: int | None = None,
        bits: Literal[8, 12, 16] | None = None,
        file: BinaryIO | None = None,
        source: str | None = None,
    ) -> DeploymentsPredictResponse:
        """Run inference on your endpoint.

        Send multipart/form-data with a file or source plus optional conf, iou, imgsz, normalize, and decimals fields to your dedicated deployment endpoint.

        Args:
            deployment_id (str): Deployment URL name or ID
            conf (float, optional): Confidence threshold (default 0.25)
            iou (float, optional): IoU threshold (default 0.7)
            imgsz (int, optional): Inference image size (default 640)
            normalize (bool, optional): Return normalized coordinates (default false)
            decimals (int, optional): Coordinate precision (default 5)
            bits (Literal[8, 12, 16], optional): Depth map quantization for depth models (default 8)
            file (BinaryIO, optional): Image or video file
            source (str, optional): Image URL or base64-encoded image

        Returns:
            (DeploymentsPredictResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsPredictResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/deployments/{deployment_id}/predict",
                data={
                    "conf": conf,
                    "iou": iou,
                    "imgsz": imgsz,
                    "normalize": normalize,
                    "decimals": decimals,
                    "bits": bits,
                    "source": source,
                },
                files={"file": file},
            )
        )

    def retrieve_health(self, deployment_id: str) -> DeploymentsRetrieveHealthResponse:
        """Check if endpoint is healthy.

        Pings the deployment endpoint and returns response time. Also warms up cold instances.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsRetrieveHealthResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveHealthResponse.model_validate(
            self._client.request("GET", f"/api/deployments/{deployment_id}/health")
        )

    def retrieve_metrics(
        self,
        deployment_id: str,
        *,
        range: Literal["1h", "6h", "24h", "7d", "30d"] | None = None,
        sparkline: bool | None = None,
    ) -> DeploymentsRetrieveMetricsResponse:
        """Get endpoint performance metrics.

        Returns request volume, latency percentiles, error rates, and resource utilization over time.

        Args:
            deployment_id (str): Deployment URL name or ID
            range (Literal["1h", "6h", "24h", "7d", "30d"], optional): Time window (default: 24h)
            sparkline (bool, optional): Return the compact 24-hour dashboard summary

        Returns:
            (DeploymentsRetrieveMetricsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveMetricsResponse.model_validate(
            self._client.request(
                "GET", f"/api/deployments/{deployment_id}/metrics", params={"range": range, "sparkline": sparkline}
            )
        )

    def retrieve_logs(
        self,
        deployment_id: str,
        *,
        severity: str | None = None,
        limit: float | None = None,
        page_token: str | None = None,
    ) -> DeploymentsRetrieveLogsResponse:
        """Get endpoint logs.

        Returns recent log entries from the deployment service for debugging.

        Args:
            deployment_id (str): Deployment URL name or ID
            severity (str, optional): Comma-separated levels: DEBUG, INFO, WARNING, ERROR, or CRITICAL
            limit (float, optional): Number of log entries (default 50, max 200)
            page_token (str, optional): Token for loading more entries

        Returns:
            (DeploymentsRetrieveLogsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveLogsResponse.model_validate(
            self._client.request(
                "GET",
                f"/api/deployments/{deployment_id}/logs",
                params={"severity": severity, "limit": limit, "pageToken": page_token},
            )
        )

    def start(self, deployment_id: str) -> DeploymentsStartResponse:
        """Start a stopped endpoint.

        Resumes a previously stopped deployment. Takes 1-2 minutes to become ready.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsStartResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsStartResponse.model_validate(
            self._client.request("POST", f"/api/deployments/{deployment_id}/start")
        )

    def stop(self, deployment_id: str) -> DeploymentsStopResponse:
        """Stop an endpoint.

        Stops the deployment to save costs. No charges while stopped. Can be restarted anytime.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsStopResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsStopResponse.model_validate(
            self._client.request("POST", f"/api/deployments/{deployment_id}/stop")
        )


class AsyncDeployments:
    """Asynchronous Deployments API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def list(
        self, *, model_id: str | None = None, status: str | None = None, limit: float | None = None
    ) -> DeploymentsListResponse:
        """List your deployments.

        Returns your deployed inference endpoints.

        Args:
            model_id (str, optional): Filter by model (name or ID)
            status (str, optional): Filter by status: creating, ready, stopped, failed
            limit (float, optional): Number of results to return (default 20, max 100)

        Returns:
            (DeploymentsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsListResponse.model_validate(
            await self._client.request(
                "GET", "/api/deployments", params={"modelId": model_id, "status": status, "limit": limit}
            )
        )

    async def create(
        self,
        *,
        model_id: str,
        name: str,
        region: Literal[
            "asia-east1",
            "asia-northeast1",
            "asia-northeast2",
            "asia-south1",
            "asia-southeast3",
            "europe-north1",
            "europe-north2",
            "europe-southwest1",
            "europe-west1",
            "europe-west4",
            "europe-west8",
            "europe-west9",
            "me-west1",
            "northamerica-south1",
            "us-central1",
            "us-east1",
            "us-east4",
            "us-east5",
            "us-south1",
            "us-west1",
            "africa-south1",
            "asia-east2",
            "asia-northeast3",
            "asia-southeast1",
            "asia-southeast2",
            "asia-south2",
            "australia-southeast1",
            "australia-southeast2",
            "europe-central2",
            "europe-west10",
            "europe-west12",
            "europe-west2",
            "europe-west3",
            "europe-west6",
            "me-central1",
            "northamerica-northeast1",
            "northamerica-northeast2",
            "southamerica-east1",
            "southamerica-west1",
            "us-west2",
            "us-west3",
            "us-west4",
        ],
    ) -> DeploymentsCreateResponse:
        """Deploy a model.

        Creates a dedicated inference endpoint for a model. The endpoint runs on Google Cloud and scales automatically.

        Args:
            model_id (str): modelId request value.
            name (str): name request value.
            region (Literal["asia-east1", "asia-northeast1", "asia-northeast2", "asia-south1", "asia-southeast3", "europe-north1", "europe-north2", "europe-southwest1", "europe-west1", "europe-west4", "europe-west8", "europe-west9", "me-west1", "northamerica-south1", "us-central1", "us-east1", "us-east4", "us-east5", "us-south1", "us-west1", "africa-south1", "asia-east2", "asia-northeast3", "asia-southeast1", "asia-southeast2", "asia-south2", "australia-southeast1", "australia-southeast2", "europe-central2", "europe-west10", "europe-west12", "europe-west2", "europe-west3", "europe-west6", "me-central1", "northamerica-northeast1", "northamerica-northeast2", "southamerica-east1", "southamerica-west1", "us-west2", "us-west3", "us-west4"]): region request value.

        Returns:
            (DeploymentsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsCreateResponse.model_validate(
            await self._client.request(
                "POST", "/api/deployments", json={"modelId": model_id, "name": name, "region": region}
            )
        )

    async def retrieve(self, deployment_id: str) -> DeploymentsRetrieveResponse:
        """Get deployment details.

        Returns deployment configuration, status, and service URL.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveResponse.model_validate(
            await self._client.request("GET", f"/api/deployments/{deployment_id}")
        )

    async def update(self, deployment_id: str, *, model_id: str, name: str | None = None) -> DeploymentsUpdateResponse:
        """Replace a deployment model.

        Rolls out a new model revision while preserving the deployment ID, region, API key, and endpoint URL. An optional name is applied when the replacement becomes ready. The current revision continues serving until then.

        Args:
            deployment_id (str): Deployment URL name or ID
            model_id (str): modelId request value.
            name (str, optional): Optional new deployment display name

        Returns:
            (DeploymentsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsUpdateResponse.model_validate(
            await self._client.request(
                "PATCH", f"/api/deployments/{deployment_id}", json={"modelId": model_id, "name": name}
            )
        )

    async def delete(self, deployment_id: str) -> DeploymentsDeleteResponse:
        """Delete a deployment.

        Permanently stops and removes the inference endpoint. This cannot be undone.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsDeleteResponse.model_validate(
            await self._client.request("DELETE", f"/api/deployments/{deployment_id}")
        )

    async def predict(
        self,
        deployment_id: str,
        *,
        conf: float | None = None,
        iou: float | None = None,
        imgsz: int | None = None,
        normalize: bool | None = None,
        decimals: int | None = None,
        bits: Literal[8, 12, 16] | None = None,
        file: BinaryIO | None = None,
        source: str | None = None,
    ) -> DeploymentsPredictResponse:
        """Run inference on your endpoint.

        Send multipart/form-data with a file or source plus optional conf, iou, imgsz, normalize, and decimals fields to your dedicated deployment endpoint.

        Args:
            deployment_id (str): Deployment URL name or ID
            conf (float, optional): Confidence threshold (default 0.25)
            iou (float, optional): IoU threshold (default 0.7)
            imgsz (int, optional): Inference image size (default 640)
            normalize (bool, optional): Return normalized coordinates (default false)
            decimals (int, optional): Coordinate precision (default 5)
            bits (Literal[8, 12, 16], optional): Depth map quantization for depth models (default 8)
            file (BinaryIO, optional): Image or video file
            source (str, optional): Image URL or base64-encoded image

        Returns:
            (DeploymentsPredictResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsPredictResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/deployments/{deployment_id}/predict",
                data={
                    "conf": conf,
                    "iou": iou,
                    "imgsz": imgsz,
                    "normalize": normalize,
                    "decimals": decimals,
                    "bits": bits,
                    "source": source,
                },
                files={"file": file},
            )
        )

    async def retrieve_health(self, deployment_id: str) -> DeploymentsRetrieveHealthResponse:
        """Check if endpoint is healthy.

        Pings the deployment endpoint and returns response time. Also warms up cold instances.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsRetrieveHealthResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveHealthResponse.model_validate(
            await self._client.request("GET", f"/api/deployments/{deployment_id}/health")
        )

    async def retrieve_metrics(
        self,
        deployment_id: str,
        *,
        range: Literal["1h", "6h", "24h", "7d", "30d"] | None = None,
        sparkline: bool | None = None,
    ) -> DeploymentsRetrieveMetricsResponse:
        """Get endpoint performance metrics.

        Returns request volume, latency percentiles, error rates, and resource utilization over time.

        Args:
            deployment_id (str): Deployment URL name or ID
            range (Literal["1h", "6h", "24h", "7d", "30d"], optional): Time window (default: 24h)
            sparkline (bool, optional): Return the compact 24-hour dashboard summary

        Returns:
            (DeploymentsRetrieveMetricsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveMetricsResponse.model_validate(
            await self._client.request(
                "GET", f"/api/deployments/{deployment_id}/metrics", params={"range": range, "sparkline": sparkline}
            )
        )

    async def retrieve_logs(
        self,
        deployment_id: str,
        *,
        severity: str | None = None,
        limit: float | None = None,
        page_token: str | None = None,
    ) -> DeploymentsRetrieveLogsResponse:
        """Get endpoint logs.

        Returns recent log entries from the deployment service for debugging.

        Args:
            deployment_id (str): Deployment URL name or ID
            severity (str, optional): Comma-separated levels: DEBUG, INFO, WARNING, ERROR, or CRITICAL
            limit (float, optional): Number of log entries (default 50, max 200)
            page_token (str, optional): Token for loading more entries

        Returns:
            (DeploymentsRetrieveLogsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsRetrieveLogsResponse.model_validate(
            await self._client.request(
                "GET",
                f"/api/deployments/{deployment_id}/logs",
                params={"severity": severity, "limit": limit, "pageToken": page_token},
            )
        )

    async def start(self, deployment_id: str) -> DeploymentsStartResponse:
        """Start a stopped endpoint.

        Resumes a previously stopped deployment. Takes 1-2 minutes to become ready.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsStartResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsStartResponse.model_validate(
            await self._client.request("POST", f"/api/deployments/{deployment_id}/start")
        )

    async def stop(self, deployment_id: str) -> DeploymentsStopResponse:
        """Stop an endpoint.

        Stops the deployment to save costs. No charges while stopped. Can be restarted anytime.

        Args:
            deployment_id (str): Deployment URL name or ID

        Returns:
            (DeploymentsStopResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return DeploymentsStopResponse.model_validate(
            await self._client.request("POST", f"/api/deployments/{deployment_id}/stop")
        )
