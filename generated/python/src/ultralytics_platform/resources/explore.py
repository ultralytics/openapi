from __future__ import annotations

from typing import Literal

from .._client import AsyncAPIClient, SyncAPIClient
from ..types import (
    ExploreRetrieveSearchResponse,
    ExploreRetrieveSidebarResponse,
)


class Explore:
    """Explore API operations."""

    def __init__(self, client: SyncAPIClient) -> None:
        self._client = client

    def retrieve_search(
        self,
        *,
        q: str | None = None,
        type: Literal["all", "projects", "datasets"] | None = None,
        sort: Literal["stars", "newest", "oldest", "name-asc", "name-desc", "count-desc", "count-asc"] | None = None,
        offset: float | None = None,
        task: str | None = None,
        author: str | None = None,
        starred: bool | None = None,
    ) -> ExploreRetrieveSearchResponse:
        """Search public projects and datasets.

        Browse public content. Authentication is optional and used only for the caller's starred filter.

        Args:
            q (str, optional): Search term
            type (Literal["all", "projects", "datasets"], optional): Resource type filter
            sort (Literal["stars", "newest", "oldest", "name-asc", "name-desc", "count-desc", "count-asc"], optional): Sort order
            offset (float, optional): Skip this many results for pagination
            task (str, optional): Comma-separated YOLO task filters
            author (str, optional): Owner username filter
            starred (bool, optional): Return content starred by the authenticated caller

        Returns:
            (ExploreRetrieveSearchResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ExploreRetrieveSearchResponse.model_validate(
            self._client.request(
                "GET",
                "/api/explore/search",
                params={
                    "q": q,
                    "type": type,
                    "sort": sort,
                    "offset": offset,
                    "task": task,
                    "author": author,
                    "starred": starred,
                },
            )
        )

    def retrieve_sidebar(self) -> ExploreRetrieveSidebarResponse:
        """Get curated public resources.

        Returns:
            (ExploreRetrieveSidebarResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ExploreRetrieveSidebarResponse.model_validate(self._client.request("GET", "/api/explore/sidebar"))


class AsyncExplore:
    """Asynchronous Explore API operations."""

    def __init__(self, client: AsyncAPIClient) -> None:
        self._client = client

    async def retrieve_search(
        self,
        *,
        q: str | None = None,
        type: Literal["all", "projects", "datasets"] | None = None,
        sort: Literal["stars", "newest", "oldest", "name-asc", "name-desc", "count-desc", "count-asc"] | None = None,
        offset: float | None = None,
        task: str | None = None,
        author: str | None = None,
        starred: bool | None = None,
    ) -> ExploreRetrieveSearchResponse:
        """Search public projects and datasets.

        Browse public content. Authentication is optional and used only for the caller's starred filter.

        Args:
            q (str, optional): Search term
            type (Literal["all", "projects", "datasets"], optional): Resource type filter
            sort (Literal["stars", "newest", "oldest", "name-asc", "name-desc", "count-desc", "count-asc"], optional): Sort order
            offset (float, optional): Skip this many results for pagination
            task (str, optional): Comma-separated YOLO task filters
            author (str, optional): Owner username filter
            starred (bool, optional): Return content starred by the authenticated caller

        Returns:
            (ExploreRetrieveSearchResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ExploreRetrieveSearchResponse.model_validate(
            await self._client.request(
                "GET",
                "/api/explore/search",
                params={
                    "q": q,
                    "type": type,
                    "sort": sort,
                    "offset": offset,
                    "task": task,
                    "author": author,
                    "starred": starred,
                },
            )
        )

    async def retrieve_sidebar(self) -> ExploreRetrieveSidebarResponse:
        """Get curated public resources.

        Returns:
            (ExploreRetrieveSidebarResponse): The API response.

        Raises:
            (APIError): If the API returns an unsuccessful response.
        """
        return ExploreRetrieveSidebarResponse.model_validate(await self._client.request("GET", "/api/explore/sidebar"))
