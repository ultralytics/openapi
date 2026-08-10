import type { ApiOperation, JsonSchema, OpenApiDocument, Parameter } from "../openapi";
import {
  getOperations,
  objectSchema,
  requestMedia,
  resolveSchema,
  sdkIdentifier as snake,
  successMedia,
} from "../openapi";

interface PythonConfig {
  apiKey: { environment: string };
  name: string;
  python: { client: string; package: string; project: string; version: string };
}

interface Argument {
  description: string;
  location: "body" | "path" | "query";
  name: string;
  pythonName: string;
  required: boolean;
  schema: JsonSchema;
}

interface PythonOperation extends ApiOperation {
  arguments: Argument[];
  contentType?: string;
  name: string;
  responseName?: string;
  responseSchema?: JsonSchema;
}

function pascal(value: string): string {
  return snake(value)
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

function quote(value: unknown): string {
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  return JSON.stringify(value);
}

function pythonType(document: OpenApiDocument, input: JsonSchema | undefined, nested = false): string {
  const schema = resolveSchema(document, input);
  if (!schema) return "Any";
  if (schema.const === null) return "None";
  if (schema.const !== undefined) return `Literal[${quote(schema.const)}]`;
  if (schema.enum?.length) return `Literal[${schema.enum.map(quote).join(", ")}]`;
  const variants = schema.oneOf ?? schema.anyOf;
  if (variants?.length && !variants.every((item) => objectSchema(document, item)?.properties)) {
    if (variants.every((item) => item.const !== undefined)) {
      const values = variants.map((item) => item.const);
      const nonNull = values.filter((value) => value !== null);
      return `${nonNull.length ? `Literal[${nonNull.map(quote).join(", ")}]` : ""}${values.includes(null) ? `${nonNull.length ? " | " : ""}None` : ""}`;
    }
    const types = [...new Set(variants.flatMap((item) => pythonType(document, item, true).split(" | ")))];
    return [...types.filter((type) => type !== "None"), ...types.filter((type) => type === "None")].join(" | ");
  }
  const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
  if (type === "null") return "None";
  if (schema.format === "binary") return "BinaryIO";
  if (type === "string") return "str";
  if (type === "integer") return "int";
  if (type === "number") return "float";
  if (type === "boolean") return "bool";
  if (type === "array") return `list[${pythonType(document, schema.items, true)}]`;
  if (type === "object" || schema.properties) return nested ? "dict[str, Any]" : "dict[str, Any]";
  return "Any";
}

function argumentsFor(document: OpenApiDocument, operation: ApiOperation): Argument[] {
  const parameters: Argument[] = (operation.parameters ?? []).map((parameter: Parameter) => ({
    description: parameter.description ?? `${parameter.name} ${parameter.in} parameter.`,
    location: parameter.in as "path" | "query",
    name: parameter.name,
    pythonName: snake(parameter.name),
    required: parameter.in === "path" || parameter.required === true,
    schema: parameter.schema ?? {},
  }));
  const media = requestMedia(operation);
  const body = objectSchema(document, media?.[1].schema);
  for (const [name, schema] of Object.entries(body?.properties ?? {})) {
    parameters.push({
      description: schema.description ?? `${name} request value.`,
      location: "body",
      name,
      pythonName: snake(name),
      required: body?.required?.includes(name) ?? false,
      schema,
    });
  }
  return parameters;
}

function prepare(document: OpenApiDocument): Map<string, PythonOperation[]> {
  const resources = new Map<string, PythonOperation[]>();
  for (const operation of getOperations(document)) {
    const media = successMedia(operation);
    const responseSchema = media?.[1].schema;
    const responseObject = objectSchema(document, responseSchema);
    const resource = operation.resource;
    const values = resources.get(resource) ?? [];
    const name = operation.sdkMethod;
    values.push({
      ...operation,
      arguments: argumentsFor(document, operation),
      contentType: requestMedia(operation)?.[0],
      name,
      responseName: responseObject?.properties ? `${pascal(operation.tag)}${pascal(name)}Response` : undefined,
      responseSchema,
    });
    resources.set(resource, values);
  }
  return resources;
}

function docstring(document: OpenApiDocument, operation: PythonOperation, returnType: string): string {
  const lines = [`        """${operation.summary ?? operation.name}.`];
  if (operation.description) lines.push("", ...operation.description.split("\n").map((line) => `        ${line}`));
  if (operation.arguments.length) {
    lines.push("", "        Args:");
    for (const argument of operation.arguments) {
      lines.push(
        `            ${argument.pythonName} (${pythonType(document, argument.schema)}${argument.required ? "" : ", optional"}): ${argument.description}`,
      );
    }
  }
  lines.push("", "        Returns:", `            (${returnType}): The API response.`);
  lines.push(
    "",
    "        Raises:",
    "            (APIError): If the API returns an unsuccessful response.",
    '        """',
  );
  return lines.join("\n");
}

function methodSource(document: OpenApiDocument, operation: PythonOperation, async: boolean): string {
  const required = operation.arguments.filter((argument) => argument.required);
  const optional = operation.arguments.filter((argument) => !argument.required);
  const pathArguments = required.filter((argument) => argument.location === "path");
  const keywordArguments = [...required.filter((argument) => argument.location !== "path"), ...optional];
  const signature = [
    "self",
    ...pathArguments.map((argument) => `${argument.pythonName}: ${pythonType(document, argument.schema)}`),
    ...(keywordArguments.length ? ["*"] : []),
    ...keywordArguments.map((argument) => {
      const type = pythonType(document, argument.schema);
      const defaultValue = argument.required ? "" : " = None";
      return `${argument.pythonName}: ${argument.required || type.split(" | ").includes("None") ? type : `${type} | None`}${defaultValue}`;
    }),
  ].join(", ");
  const returnType = operation.responseName ?? pythonType(document, operation.responseSchema);
  const path = operation.path.replace(/{([^}]+)}/g, (_, name: string) => `{${snake(name)}}`);
  const query = operation.arguments.filter((argument) => argument.location === "query");
  const body = operation.arguments.filter((argument) => argument.location === "body");
  const binary = body.filter((argument) => argument.schema.format === "binary");
  const data = body.filter((argument) => argument.schema.format !== "binary");
  const options = [
    query.length ? `params={${query.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}` : "",
    operation.contentType === "multipart/form-data" && data.length
      ? `data={${data.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}`
      : "",
    binary.length ? `files={${binary.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}` : "",
    operation.contentType === "application/json" && body.length
      ? `json={${body.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}`
      : "",
  ].filter(Boolean);
  const pathValue = path.includes("{") ? `f${quote(path)}` : quote(path);
  const call = `${async ? "await " : ""}self._client.request(${quote(operation.method.toUpperCase())}, ${pathValue}${options.length ? `, ${options.join(", ")}` : ""})`;
  const result = operation.responseName
    ? `${operation.responseName}.model_validate(${call})`
    : `cast(${returnType}, ${call})`;
  return [
    `    ${async ? "async " : ""}def ${operation.name}(${signature}) -> ${returnType}:`,
    docstring(document, operation, returnType),
    `        return ${result}`,
  ].join("\n");
}

