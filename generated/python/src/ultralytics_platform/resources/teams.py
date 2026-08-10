from __future__ import annotations

from typing import Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    TeamsChangeMemberRoleResponse,
    TeamsCreateResponse,
    TeamsInviteResponse,
    TeamsListMembersResponse,
    TeamsListResponse,
    TeamsRemoveMemberOrLeaveResponse,
    TeamsTransferOwnershipResponse,
)


class Teams:
    """Teams API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def list(self) -> TeamsListResponse:
        """List your teams.

        Returns all teams you are a member of, along with your role in each.

        Returns:
            (TeamsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsListResponse.model_validate(self._client.request("GET", "/api/teams"))

    def create(self, *, username: str, full_name: str) -> TeamsCreateResponse:
        """Create a new team.

        Creates a team workspace for collaboration. Limited to 5 teams per user. Teams start on the free plan.

        Args:
            username (str): Team username (globally unique across users and teams)
            full_name (str): Display name for the team

        Returns:
            (TeamsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsCreateResponse.model_validate(
            self._client.request("POST", "/api/teams/create", json={"username": username, "fullName": full_name})
        )

    def list_members(self, *, owner: str | None = None) -> TeamsListMembersResponse:
        """List team members.

        Returns active and pending members for a team workspace.

        Args:
            owner (str, optional): Team username

        Returns:
            (TeamsListMembersResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsListMembersResponse.model_validate(
            self._client.request("GET", "/api/members", params={"owner": owner})
        )

    def invite(
        self, *, email: str, role: Literal["admin", "editor", "viewer"], owner: str | None = None
    ) -> TeamsInviteResponse:
        """Invite someone to your team.

        Sends an email invitation to join your team workspace.

        Args:
            owner (str, optional): Team username
            email (str): email request value.
            role (Literal["admin", "editor", "viewer"]): Role to assign (owner cannot be invited)

        Returns:
            (TeamsInviteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsInviteResponse.model_validate(
            self._client.request("POST", "/api/members", params={"owner": owner}, json={"email": email, "role": role})
        )

    def change_member_role(
        self, user_id: str, *, role: Literal["admin", "editor", "viewer"], owner: str | None = None
    ) -> TeamsChangeMemberRoleResponse:
        """Change a member's role.

        Update a team member's role (viewer, editor, admin).

        Args:
            user_id (str): userId path parameter.
            owner (str, optional): Team username
            role (Literal["admin", "editor", "viewer"]): New role to assign

        Returns:
            (TeamsChangeMemberRoleResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsChangeMemberRoleResponse.model_validate(
            self._client.request("PATCH", f"/api/members/{user_id}", params={"owner": owner}, json={"role": role})
        )

    def remove_member_or_leave(self, user_id: str, *, owner: str | None = None) -> TeamsRemoveMemberOrLeaveResponse:
        """Remove a member or leave a team.

        Removes a member from a team, or leaves the team when userId is your own user ID.

        Args:
            user_id (str): userId path parameter.
            owner (str, optional): Team username

        Returns:
            (TeamsRemoveMemberOrLeaveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsRemoveMemberOrLeaveResponse.model_validate(
            self._client.request("DELETE", f"/api/members/{user_id}", params={"owner": owner})
        )

    def transfer_ownership(self, *, target_user_id: str, owner: str | None = None) -> TeamsTransferOwnershipResponse:
        """Transfer team ownership.

        Transfer ownership of a team workspace to another admin member.

        Args:
            owner (str, optional): Team username
            target_user_id (str): Clerk userId of the member to promote to owner

        Returns:
            (TeamsTransferOwnershipResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsTransferOwnershipResponse.model_validate(
            self._client.request(
                "POST",
                "/api/members/transfer-ownership",
                params={"owner": owner},
                json={"targetUserId": target_user_id},
            )
        )


class AsyncTeams:
    """Asynchronous Teams API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def list(self) -> TeamsListResponse:
        """List your teams.

        Returns all teams you are a member of, along with your role in each.

        Returns:
            (TeamsListResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsListResponse.model_validate(await self._client.request("GET", "/api/teams"))

    async def create(self, *, username: str, full_name: str) -> TeamsCreateResponse:
        """Create a new team.

        Creates a team workspace for collaboration. Limited to 5 teams per user. Teams start on the free plan.

        Args:
            username (str): Team username (globally unique across users and teams)
            full_name (str): Display name for the team

        Returns:
            (TeamsCreateResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsCreateResponse.model_validate(
            await self._client.request("POST", "/api/teams/create", json={"username": username, "fullName": full_name})
        )

    async def list_members(self, *, owner: str | None = None) -> TeamsListMembersResponse:
        """List team members.

        Returns active and pending members for a team workspace.

        Args:
            owner (str, optional): Team username

        Returns:
            (TeamsListMembersResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsListMembersResponse.model_validate(
            await self._client.request("GET", "/api/members", params={"owner": owner})
        )

    async def invite(
        self, *, email: str, role: Literal["admin", "editor", "viewer"], owner: str | None = None
    ) -> TeamsInviteResponse:
        """Invite someone to your team.

        Sends an email invitation to join your team workspace.

        Args:
            owner (str, optional): Team username
            email (str): email request value.
            role (Literal["admin", "editor", "viewer"]): Role to assign (owner cannot be invited)

        Returns:
            (TeamsInviteResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsInviteResponse.model_validate(
            await self._client.request(
                "POST", "/api/members", params={"owner": owner}, json={"email": email, "role": role}
            )
        )

    async def change_member_role(
        self, user_id: str, *, role: Literal["admin", "editor", "viewer"], owner: str | None = None
    ) -> TeamsChangeMemberRoleResponse:
        """Change a member's role.

        Update a team member's role (viewer, editor, admin).

        Args:
            user_id (str): userId path parameter.
            owner (str, optional): Team username
            role (Literal["admin", "editor", "viewer"]): New role to assign

        Returns:
            (TeamsChangeMemberRoleResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsChangeMemberRoleResponse.model_validate(
            await self._client.request("PATCH", f"/api/members/{user_id}", params={"owner": owner}, json={"role": role})
        )

    async def remove_member_or_leave(
        self, user_id: str, *, owner: str | None = None
    ) -> TeamsRemoveMemberOrLeaveResponse:
        """Remove a member or leave a team.

        Removes a member from a team, or leaves the team when userId is your own user ID.

        Args:
            user_id (str): userId path parameter.
            owner (str, optional): Team username

        Returns:
            (TeamsRemoveMemberOrLeaveResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsRemoveMemberOrLeaveResponse.model_validate(
            await self._client.request("DELETE", f"/api/members/{user_id}", params={"owner": owner})
        )

    async def transfer_ownership(
        self, *, target_user_id: str, owner: str | None = None
    ) -> TeamsTransferOwnershipResponse:
        """Transfer team ownership.

        Transfer ownership of a team workspace to another admin member.

        Args:
            owner (str, optional): Team username
            target_user_id (str): Clerk userId of the member to promote to owner

        Returns:
            (TeamsTransferOwnershipResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return TeamsTransferOwnershipResponse.model_validate(
            await self._client.request(
                "POST",
                "/api/members/transfer-ownership",
                params={"owner": owner},
                json={"targetUserId": target_user_id},
            )
        )
