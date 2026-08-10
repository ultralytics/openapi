from __future__ import annotations

from typing import Any, BinaryIO, Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    AccountBrowseCloudStorageObjectsResponse,
    AccountConnectCloudStorageResponse,
    AccountCreateApiKeyResponse,
    AccountDeleteWorkspaceIconResponse,
    AccountDiscoverCloudStorageLocationsResponse,
    AccountFollowOrUnfollowUserResponse,
    AccountListApiKeysResponse,
    AccountListCloudStorageIntegrationsResponse,
    AccountPermanentlyDeleteAllTrashedItemsResponse,
    AccountPermanentlyDeleteTrashedItemResponse,
    AccountRestoreTrashedItemResponse,
    AccountRetrieveIfUsernameIsAvailableResponse,
    AccountRetrieveProfileSettingsResponse,
    AccountRetrievePublicUserProfileResponse,
    AccountRetrieveStorageUsageResponse,
    AccountRetrieveSummaryResponse,
    AccountRetrieveTrashResponse,
    AccountRevokeApiKeyResponse,
    AccountUpdateProfileSettingsResponse,
    AccountUploadWorkspaceIconResponse,
)


class Account:
    """Account API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def retrieve_summary(self) -> AccountRetrieveSummaryResponse:
        """Summarize your Platform account.

        Returns your plan, credit balance, resource counts, and team workspaces.

        Returns:
            (AccountRetrieveSummaryResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveSummaryResponse.model_validate(self._client.request("GET", "/api/account/summary"))

    def list_api_keys(self, *, owner: str | None = None) -> AccountListApiKeysResponse:
        """List your API keys.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountListApiKeysResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountListApiKeysResponse.model_validate(
            self._client.request("GET", "/api/api-keys", params={"owner": owner})
        )

    def create_api_key(self, *, owner: str | None = None, name: str | None = None) -> AccountCreateApiKeyResponse:
        """Create a new API key.

        Generates a new API key. Important: the full key is only shown once in the response — save it securely.

        Args:
            owner (str, optional): Workspace username
            name (str, optional): A label to identify this key (e.g. 'production', 'testing')

        Returns:
            (AccountCreateApiKeyResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountCreateApiKeyResponse.model_validate(
            self._client.request("POST", "/api/api-keys", params={"owner": owner}, json={"name": name})
        )

    def revoke_api_key(self, *, key_id: str, owner: str | None = None) -> AccountRevokeApiKeyResponse:
        """Revoke an API key.

        Permanently deletes an API key. Any applications using this key will stop working immediately.

        Args:
            key_id (str): ID of the key to revoke
            owner (str, optional): Workspace username

        Returns:
            (AccountRevokeApiKeyResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRevokeApiKeyResponse.model_validate(
            self._client.request("DELETE", "/api/api-keys", params={"keyId": key_id, "owner": owner})
        )

    def retrieve_storage_usage(
        self, *, owner: str | None = None, details: bool | None = None
    ) -> AccountRetrieveStorageUsageResponse:
        """Check storage usage.

        Returns storage breakdown by category (datasets, models, exports) and your largest items.

        Args:
            owner (str, optional): Team username (to check team storage)
            details (bool, optional): Include the ten largest storage consumers

        Returns:
            (AccountRetrieveStorageUsageResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveStorageUsageResponse.model_validate(
            self._client.request("GET", "/api/storage", params={"owner": owner, "details": details})
        )

    def retrieve_profile_settings(self, *, owner: str | None = None) -> AccountRetrieveProfileSettingsResponse:
        """Get your profile settings.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountRetrieveProfileSettingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveProfileSettingsResponse.model_validate(
            self._client.request("GET", "/api/settings", params={"owner": owner})
        )

    def update_profile_settings(
        self,
        *,
        owner: str | None = None,
        display_name: Any | None = None,
        company: str | None = None,
        use_case: str | None = None,
        bio: str | Literal[""] | None = None,
        github: str | None = None,
        linkedin: str | None = None,
        twitter: str | None = None,
        discord: str | None = None,
        youtube: str | None = None,
        scholar: str | None = None,
        website: str | None = None,
        icon_color: str | None = None,
        icon_letter: str | Literal[""] | None = None,
    ) -> AccountUpdateProfileSettingsResponse:
        """Update your profile settings.

        Update your display name, bio, company, social links, and other profile details.

        Args:
            owner (str, optional): Workspace username
            display_name (Any, optional): displayName request value.
            company (str, optional): company request value.
            use_case (str, optional): useCase request value.
            bio (str | Literal[""], optional): bio request value.
            github (str, optional): github request value.
            linkedin (str, optional): linkedin request value.
            twitter (str, optional): twitter request value.
            discord (str, optional): discord request value.
            youtube (str, optional): youtube request value.
            scholar (str, optional): scholar request value.
            website (str, optional): website request value.
            icon_color (str, optional): iconColor request value.
            icon_letter (str | Literal[""], optional): iconLetter request value.

        Returns:
            (AccountUpdateProfileSettingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountUpdateProfileSettingsResponse.model_validate(
            self._client.request(
                "POST",
                "/api/settings",
                params={"owner": owner},
                json={
                    "displayName": display_name,
                    "company": company,
                    "useCase": use_case,
                    "bio": bio,
                    "github": github,
                    "linkedin": linkedin,
                    "twitter": twitter,
                    "discord": discord,
                    "youtube": youtube,
                    "scholar": scholar,
                    "website": website,
                    "iconColor": icon_color,
                    "iconLetter": icon_letter,
                },
            )
        )

    def list_cloud_storage_integrations(
        self, *, owner: str | None = None
    ) -> AccountListCloudStorageIntegrationsResponse:
        """List cloud storage integrations.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountListCloudStorageIntegrationsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountListCloudStorageIntegrationsResponse.model_validate(
            self._client.request("GET", "/api/integrations/buckets", params={"owner": owner})
        )

    def connect_cloud_storage(
        self,
        *,
        provider: Literal["gcs", "s3", "azure"],
        credentials: dict[str, Any],
        targets: list[str],
        owner: str | None = None,
    ) -> AccountConnectCloudStorageResponse:
        """Connect cloud storage.

        Args:
            owner (str, optional): Workspace username
            provider (Literal["gcs", "s3", "azure"]): provider request value.
            credentials (dict[str, Any]): credentials request value.
            targets (list[str]): targets request value.

        Returns:
            (AccountConnectCloudStorageResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountConnectCloudStorageResponse.model_validate(
            self._client.request(
                "POST",
                "/api/integrations/buckets",
                params={"owner": owner},
                json={"provider": provider, "credentials": credentials, "targets": targets},
            )
        )

    def discover_cloud_storage_locations(
        self, *, provider: Literal["gcs", "s3", "azure"], credentials: dict[str, Any], owner: str | None = None
    ) -> AccountDiscoverCloudStorageLocationsResponse:
        """Discover cloud storage locations.

        Args:
            owner (str, optional): Workspace username
            provider (Literal["gcs", "s3", "azure"]): provider request value.
            credentials (dict[str, Any]): credentials request value.

        Returns:
            (AccountDiscoverCloudStorageLocationsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountDiscoverCloudStorageLocationsResponse.model_validate(
            self._client.request(
                "POST",
                "/api/integrations/buckets/discover",
                params={"owner": owner},
                json={"provider": provider, "credentials": credentials},
            )
        )

    def browse_cloud_storage_objects(
        self, id: str, *, target: str, prefix: str | None = None, cursor: str | None = None, owner: str | None = None
    ) -> AccountBrowseCloudStorageObjectsResponse:
        """Browse cloud storage objects.

        Args:
            id (str): id path parameter.
            target (str): Bucket or container name
            prefix (str, optional): Folder prefix
            cursor (str, optional): Provider pagination cursor
            owner (str, optional): Workspace username

        Returns:
            (AccountBrowseCloudStorageObjectsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountBrowseCloudStorageObjectsResponse.model_validate(
            self._client.request(
                "GET",
                f"/api/integrations/buckets/{id}/objects",
                params={"target": target, "prefix": prefix, "cursor": cursor, "owner": owner},
            )
        )

    def retrieve_trash(
        self,
        *,
        type: Literal["all", "project", "dataset", "model"] | None = None,
        page: int | None = None,
        limit: int | None = None,
        owner: str | None = None,
    ) -> AccountRetrieveTrashResponse:
        """View trash.

        Returns deleted items that can still be restored. Items are permanently deleted after 30 days.

        Args:
            type (Literal["all", "project", "dataset", "model"], optional): Resource type filter
            page (int, optional): Page number (default 1)
            limit (int, optional): Items per page (default 50)
            owner (str, optional): Workspace username

        Returns:
            (AccountRetrieveTrashResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveTrashResponse.model_validate(
            self._client.request(
                "GET", "/api/trash", params={"type": type, "page": page, "limit": limit, "owner": owner}
            )
        )

    def restore_trashed_item(
        self, *, id: str, type: Literal["project", "dataset", "model"]
    ) -> AccountRestoreTrashedItemResponse:
        """Restore a trashed item.

        Args:
            id (str): id request value.
            type (Literal["project", "dataset", "model"]): type request value.

        Returns:
            (AccountRestoreTrashedItemResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRestoreTrashedItemResponse.model_validate(
            self._client.request("POST", "/api/trash", json={"id": id, "type": type})
        )

    def permanently_delete_trashed_item(
        self, *, id: str, type: Literal["project", "dataset", "model"]
    ) -> AccountPermanentlyDeleteTrashedItemResponse:
        """Permanently delete a trashed item.

        Permanently deletes one trashed resource. This cannot be undone.

        Args:
            id (str): id request value.
            type (Literal["project", "dataset", "model"]): type request value.

        Returns:
            (AccountPermanentlyDeleteTrashedItemResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountPermanentlyDeleteTrashedItemResponse.model_validate(
            self._client.request("DELETE", "/api/trash", json={"id": id, "type": type})
        )

    def permanently_delete_all_trashed_items(
        self, *, owner: str | None = None
    ) -> AccountPermanentlyDeleteAllTrashedItemsResponse:
        """Permanently delete all trashed items.

        Permanently deletes everything in your trash. This cannot be undone.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountPermanentlyDeleteAllTrashedItemsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountPermanentlyDeleteAllTrashedItemsResponse.model_validate(
            self._client.request("DELETE", "/api/trash/empty", params={"owner": owner})
        )

    def retrieve_if_username_is_available(
        self, *, username: str, suggest: bool | None = None
    ) -> AccountRetrieveIfUsernameIsAvailableResponse:
        """Check if a username is available.

        Args:
            username (str): Username to check
            suggest (bool, optional): Return a suggestion if unavailable

        Returns:
            (AccountRetrieveIfUsernameIsAvailableResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveIfUsernameIsAvailableResponse.model_validate(
            self._client.request("GET", "/api/username/check", params={"username": username, "suggest": suggest})
        )

    def retrieve_public_user_profile(self, *, username: str) -> AccountRetrievePublicUserProfileResponse:
        """Get a public user profile.

        Args:
            username (str): Username to look up

        Returns:
            (AccountRetrievePublicUserProfileResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrievePublicUserProfileResponse.model_validate(
            self._client.request("GET", "/api/users", params={"username": username})
        )

    def follow_or_unfollow_user(self, *, username: str, followed: bool) -> AccountFollowOrUnfollowUserResponse:
        """Follow or unfollow a user.

        Args:
            username (str): username request value.
            followed (bool): followed request value.

        Returns:
            (AccountFollowOrUnfollowUserResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountFollowOrUnfollowUserResponse.model_validate(
            self._client.request("PATCH", "/api/users", json={"username": username, "followed": followed})
        )

    def upload_workspace_icon(
        self,
        *,
        image: BinaryIO,
        owner: str | None = None,
        icon_color: str | None = None,
        icon_letter: str | None = None,
    ) -> AccountUploadWorkspaceIconResponse:
        """Upload a workspace icon.

        Args:
            owner (str, optional): Workspace username
            image (BinaryIO): WebP image, maximum 5 MB
            icon_color (str, optional): iconColor request value.
            icon_letter (str, optional): iconLetter request value.

        Returns:
            (AccountUploadWorkspaceIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountUploadWorkspaceIconResponse.model_validate(
            self._client.request(
                "POST",
                "/api/settings/icon",
                params={"owner": owner},
                data={"iconColor": icon_color, "iconLetter": icon_letter},
                files={"image": image},
            )
        )

    def delete_workspace_icon(self, *, owner: str | None = None) -> AccountDeleteWorkspaceIconResponse:
        """Delete a workspace icon.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountDeleteWorkspaceIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountDeleteWorkspaceIconResponse.model_validate(
            self._client.request("DELETE", "/api/settings/icon", params={"owner": owner})
        )


class AsyncAccount:
    """Asynchronous Account API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def retrieve_summary(self) -> AccountRetrieveSummaryResponse:
        """Summarize your Platform account.

        Returns your plan, credit balance, resource counts, and team workspaces.

        Returns:
            (AccountRetrieveSummaryResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveSummaryResponse.model_validate(await self._client.request("GET", "/api/account/summary"))

    async def list_api_keys(self, *, owner: str | None = None) -> AccountListApiKeysResponse:
        """List your API keys.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountListApiKeysResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountListApiKeysResponse.model_validate(
            await self._client.request("GET", "/api/api-keys", params={"owner": owner})
        )

    async def create_api_key(self, *, owner: str | None = None, name: str | None = None) -> AccountCreateApiKeyResponse:
        """Create a new API key.

        Generates a new API key. Important: the full key is only shown once in the response — save it securely.

        Args:
            owner (str, optional): Workspace username
            name (str, optional): A label to identify this key (e.g. 'production', 'testing')

        Returns:
            (AccountCreateApiKeyResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountCreateApiKeyResponse.model_validate(
            await self._client.request("POST", "/api/api-keys", params={"owner": owner}, json={"name": name})
        )

    async def revoke_api_key(self, *, key_id: str, owner: str | None = None) -> AccountRevokeApiKeyResponse:
        """Revoke an API key.

        Permanently deletes an API key. Any applications using this key will stop working immediately.

        Args:
            key_id (str): ID of the key to revoke
            owner (str, optional): Workspace username

        Returns:
            (AccountRevokeApiKeyResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRevokeApiKeyResponse.model_validate(
            await self._client.request("DELETE", "/api/api-keys", params={"keyId": key_id, "owner": owner})
        )

    async def retrieve_storage_usage(
        self, *, owner: str | None = None, details: bool | None = None
    ) -> AccountRetrieveStorageUsageResponse:
        """Check storage usage.

        Returns storage breakdown by category (datasets, models, exports) and your largest items.

        Args:
            owner (str, optional): Team username (to check team storage)
            details (bool, optional): Include the ten largest storage consumers

        Returns:
            (AccountRetrieveStorageUsageResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveStorageUsageResponse.model_validate(
            await self._client.request("GET", "/api/storage", params={"owner": owner, "details": details})
        )

    async def retrieve_profile_settings(self, *, owner: str | None = None) -> AccountRetrieveProfileSettingsResponse:
        """Get your profile settings.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountRetrieveProfileSettingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveProfileSettingsResponse.model_validate(
            await self._client.request("GET", "/api/settings", params={"owner": owner})
        )

    async def update_profile_settings(
        self,
        *,
        owner: str | None = None,
        display_name: Any | None = None,
        company: str | None = None,
        use_case: str | None = None,
        bio: str | Literal[""] | None = None,
        github: str | None = None,
        linkedin: str | None = None,
        twitter: str | None = None,
        discord: str | None = None,
        youtube: str | None = None,
        scholar: str | None = None,
        website: str | None = None,
        icon_color: str | None = None,
        icon_letter: str | Literal[""] | None = None,
    ) -> AccountUpdateProfileSettingsResponse:
        """Update your profile settings.

        Update your display name, bio, company, social links, and other profile details.

        Args:
            owner (str, optional): Workspace username
            display_name (Any, optional): displayName request value.
            company (str, optional): company request value.
            use_case (str, optional): useCase request value.
            bio (str | Literal[""], optional): bio request value.
            github (str, optional): github request value.
            linkedin (str, optional): linkedin request value.
            twitter (str, optional): twitter request value.
            discord (str, optional): discord request value.
            youtube (str, optional): youtube request value.
            scholar (str, optional): scholar request value.
            website (str, optional): website request value.
            icon_color (str, optional): iconColor request value.
            icon_letter (str | Literal[""], optional): iconLetter request value.

        Returns:
            (AccountUpdateProfileSettingsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountUpdateProfileSettingsResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/settings",
                params={"owner": owner},
                json={
                    "displayName": display_name,
                    "company": company,
                    "useCase": use_case,
                    "bio": bio,
                    "github": github,
                    "linkedin": linkedin,
                    "twitter": twitter,
                    "discord": discord,
                    "youtube": youtube,
                    "scholar": scholar,
                    "website": website,
                    "iconColor": icon_color,
                    "iconLetter": icon_letter,
                },
            )
        )

    async def list_cloud_storage_integrations(
        self, *, owner: str | None = None
    ) -> AccountListCloudStorageIntegrationsResponse:
        """List cloud storage integrations.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountListCloudStorageIntegrationsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountListCloudStorageIntegrationsResponse.model_validate(
            await self._client.request("GET", "/api/integrations/buckets", params={"owner": owner})
        )

    async def connect_cloud_storage(
        self,
        *,
        provider: Literal["gcs", "s3", "azure"],
        credentials: dict[str, Any],
        targets: list[str],
        owner: str | None = None,
    ) -> AccountConnectCloudStorageResponse:
        """Connect cloud storage.

        Args:
            owner (str, optional): Workspace username
            provider (Literal["gcs", "s3", "azure"]): provider request value.
            credentials (dict[str, Any]): credentials request value.
            targets (list[str]): targets request value.

        Returns:
            (AccountConnectCloudStorageResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountConnectCloudStorageResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/integrations/buckets",
                params={"owner": owner},
                json={"provider": provider, "credentials": credentials, "targets": targets},
            )
        )

    async def discover_cloud_storage_locations(
        self, *, provider: Literal["gcs", "s3", "azure"], credentials: dict[str, Any], owner: str | None = None
    ) -> AccountDiscoverCloudStorageLocationsResponse:
        """Discover cloud storage locations.

        Args:
            owner (str, optional): Workspace username
            provider (Literal["gcs", "s3", "azure"]): provider request value.
            credentials (dict[str, Any]): credentials request value.

        Returns:
            (AccountDiscoverCloudStorageLocationsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountDiscoverCloudStorageLocationsResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/integrations/buckets/discover",
                params={"owner": owner},
                json={"provider": provider, "credentials": credentials},
            )
        )

    async def browse_cloud_storage_objects(
        self, id: str, *, target: str, prefix: str | None = None, cursor: str | None = None, owner: str | None = None
    ) -> AccountBrowseCloudStorageObjectsResponse:
        """Browse cloud storage objects.

        Args:
            id (str): id path parameter.
            target (str): Bucket or container name
            prefix (str, optional): Folder prefix
            cursor (str, optional): Provider pagination cursor
            owner (str, optional): Workspace username

        Returns:
            (AccountBrowseCloudStorageObjectsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountBrowseCloudStorageObjectsResponse.model_validate(
            await self._client.request(
                "GET",
                f"/api/integrations/buckets/{id}/objects",
                params={"target": target, "prefix": prefix, "cursor": cursor, "owner": owner},
            )
        )

    async def retrieve_trash(
        self,
        *,
        type: Literal["all", "project", "dataset", "model"] | None = None,
        page: int | None = None,
        limit: int | None = None,
        owner: str | None = None,
    ) -> AccountRetrieveTrashResponse:
        """View trash.

        Returns deleted items that can still be restored. Items are permanently deleted after 30 days.

        Args:
            type (Literal["all", "project", "dataset", "model"], optional): Resource type filter
            page (int, optional): Page number (default 1)
            limit (int, optional): Items per page (default 50)
            owner (str, optional): Workspace username

        Returns:
            (AccountRetrieveTrashResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveTrashResponse.model_validate(
            await self._client.request(
                "GET", "/api/trash", params={"type": type, "page": page, "limit": limit, "owner": owner}
            )
        )

    async def restore_trashed_item(
        self, *, id: str, type: Literal["project", "dataset", "model"]
    ) -> AccountRestoreTrashedItemResponse:
        """Restore a trashed item.

        Args:
            id (str): id request value.
            type (Literal["project", "dataset", "model"]): type request value.

        Returns:
            (AccountRestoreTrashedItemResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRestoreTrashedItemResponse.model_validate(
            await self._client.request("POST", "/api/trash", json={"id": id, "type": type})
        )

    async def permanently_delete_trashed_item(
        self, *, id: str, type: Literal["project", "dataset", "model"]
    ) -> AccountPermanentlyDeleteTrashedItemResponse:
        """Permanently delete a trashed item.

        Permanently deletes one trashed resource. This cannot be undone.

        Args:
            id (str): id request value.
            type (Literal["project", "dataset", "model"]): type request value.

        Returns:
            (AccountPermanentlyDeleteTrashedItemResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountPermanentlyDeleteTrashedItemResponse.model_validate(
            await self._client.request("DELETE", "/api/trash", json={"id": id, "type": type})
        )

    async def permanently_delete_all_trashed_items(
        self, *, owner: str | None = None
    ) -> AccountPermanentlyDeleteAllTrashedItemsResponse:
        """Permanently delete all trashed items.

        Permanently deletes everything in your trash. This cannot be undone.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountPermanentlyDeleteAllTrashedItemsResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountPermanentlyDeleteAllTrashedItemsResponse.model_validate(
            await self._client.request("DELETE", "/api/trash/empty", params={"owner": owner})
        )

    async def retrieve_if_username_is_available(
        self, *, username: str, suggest: bool | None = None
    ) -> AccountRetrieveIfUsernameIsAvailableResponse:
        """Check if a username is available.

        Args:
            username (str): Username to check
            suggest (bool, optional): Return a suggestion if unavailable

        Returns:
            (AccountRetrieveIfUsernameIsAvailableResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrieveIfUsernameIsAvailableResponse.model_validate(
            await self._client.request("GET", "/api/username/check", params={"username": username, "suggest": suggest})
        )

    async def retrieve_public_user_profile(self, *, username: str) -> AccountRetrievePublicUserProfileResponse:
        """Get a public user profile.

        Args:
            username (str): Username to look up

        Returns:
            (AccountRetrievePublicUserProfileResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountRetrievePublicUserProfileResponse.model_validate(
            await self._client.request("GET", "/api/users", params={"username": username})
        )

    async def follow_or_unfollow_user(self, *, username: str, followed: bool) -> AccountFollowOrUnfollowUserResponse:
        """Follow or unfollow a user.

        Args:
            username (str): username request value.
            followed (bool): followed request value.

        Returns:
            (AccountFollowOrUnfollowUserResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountFollowOrUnfollowUserResponse.model_validate(
            await self._client.request("PATCH", "/api/users", json={"username": username, "followed": followed})
        )

    async def upload_workspace_icon(
        self,
        *,
        image: BinaryIO,
        owner: str | None = None,
        icon_color: str | None = None,
        icon_letter: str | None = None,
    ) -> AccountUploadWorkspaceIconResponse:
        """Upload a workspace icon.

        Args:
            owner (str, optional): Workspace username
            image (BinaryIO): WebP image, maximum 5 MB
            icon_color (str, optional): iconColor request value.
            icon_letter (str, optional): iconLetter request value.

        Returns:
            (AccountUploadWorkspaceIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountUploadWorkspaceIconResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/settings/icon",
                params={"owner": owner},
                data={"iconColor": icon_color, "iconLetter": icon_letter},
                files={"image": image},
            )
        )

    async def delete_workspace_icon(self, *, owner: str | None = None) -> AccountDeleteWorkspaceIconResponse:
        """Delete a workspace icon.

        Args:
            owner (str, optional): Workspace username

        Returns:
            (AccountDeleteWorkspaceIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return AccountDeleteWorkspaceIconResponse.model_validate(
            await self._client.request("DELETE", "/api/settings/icon", params={"owner": owner})
        )
