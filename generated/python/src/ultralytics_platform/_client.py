from __future__ import annotations

import time
from typing import Any

import httpx

from ._exceptions import APIConnectionError, APIError


def _without_none(values: dict[str, Any] | None) -> dict[str, Any] | None:
    return {key: value for key, value in values.items() if value is not None} if values else None


def _retry_delay(response: httpx.Response | None, attempt: int) -> float:
    if response is not None:
        try:
            return min(max(float(response.headers.get("retry-after", "")), 0), 60)
        except ValueError:
            pass
    return min(0.5 * (2**attempt), 8)


class SyncAPIClient:
    def __init__(self, *, api_key: str, base_url: str, timeout: float, max_retries: int) -> None:
        self._client = httpx.Client(
            base_url=base_url.rstrip("/"), headers={"Authorization": f"Bearer {api_key}"}, timeout=timeout
        )
        self._max_retries = max_retries

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        for attempt in range(self._max_retries + 1):
            try:
                response = self._client.request(
                    method,
                    path,
                    params=_without_none(kwargs.get("params")),
                    json=_without_none(kwargs.get("json")),
                    data=_without_none(kwargs.get("data")),
                    files=_without_none(kwargs.get("files")),
                )
            except httpx.HTTPError as error:
                if attempt == self._max_retries:
                    raise APIConnectionError(str(error)) from error
                time.sleep(_retry_delay(None, attempt))
                continue
            if response.status_code not in {408, 409, 429} and response.status_code < 500:
                break
            if attempt == self._max_retries:
                break
            time.sleep(_retry_delay(response, attempt))
        if response.is_error:
            raise APIError(response.status_code, response.text, response.headers.get("x-request-id"))
        if response.status_code == 204 or not response.content:
            return None
        if "application/json" in response.headers.get("content-type", ""):
            return response.json()
        return response.content

    def close(self) -> None:
        self._client.close()


class AsyncAPIClient:
    def __init__(self, *, api_key: str, base_url: str, timeout: float, max_retries: int) -> None:
        self._client = httpx.AsyncClient(
            base_url=base_url.rstrip("/"), headers={"Authorization": f"Bearer {api_key}"}, timeout=timeout
        )
        self._max_retries = max_retries

    async def request(self, method: str, path: str, **kwargs: Any) -> Any:
        for attempt in range(self._max_retries + 1):
            try:
                response = await self._client.request(
                    method,
                    path,
                    params=_without_none(kwargs.get("params")),
                    json=_without_none(kwargs.get("json")),
                    data=_without_none(kwargs.get("data")),
                    files=_without_none(kwargs.get("files")),
                )
            except httpx.HTTPError as error:
                if attempt == self._max_retries:
                    raise APIConnectionError(str(error)) from error
                await __import__("asyncio").sleep(_retry_delay(None, attempt))
                continue
            if response.status_code not in {408, 409, 429} and response.status_code < 500:
                break
            if attempt == self._max_retries:
                break
            await __import__("asyncio").sleep(_retry_delay(response, attempt))
        if response.is_error:
            raise APIError(response.status_code, response.text, response.headers.get("x-request-id"))
        if response.status_code == 204 or not response.content:
            return None
        if "application/json" in response.headers.get("content-type", ""):
            return response.json()
        return response.content

    async def close(self) -> None:
        await self._client.aclose()
