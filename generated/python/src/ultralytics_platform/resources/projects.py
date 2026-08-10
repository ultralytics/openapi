from __future__ import annotations

from typing import Any, BinaryIO, Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    ProjectsCloneResponse,
    ProjectsCreateIconResponse,
    ProjectsCreateResponse,
    ProjectsDeleteIconResponse,
    ProjectsDeleteResponse,
    ProjectsListResponse,
    ProjectsRetrieveMetadataResponse,
    ProjectsRetrieveResponse,
    ProjectsUpdateResponse,
)


class Projects:
    """Projects API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def list(
        self,
        *,
        limit: float | None = None,
        username: str | None = None,
        owner: str | None = None,
        region: str | None = None,
    ) -> ProjectsListResponse:
        """List your projects.

        Returns your projects with pagination. Public projects from other users are also accessible when filtering by username.

        Args:
            limit (float, optional): Number of results to return (default 20, max 500)
            username (str, optional): Show projects from this user instead of your own
            owner (str, optional): Team workspace to browse
            region (str, optional): Data region: us, eu, or ap

        Returns:
            (ProjectsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsListResponse.model_validate(
            self._client.request(
                "GET", "/api/projects", params={"limit": limit, "username": username, "owner": owner, "region": region}
            )
        )

    def create(
        self,
        *,
        slug: str,
        name: str,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        tags: list[str] | None = None,
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
        owner: str | None = None,
    ) -> ProjectsCreateResponse:
        """Create a new project.

        Projects organize your models. Each model belongs to exactly one project.

        Args:
            slug (str): slug request value.
            name (str): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            tags (list[str], optional): tags request value.
            license (Literal["None", "Apache-2.0", "MIT", "BSD-3-Clause", "AGPL-3.0", "GPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.1", "Unlicense", "CC0-1.0", "Ultralytics-Enterprise", "Other"], optional): Project/model license identifier
            owner (str, optional): Team owner username (creates resource in their workspace)

        Returns:
            (ProjectsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsCreateResponse.model_validate(
            self._client.request(
                "POST",
                "/api/projects",
                json={
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "tags": tags,
                    "license": license,
                    "owner": owner,
                },
            )
        )

    def retrieve(self, project_id: str, *, username: str | None = None) -> ProjectsRetrieveResponse:
        """Get project details.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            username (str, optional): Owner username when using a project slug instead of an ID

        Returns:
            (ProjectsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsRetrieveResponse.model_validate(
            self._client.request("GET", f"/api/projects/{project_id}", params={"username": username})
        )

    def update(
        self,
        project_id: str,
        *,
        name: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        tags: list[str] | None = None,
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
        archived: bool | None = None,
        icon_color: str | None = None,
        icon_letter: str | Literal[""] | None = None,
        view_preferences: dict[str, Any] | None = None,
    ) -> ProjectsUpdateResponse:
        """Update a project.

        Update project properties like name, description, metadata, visibility, or tags.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            name (str, optional): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            tags (list[str], optional): tags request value.
            license (Literal["None", "Apache-2.0", "MIT", "BSD-3-Clause", "AGPL-3.0", "GPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.1", "Unlicense", "CC0-1.0", "Ultralytics-Enterprise", "Other"], optional): Project/model license identifier
            archived (bool, optional): archived request value.
            icon_color (str, optional): iconColor request value.
            icon_letter (str | Literal[""] | None, optional): iconLetter request value.
            view_preferences (dict[str, Any], optional): Shared project-level model view defaults

        Returns:
            (ProjectsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsUpdateResponse.model_validate(
            self._client.request(
                "PATCH",
                f"/api/projects/{project_id}",
                json={
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "tags": tags,
                    "license": license,
                    "archived": archived,
                    "iconColor": icon_color,
                    "iconLetter": icon_letter,
                    "viewPreferences": view_preferences,
                },
            )
        )

    def delete(self, project_id: str) -> ProjectsDeleteResponse:
        """Delete a project.

        Moves the project and all its models to trash. Can be restored within 30 days.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project

        Returns:
            (ProjectsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsDeleteResponse.model_validate(self._client.request("DELETE", f"/api/projects/{project_id}"))

    def retrieve_metadata(self, project_id: str) -> ProjectsRetrieveMetadataResponse:
        """Get project metadata.

        Returns custom metadata and Ultralytics-managed properties without adding them to normal payloads.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project

        Returns:
            (ProjectsRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsRetrieveMetadataResponse.model_validate(
            self._client.request("GET", f"/api/projects/{project_id}/metadata")
        )

    def clone(
        self,
        project_id: str,
        *,
        name: str | None = None,
        slug: str | None = None,
        description: str | None = None,
        visibility: Literal["public", "private"] | None = None,
        license: str | None = None,
        owner: str | None = None,
    ) -> ProjectsCloneResponse:
        """Clone an accessible project.

        Copies a public, owned, or shared project and its models into your account or a workspace.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            name (str, optional): name request value.
            slug (str, optional): slug request value.
            description (str, optional): description request value.
            visibility (Literal["public", "private"], optional): Resource visibility
            license (str, optional): license request value.
            owner (str, optional): owner request value.

        Returns:
            (ProjectsCloneResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsCloneResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/projects/{project_id}/clone",
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

    def create_icon(
        self, project_id: str, *, image: BinaryIO, icon_color: str | None = None, icon_letter: str | None = None
    ) -> ProjectsCreateIconResponse:
        """Upload a project icon.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            image (BinaryIO): WebP image, maximum 5 MB
            icon_color (str, optional): iconColor request value.
            icon_letter (str, optional): iconLetter request value.

        Returns:
            (ProjectsCreateIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsCreateIconResponse.model_validate(
            self._client.request(
                "POST",
                f"/api/projects/{project_id}/icon",
                data={"iconColor": icon_color, "iconLetter": icon_letter},
                files={"image": image},
            )
        )

    def delete_icon(self, project_id: str) -> ProjectsDeleteIconResponse:
        """Delete a project icon.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project

        Returns:
            (ProjectsDeleteIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsDeleteIconResponse.model_validate(
            self._client.request("DELETE", f"/api/projects/{project_id}/icon")
        )


class AsyncProjects:
    """Asynchronous Projects API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def list(
        self,
        *,
        limit: float | None = None,
        username: str | None = None,
        owner: str | None = None,
        region: str | None = None,
    ) -> ProjectsListResponse:
        """List your projects.

        Returns your projects with pagination. Public projects from other users are also accessible when filtering by username.

        Args:
            limit (float, optional): Number of results to return (default 20, max 500)
            username (str, optional): Show projects from this user instead of your own
            owner (str, optional): Team workspace to browse
            region (str, optional): Data region: us, eu, or ap

        Returns:
            (ProjectsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsListResponse.model_validate(
            await self._client.request(
                "GET", "/api/projects", params={"limit": limit, "username": username, "owner": owner, "region": region}
            )
        )

    async def create(
        self,
        *,
        slug: str,
        name: str,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        tags: list[str] | None = None,
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
        owner: str | None = None,
    ) -> ProjectsCreateResponse:
        """Create a new project.

        Projects organize your models. Each model belongs to exactly one project.

        Args:
            slug (str): slug request value.
            name (str): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            tags (list[str], optional): tags request value.
            license (Literal["None", "Apache-2.0", "MIT", "BSD-3-Clause", "AGPL-3.0", "GPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.1", "Unlicense", "CC0-1.0", "Ultralytics-Enterprise", "Other"], optional): Project/model license identifier
            owner (str, optional): Team owner username (creates resource in their workspace)

        Returns:
            (ProjectsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsCreateResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/projects",
                json={
                    "slug": slug,
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "tags": tags,
                    "license": license,
                    "owner": owner,
                },
            )
        )

    async def retrieve(self, project_id: str, *, username: str | None = None) -> ProjectsRetrieveResponse:
        """Get project details.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            username (str, optional): Owner username when using a project slug instead of an ID

        Returns:
            (ProjectsRetrieveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsRetrieveResponse.model_validate(
            await self._client.request("GET", f"/api/projects/{project_id}", params={"username": username})
        )

    async def update(
        self,
        project_id: str,
        *,
        name: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        visibility: Literal["public", "private"] | None = None,
        tags: list[str] | None = None,
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
        archived: bool | None = None,
        icon_color: str | None = None,
        icon_letter: str | Literal[""] | None = None,
        view_preferences: dict[str, Any] | None = None,
    ) -> ProjectsUpdateResponse:
        """Update a project.

        Update project properties like name, description, metadata, visibility, or tags.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            name (str, optional): name request value.
            description (str, optional): description request value.
            metadata (dict[str, Any], optional): Custom metadata object. Top-level keys are limited to 128 characters and the serialized object is limited to 500,000 characters.
            visibility (Literal["public", "private"], optional): Resource visibility
            tags (list[str], optional): tags request value.
            license (Literal["None", "Apache-2.0", "MIT", "BSD-3-Clause", "AGPL-3.0", "GPL-3.0", "LGPL-3.0", "MPL-2.0", "EUPL-1.1", "Unlicense", "CC0-1.0", "Ultralytics-Enterprise", "Other"], optional): Project/model license identifier
            archived (bool, optional): archived request value.
            icon_color (str, optional): iconColor request value.
            icon_letter (str | Literal[""] | None, optional): iconLetter request value.
            view_preferences (dict[str, Any], optional): Shared project-level model view defaults

        Returns:
            (ProjectsUpdateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsUpdateResponse.model_validate(
            await self._client.request(
                "PATCH",
                f"/api/projects/{project_id}",
                json={
                    "name": name,
                    "description": description,
                    "metadata": metadata,
                    "visibility": visibility,
                    "tags": tags,
                    "license": license,
                    "archived": archived,
                    "iconColor": icon_color,
                    "iconLetter": icon_letter,
                    "viewPreferences": view_preferences,
                },
            )
        )

    async def delete(self, project_id: str) -> ProjectsDeleteResponse:
        """Delete a project.

        Moves the project and all its models to trash. Can be restored within 30 days.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project

        Returns:
            (ProjectsDeleteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsDeleteResponse.model_validate(
            await self._client.request("DELETE", f"/api/projects/{project_id}")
        )

    async def retrieve_metadata(self, project_id: str) -> ProjectsRetrieveMetadataResponse:
        """Get project metadata.

        Returns custom metadata and Ultralytics-managed properties without adding them to normal payloads.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project

        Returns:
            (ProjectsRetrieveMetadataResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsRetrieveMetadataResponse.model_validate(
            await self._client.request("GET", f"/api/projects/{project_id}/metadata")
        )

    async def clone(
        self,
        project_id: str,
        *,
        name: str | None = None,
        slug: str | None = None,
        description: str | None = None,
        visibility: Literal["public", "private"] | None = None,
        license: str | None = None,
        owner: str | None = None,
    ) -> ProjectsCloneResponse:
        """Clone an accessible project.

        Copies a public, owned, or shared project and its models into your account or a workspace.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            name (str, optional): name request value.
            slug (str, optional): slug request value.
            description (str, optional): description request value.
            visibility (Literal["public", "private"], optional): Resource visibility
            license (str, optional): license request value.
            owner (str, optional): owner request value.

        Returns:
            (ProjectsCloneResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsCloneResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/projects/{project_id}/clone",
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

    async def create_icon(
        self, project_id: str, *, image: BinaryIO, icon_color: str | None = None, icon_letter: str | None = None
    ) -> ProjectsCreateIconResponse:
        """Upload a project icon.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project
            image (BinaryIO): WebP image, maximum 5 MB
            icon_color (str, optional): iconColor request value.
            icon_letter (str, optional): iconLetter request value.

        Returns:
            (ProjectsCreateIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsCreateIconResponse.model_validate(
            await self._client.request(
                "POST",
                f"/api/projects/{project_id}/icon",
                data={"iconColor": icon_color, "iconLetter": icon_letter},
                files={"image": image},
            )
        )

    async def delete_icon(self, project_id: str) -> ProjectsDeleteIconResponse:
        """Delete a project icon.

        Args:
            project_id (str): Project URL name or ID, e.g. `my-project` from platform.ultralytics.com/username/my-project

        Returns:
            (ProjectsDeleteIconResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ProjectsDeleteIconResponse.model_validate(
            await self._client.request("DELETE", f"/api/projects/{project_id}/icon")
        )