function resourceSource(document: OpenApiDocument, resource: string, operations: PythonOperation[]): string {
  const responseTypes = [...new Set(operations.map((operation) => operation.responseName).filter(Boolean))].sort();
  const imports = responseTypes.length
    ? `from ..types import (\n${responseTypes.map((name) => `    ${name},`).join("\n")}\n)\n`
    : "";
  const className = pascal(resource);
  const methods = operations.map((operation) => methodSource(document, operation, false)).join("\n\n");
  const asyncMethods = operations.map((operation) => methodSource(document, operation, true)).join("\n\n");
  const body = `${methods}\n${asyncMethods}`;
  const typingImports = ["Any", "BinaryIO", "Literal"].filter((name) => new RegExp(`\\b${name}\\b`).test(body));
  if (body.includes("cast(")) typingImports.push("cast");
  const typingSource = typingImports.length ? `from typing import ${typingImports.sort().join(", ")}\n\n` : "";
  return `from __future__ import annotations\n\n${typingSource}from .._client import AsyncAPIClient, SyncAPIClient\n${imports}\n\nclass ${className}:\n    """${operations[0]?.tag ?? className} API operations."""\n\n    def __init__(self, client: SyncAPIClient) -> None:\n        self._client = client\n\n${methods}\n\n\nclass Async${className}:\n    """Asynchronous ${operations[0]?.tag ?? className} API operations."""\n\n    def __init__(self, client: AsyncAPIClient) -> None:\n        self._client = client\n\n${asyncMethods}\n`;
}

