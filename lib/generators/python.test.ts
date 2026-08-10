// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../../openapi.config.json";
import {
  getAuthentication,
  getOperations,
  type OpenApiDocument,
  requestMedia,
  resolveServerUrl,
  schemaExample,
} from "../openapi";
import { generatePython } from "./python";

describe("Python generator", () => {
  let output = "";
  let count = 0;
  let document: OpenApiDocument;

  beforeAll(async () => {
    output = await mkdtemp(join(tmpdir(), "openapi-generator-"));
    await Bun.write(join(output, "stale.py"), "");
    document = (await Bun.file("examples/openapi.json").json()) as OpenApiDocument;
    count = await generatePython(document, config, output);
  });

  afterAll(async () => {
    await rm(output, { force: true, recursive: true });
  });

  test("generates every operation from a clean output", async () => {
    expect(count).toBe(8);
    expect(await Bun.file(join(output, "stale.py")).exists()).toBe(false);
  });

  test("generates configured sync and async clients", async () => {
    const source = await Bun.file(join(output, "src/example_api/__init__.py")).text();
    const client = await Bun.file(join(output, "src/example_api/client.py")).text();
    expect(source).toContain("from .client import Example");
    expect(source).toContain("from .async_client import AsyncExample");
    expect(client).toContain('base_url: str = "https://api.example.com/v1"');
    expect(resolveServerUrl({ ...document, servers: [{ url: "/v2" }] })).toBe("http://localhost:3000/v2");
    const operation = getOperations(document)[0];
    expect(operation && getAuthentication(document, operation)).toEqual({ header: "Authorization", prefix: "Bearer " });
    const multiple = structuredClone(document);
    if (multiple.components?.securitySchemes && multiple.paths["/widgets"]?.get) {
      multiple.components.securitySchemes.apiKey = { in: "header", name: "X-API-Key", type: "apiKey" };
      multiple.paths["/widgets"].get.security = [{ apiKey: [] }];
    }
    const apiKeyOperation = getOperations(multiple).find((item) => item.method === "get" && item.path === "/widgets");
    expect(apiKeyOperation && getAuthentication(multiple, apiKeyOperation)).toEqual({
      header: "X-API-Key",
      prefix: "",
    });
    expect(() => getAuthentication(multiple)).toThrow("Multiple authentication schemes");
  });

  test("generates resource methods and Google-style docstrings", async () => {
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(widgets).toContain("def list(");
    expect(widgets).toContain("def retrieve(");
    expect(widgets).toContain("Args:\n");
    expect(widgets).toContain("widget_id (str):");
    expect(widgets).toContain("x_tenant_id: str");
    expect(widgets).toContain("widget_id_query: str");
    expect(widgets).toContain('headers={"X-Tenant-ID": x_tenant_id}');
    expect(widgets).toContain('cookies={"session_id": session_id}');
    expect(widgets).toContain("_path_parameter(widget_id");
    expect(widgets).toContain("Returns:\n");
    expect(widgets).toContain("Raises:\n");
  });

  test("generates authentication, safe retries, errors, and multipart uploads", async () => {
    const client = await Bun.file(join(output, "src/example_api/client.py")).text();
    const runtime = await Bun.file(join(output, "src/example_api/_client.py")).text();
    const uploads = await Bun.file(join(output, "src/example_api/resources/uploads.py")).text();
    expect(client).toContain('os.environ.get("EXAMPLE_API_KEY")');
    expect(runtime).not.toContain('headers={"Authorization": f"Bearer {api_key}"} if api_key else {}');
    expect(runtime).toContain('path.lstrip("/")');
    expect(runtime).toContain('retryable = method.upper() in {"GET", "HEAD", "OPTIONS"}');
    expect(runtime).toContain('headers = _without_none(kwargs.get("headers")) or {}');
    expect(runtime).toContain('cookies=_without_none(kwargs.get("cookies"))');
    expect(runtime).toContain('content=_without_not_given(kwargs.get("content"))');
    expect(runtime).toContain("class NotGiven:");
    expect(runtime).toContain("if not isinstance(value, NotGiven)");
    expect(runtime).toContain('json=_without_not_given(kwargs.get("json"))');
    expect(runtime).toContain("raise APIError(");
    expect(runtime).toContain('media_type.endswith("+json")');
    expect(uploads).toContain('auth=("Authorization", "Bearer ")');
    expect(uploads).toContain('files={"file": file}');
  });

  test("generates response models with JSON aliases", async () => {
    const types = await Bun.file(join(output, "src/example_api/types.py")).text();
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(types).toContain("class APIModel(BaseModel):");
    expect(types).toContain('widget_id: str = Field(alias="widgetId")');
    expect(types).toContain('display_name: str | None = Field(alias="displayName")');
    expect(widgets).toContain("description: str | None");
    expect(widgets).toContain("label: str | NotGiven = NOT_GIVEN");
    expect(widgets).toContain("WidgetsCreateResponse.model_validate(");
  });

  test("merges composed request schemas without narrowing union fields", async () => {
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(widgets).toContain('provider: Literal["cloud", "local"]');
    expect(widgets).toContain("settings: dict[str, Any]");
    expect(widgets).toContain("name: str");
    expect(widgets).toContain("region: str");
    expect(widgets).toContain("description: str | None");
    const createWidget = getOperations(document).find((operation) => operation.operationId === "create_widget");
    expect(createWidget && schemaExample(document, requestMedia(createWidget)?.[1].schema)).toMatchObject({
      provider: "cloud",
    });
  });

  test("passes non-object JSON request bodies through unchanged", async () => {
    const events = await Bun.file(join(output, "src/example_api/resources/events.py")).text();
    const types = await Bun.file(join(output, "src/example_api/types.py")).text();
    expect(events).toContain("body: list[str]");
    expect(events).toContain("json=body");
    expect(types).toContain("warnings: list[str] | None");
  });

  test("serializes form request bodies", async () => {
    const sessions = await Bun.file(join(output, "src/example_api/resources/sessions.py")).text();
    expect(sessions).toContain('headers={"Content-Type": "application/x-www-form-urlencoded"}');
    expect(sessions).toContain('data={"name": name}');
  });

  test("serializes raw request bodies", async () => {
    const echo = await Bun.file(join(output, "src/example_api/resources/echo.py")).text();
    expect(echo).toContain('headers={"Content-Type": "text/plain"}');
    expect(echo).toContain("content=body");
    expect(echo).toContain('"https://echo.example.com/v2/echo"');
    expect(echo).not.toContain("auth=(");
  });

  test("generates typed collection responses", async () => {
    const reports = await Bun.file(join(output, "src/example_api/resources/reports.py")).text();
    const types = await Bun.file(join(output, "src/example_api/types.py")).text();
    expect(reports).toContain("TypeAdapter(ReportsListResponse).validate_python(");
    expect(types).toContain("ReportsListResponse = list[ReportsListResponseItem]");
    expect(types).toContain("class ReportsListResponseItem(APIModel):");
    expect(types).toContain("artifact: bytes");
    expect(types).toContain('user_id: str = Field(alias="user-id")');
    expect(types).toContain('user_id_field: str = Field(alias="user_id")');
    expect(types).not.toContain("password:");
  });
});
