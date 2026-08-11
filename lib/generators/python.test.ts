// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../../openapi.config.json";
import {
  addPythonCodeSamples,
  buildApiRequest,
  curlCodeSample,
  getAuthentication,
  getOperations,
  type OpenApiDocument,
  requestBodyExample,
  requestMedia,
  resolveServerUrl,
  schemaConstraints,
  schemaExample,
  schemaFields,
  schemaLabel,
  serializeSimplePath,
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
    const project = await Bun.file(join(output, "pyproject.toml")).text();
    const readme = await Bun.file(join(output, "README.md")).text();
    expect(source).toContain("from .client import Example");
    expect(source).toContain("from .async_client import AsyncExample");
    expect(client).toContain('base_url: str = "https://api.example.com/v1"');
    expect(project).toContain('license = "AGPL-3.0-only"');
    expect(project).toContain('dependencies = ["httpx>=0.28,<1"]');
    expect(project).toContain('Repository = "https://github.com/ultralytics/openapi"');
    expect(readme).toContain("https://spdx.org/licenses/AGPL-3.0-only.html");
    expect(await Bun.file(join(output, "LICENSE")).text()).toBe(await Bun.file("LICENSE").text());
    expect(resolveServerUrl({ ...document, servers: [{ url: "/v2" }] })).toBe("http://localhost:3000/v2");
    expect(serializeSimplePath({ role: "admin/user" }, true)).toBe("role=admin%2Fuser");
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

  test("adds Python SDK samples from the generated resource tree", () => {
    const source = structuredClone(document);
    const createWidget = getOperations(source).find(
      (operation) => operation.path === "/widgets" && operation.method === "post",
    );
    const media = createWidget && requestMedia(createWidget);
    if (media) media[1].example = { description: null };
    const echo = getOperations(source).find((operation) => operation.path === "/echo");
    const echoMedia = echo && requestMedia(echo);
    if (echoMedia) {
      echoMedia[1].example = null;
      if (echoMedia[1].schema) echoMedia[1].schema.type = ["string", "null"];
    }
    const decorated = addPythonCodeSamples(source, {
      client: config.python.client,
      environment: config.apiKey.environment,
      package: config.python.package,
    });
    const sample = decorated.paths["/widgets/{widgetId}"]?.get?.["x-codeSamples"]?.[0];
    expect(sample?.label).toBe("Python SDK");
    expect(sample?.source).toContain("response = client.widgets.retrieve(");
    expect(sample?.source).toContain('widget_id="widget_123"');
    const createSample = decorated.paths["/widgets"]?.post?.["x-codeSamples"]?.[0];
    expect(createSample?.source).toContain("description=None");
    const echoSample = decorated.paths["/echo"]?.post?.["x-codeSamples"]?.[0];
    expect(echoSample?.source).toContain("body=None");
  });

  test("builds safe live requests and valid multipart cURL", () => {
    const relative = getOperations(document).find((operation) => operation.server?.url === "/v2");
    const upload = getOperations(document).find((operation) => requestMedia(operation)?.[0] === "multipart/form-data");
    expect(relative).toBeDefined();
    expect(upload).toBeDefined();
    if (!relative || !upload) return;
    expect(
      buildApiRequest(document, relative, {
        origin: "https://preview.example.com",
        serverOrigin: "https://preview.example.com",
      }).url,
    ).toStartWith("https://preview.example.com/v2/");
    const curl = curlCodeSample(document, upload, {
      body: requestBodyExample(document, upload),
      origin: "https://docs.example.com",
    });
    expect(curl).toContain("--form 'file=@path/to/file'");
    expect(curl).not.toContain("Content-Type: multipart/form-data");
    expect(curl).not.toContain("--data '");
    const raw = getOperations(document).find((operation) => requestMedia(operation)?.[0] === "text/plain");
    expect(raw).toBeDefined();
    if (!raw) return;
    expect(
      curlCodeSample(document, raw, {
        body: requestBodyExample(document, raw),
        origin: "https://docs.example.com",
      }),
    ).toContain("--data ''");
    const multipartDocument = structuredClone(document);
    const multipartUpload = getOperations(multipartDocument).find(
      (operation) => requestMedia(operation)?.[0] === "multipart/form-data",
    );
    const media = multipartUpload && requestMedia(multipartUpload);
    if (media?.[1].schema?.properties) media[1].schema.properties.note = { type: "string" };
    expect(multipartUpload).toBeDefined();
    if (!multipartUpload) return;
    expect(
      curlCodeSample(multipartDocument, multipartUpload, {
        body: JSON.stringify({ note: "@/tmp/secret" }),
        origin: "https://docs.example.com",
      }),
    ).toContain("--form-string 'note=@/tmp/secret'");
    const structuredDocument = structuredClone(document);
    const structured = getOperations(structuredDocument).find((operation) => operation.method === "get");
    expect(structured).toBeDefined();
    if (!structured) return;
    structured.parameters = [
      ...(structured.parameters ?? []),
      { in: "query", name: "filter", schema: { items: { type: "string" }, type: "array" } },
    ];
    expect(() =>
      curlCodeSample(structuredDocument, structured, {
        origin: "https://docs.example.com",
        values: { "query:filter": "[" },
      }),
    ).not.toThrow();
  });

  test("keeps enum values out of schema type labels", () => {
    const schema = { enum: ["detect", "segment"], type: "string" };
    expect(schemaLabel(document, schema)).toBe("string");
    expect(schemaConstraints(document, schema)).toEqual(["values: detect, segment"]);
    const array = { items: schema, type: "array" };
    expect(schemaLabel(document, array)).toBe("string[]");
    expect(schemaConstraints(document, array)).toEqual(["values: detect, segment"]);
    expect(schemaConstraints(document, { anyOf: [schema, { enum: ["pose"], type: "string" }] })).toEqual([
      "values: detect, segment",
      "values: pose",
    ]);
    expect(
      schemaConstraints(document, {
        allOf: [{ enum: ["obb"], type: "string" }],
        anyOf: [{ enum: ["classify"], type: "string" }],
        oneOf: [{ enum: ["pose"], type: "string" }],
      }),
    ).toEqual(["values: obb", "values: classify", "values: pose"]);
  });

  test("uses empty generic string examples", () => {
    expect(schemaExample(document, { type: "string" })).toBe("");
  });

  test("renders dictionary schemas", () => {
    const value = { anyOf: [{ enum: ["High", "Medium", "Low"], type: "string" }, { type: "null" }] };
    const schema = { additionalProperties: value, propertyNames: { type: "string" }, type: "object" };
    expect(schemaExample(document, schema)).toEqual({ key: "High" });
    expect(schemaFields(document, schema, "response")).toEqual([
      { depth: 0, description: undefined, name: "[key: string]", required: false, schema: value },
    ]);
    const items = {
      items: { properties: { id: { type: "string" } }, type: "object" },
      type: ["array", "null"],
    };
    expect(
      schemaFields(
        document,
        { additionalProperties: items, properties: { total: { type: "integer" } }, type: "object" },
        "response",
      ).map((field) => field.name),
    ).toEqual(["total", "[key: string][]", "[key: string][].id"]);
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

  test("generates typed dictionary responses with wire keys", async () => {
    const types = await Bun.file(join(output, "src/example_api/types.py")).text();
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(types).not.toContain("Any | None");
    expect(types).toContain('WidgetsCreateResponse = TypedDict("WidgetsCreateResponse"');
    expect(types).toContain('"widgetId": str');
    expect(types).toContain('"displayName": str | None');
    expect(types).toContain('"metadata": NotRequired[WidgetsRetrieveResponseValueMetadata | None]');
    expect(types).toContain('"opaque": NotRequired[Any]');
    expect(types).toContain('"exclusiveOpaque": NotRequired[Any | str | None]');
    expect(types).toContain("WidgetsRetrieveResponse = WidgetsRetrieveResponseValue | None");
    expect(types).toContain('"widget": NotRequired[WidgetsRetrieveResponseValue]');
    expect(types).toContain(
      'UploadsUploadFileResponseVariant1 = TypedDict("UploadsUploadFileResponseVariant1", {"requestId": str, "success":',
    );
    expect(types).toContain(
      'UploadsUploadFileResponseVariant2 = TypedDict("UploadsUploadFileResponseVariant2", {"requestId": str, "failureId": str, "error": str, "retryAfter": NotRequired[int]}',
    );
    expect(types).toContain(
      'UploadsUploadFileResponseVariant3 = TypedDict("UploadsUploadFileResponseVariant3", {"requestId": str, "failureId": str, "error": NotRequired[str], "retryAfter": int}',
    );
    expect(types).toContain(
      "UploadsUploadFileResponse = UploadsUploadFileResponseVariant1 | UploadsUploadFileResponseVariant2 | UploadsUploadFileResponseVariant3",
    );
    expect(types).toContain(
      "UploadsUploadFileResponseVariant1PrimaryFailure = UploadsUploadFileResponseVariant1PrimaryFailureVariant1 | UploadsUploadFileResponseVariant1PrimaryFailureVariant2",
    );
    expect(types).toContain(
      '"mixed": NotRequired[dict[str, Any] | str], "constrained": NotRequired[UploadsUploadFileResponseVariant1ConstrainedVariant1 | UploadsUploadFileResponseVariant1ConstrainedVariant2]',
    );
    expect(types).toContain(
      'UploadsUploadFileResponseVariant1ConstrainedVariant1 = TypedDict("UploadsUploadFileResponseVariant1ConstrainedVariant1", {"code": str, "message": NotRequired[str]})',
    );
    expect(types).toContain(
      'UploadsUploadFileResponseVariant1ConstrainedVariant2 = TypedDict("UploadsUploadFileResponseVariant1ConstrainedVariant2", {"code": NotRequired[str], "message": str})',
    );
    expect(types).toContain(
      '"primaryFailure": NotRequired[UploadsUploadFileResponseVariant1PrimaryFailure], "secondaryFailure": NotRequired[UploadsUploadFileResponseVariant1PrimaryFailure]',
    );
    expect(widgets).toContain("description: str | None");
    expect(widgets).toContain("label: str | NotGiven = NOT_GIVEN");
    expect(widgets).toContain("return cast(WidgetsCreateResponse,");
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
    expect(types).toContain('"warnings": list[str] | None');
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
    expect(echo).toContain('server="/v2"');
    expect(echo).not.toContain("auth=(");
  });

  test("generates typed collection responses", async () => {
    const reports = await Bun.file(join(output, "src/example_api/resources/reports.py")).text();
    const types = await Bun.file(join(output, "src/example_api/types.py")).text();
    expect(reports).toContain("return cast(ReportsListResponse,");
    expect(reports).toContain('style="pipeDelimited", explode=False');
    expect(types).toContain("ReportsListResponse = list[ReportsListResponseItem]");
    expect(types).toContain('ReportsListResponseItem = TypedDict("ReportsListResponseItem"');
    expect(types).toContain('"artifact": bytes');
    expect(types).toContain('"user-id": str');
    expect(types).toContain('"user_id": str');
    expect(types).not.toContain('"password"');
  });
});