function modelSource(document: OpenApiDocument, resources: Map<string, PythonOperation[]>): string {
  const classes: string[] = [];
  const generated = new Set<string>();

  function modelType(input: JsonSchema | undefined, name: string): string {
    const schema = resolveSchema(document, input);
    if (!schema) return "Any";
    if (schema.format === "date-time") return "datetime";
    const object = objectSchema(document, schema);
    if (object?.properties) {
      addModel(object, name);
      return name;
    }
    const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
    if (type === "array") return `list[${modelType(schema.items, `${name}Item`)}]`;
    if (type === "object" && typeof schema.additionalProperties === "object") {
      return `dict[str, ${modelType(schema.additionalProperties, `${name}Value`)}]`;
    }
    return pythonType(document, schema, true);
  }

  function addModel(schema: JsonSchema, name: string) {
    if (generated.has(name)) return;
    generated.add(name);
    const required = new Set(schema.required ?? []);
    const fields = Object.entries(schema.properties ?? {}).map(([wireName, value]) => {
      const fieldName = snake(wireName);
      const type = modelType(value, `${name}${pascal(fieldName)}`);
      const optionalType = required.has(wireName) || type.split(" | ").includes("None") ? type : `${type} | None`;
      const alias = fieldName === wireName ? "" : `alias=${quote(wireName)}, `;
      const defaultValue = required.has(wireName)
        ? alias
          ? ` = Field(${alias.slice(0, -2)})`
          : ""
        : ` = Field(${alias}default=None)`;
      const description = value.description ? `\n    """${value.description.replaceAll('"""', '\\"\\"\\"')}"""` : "";
      return `    ${fieldName}: ${optionalType}${defaultValue}${description}`;
    });
    classes.push(`class ${name}(APIModel):\n${fields.length ? fields.join("\n\n") : "    pass"}`);
  }

  for (const operations of resources.values()) {
    for (const operation of operations) {
      if (!operation.responseName) continue;
      const schema = objectSchema(document, operation.responseSchema);
      if (schema?.properties) addModel(schema, operation.responseName);
    }
  }
  return `from __future__ import annotations\n\nfrom datetime import datetime\nfrom typing import Any, Literal\n\nfrom pydantic import BaseModel, ConfigDict, Field\n\n\nclass APIModel(BaseModel):\n    """Base model for API responses."""\n\n    model_config = ConfigDict(populate_by_name=True, protected_namespaces=())\n\n\n${classes.join("\n\n\n")}\n`;
}

const CLIENT_SOURCE = `from __future__ import annotations

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
`;

const EXCEPTIONS_SOURCE = `from __future__ import annotations


class APIError(Exception):
    """Error returned by the Platform API."""

    def __init__(self, status_code: int, body: str, request_id: str | None = None) -> None:
        self.status_code = status_code
        self.body = body
        self.request_id = request_id
        super().__init__(f"API request failed with status {status_code}: {body}")


class APIConnectionError(Exception):
    """Network error raised while contacting the Platform API."""
`;

const GENERATED_LICENSE = `MIT License

Copyright (c) 2026 Ultralytics

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without restriction, including without limitation
the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of
the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`;

function publicClientSource(config: PythonConfig, resources: Map<string, PythonOperation[]>, async: boolean): string {
  const className = `${async ? "Async" : ""}${config.python.client}`;
  const apiClient = `${async ? "Async" : "Sync"}APIClient`;
  const imports = [...resources.keys()].map((resource) => `${async ? "Async" : ""}${pascal(resource)}`).sort();
  const properties = [...resources.keys()]
    .map((resource) => `        self.${resource} = ${async ? "Async" : ""}${pascal(resource)}(self._client)`)
    .join("\n");
  return `from __future__ import annotations\n\nimport os\n\nfrom ._client import ${apiClient}\nfrom .resources import (\n${imports.map((name) => `    ${name},`).join("\n")}\n)\n\n\nclass ${className}:\n    """Client for the ${config.name} API."""\n\n    def __init__(\n        self,\n        *,\n        api_key: str | None = None,\n        base_url: str = "https://platform.ultralytics.com",\n        timeout: float = 60.0,\n        max_retries: int = 2,\n    ) -> None:\n        """Initialize the client.\n\n        Args:\n            api_key (str, optional): API key. Defaults to ${config.apiKey.environment}.\n            base_url (str): API base URL.\n            timeout (float): Request timeout in seconds.\n            max_retries (int): Retries for connection errors and retryable responses.\n\n        Raises:\n            (ValueError): If no API key is provided.\n        """\n        resolved_api_key = api_key or os.environ.get("${config.apiKey.environment}")\n        if not resolved_api_key:\n            raise ValueError("Set ${config.apiKey.environment} or pass api_key")\n        self._client = ${apiClient}(\n            api_key=resolved_api_key, base_url=base_url, timeout=timeout, max_retries=max_retries\n        )\n${properties}\n\n    ${async ? "async " : ""}def close(self) -> None:\n        """Close the underlying HTTP client."""\n        ${async ? "await " : ""}self._client.close()\n`;
}

export async function generatePython(document: OpenApiDocument, config: PythonConfig, output: string): Promise<number> {
  const resources = prepare(document);
  const root = `${output}/src/${config.python.package}`;
  await Promise.all([
    Bun.write(
      `${output}/pyproject.toml`,
      `[build-system]\nrequires = ["hatchling"]\nbuild-backend = "hatchling.build"\n\n[project]\nname = "${config.python.project}"\nversion = "${config.python.version}"\ndescription = "Python client for ${config.name}"\nreadme = "README.md"\nlicense = "MIT"\nrequires-python = ">=3.10"\ndependencies = ["httpx>=0.27,<1", "pydantic>=2,<3"]\n\n[tool.hatch.build.targets.wheel]\npackages = ["src/${config.python.package}"]\n`,
    ),
    Bun.write(
      `${output}/README.md`,
      `# ${config.name} Python SDK\n\nGenerated from the ${config.name} OpenAPI contract.\n\n\`\`\`bash\npip install ${config.python.project}\n\`\`\`\n\n\`\`\`python\nfrom ${config.python.package} import ${config.python.client}\n\nclient = ${config.python.client}()  # ${config.apiKey.environment}\ndatasets = client.datasets.list()\n\`\`\`\n`,
    ),
    Bun.write(`${output}/LICENSE`, GENERATED_LICENSE),
    Bun.write(`${root}/_client.py`, CLIENT_SOURCE),
    Bun.write(`${root}/_exceptions.py`, EXCEPTIONS_SOURCE),
    Bun.write(`${root}/client.py`, publicClientSource(config, resources, false)),
    Bun.write(`${root}/async_client.py`, publicClientSource(config, resources, true)),
    Bun.write(`${root}/types.py`, modelSource(document, resources)),
    Bun.write(`${root}/py.typed`, ""),
  ]);

  const resourceExports: string[] = [];
  for (const [resource, operations] of resources) {
    await Bun.write(`${root}/resources/${resource}.py`, resourceSource(document, resource, operations));
    resourceExports.push(
      `from .${resource} import ${pascal(resource)} as ${pascal(resource)}`,
      `from .${resource} import Async${pascal(resource)} as Async${pascal(resource)}`,
    );
  }
  await Bun.write(`${root}/resources/__init__.py`, `${resourceExports.sort().join("\n")}\n`);
  await Bun.write(
    `${root}/__init__.py`,
    `from ._exceptions import APIConnectionError, APIError\nfrom .async_client import Async${config.python.client}\nfrom .client import ${config.python.client}\n\n__all__ = ["APIConnectionError", "APIError", "Async${config.python.client}", "${config.python.client}"]\n`,
  );
  return [...resources.values()].reduce((count, operations) => count + operations.length, 0);
}
