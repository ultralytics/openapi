// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import config from "../../openapi.config.json";
import type { OpenApiDocument } from "../openapi";
import { generatePython } from "./python";

describe("Python generator", () => {
  let output = "";
  let count = 0;

  beforeAll(async () => {
    output = await mkdtemp(join(tmpdir(), "openapi-generator-"));
    await Bun.write(join(output, "stale.py"), "");
    const document = (await Bun.file("examples/openapi.json").json()) as OpenApiDocument;
    count = await generatePython(document, config, output);
  });

  afterAll(async () => {
    await rm(output, { force: true, recursive: true });
  });

  test("generates every operation from a clean output", async () => {
    expect(count).toBe(5);
    expect(await Bun.file(join(output, "stale.py")).exists()).toBe(false);
  });

  test("generates configured sync and async clients", async () => {
    const source = await Bun.file(join(output, "src/example_api/__init__.py")).text();
    const client = await Bun.file(join(output, "src/example_api/client.py")).text();
    expect(source).toContain("from .client import Example");
    expect(source).toContain("from .async_client import AsyncExample");
    expect(client).toContain('base_url: str = "https://api.example.com/v1"');
  });

  test("generates resource methods and Google-style docstrings", async () => {
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(widgets).toContain("def list(");
    expect(widgets).toContain("def retrieve(");
    expect(widgets).toContain("Args:\n");
    expect(widgets).toContain("widget_id (str):");
    expect(widgets).toContain("Returns:\n");
    expect(widgets).toContain("Raises:\n");
  });

  test("generates authentication, safe retries, errors, and multipart uploads", async () => {
    const client = await Bun.file(join(output, "src/example_api/client.py")).text();
    const runtime = await Bun.file(join(output, "src/example_api/_client.py")).text();
    const uploads = await Bun.file(join(output, "src/example_api/resources/uploads.py")).text();
    expect(client).toContain('os.environ.get("EXAMPLE_API_KEY")');
    expect(runtime).toContain('headers={"Authorization": f"Bearer {api_key}"} if api_key else {}');
    expect(runtime).toContain('path.lstrip("/")');
    expect(runtime).toContain('retryable = method.upper() in {"GET", "HEAD", "OPTIONS"}');
    expect(runtime).toContain("raise APIError(");
    expect(uploads).toContain('files={"file": file}');
  });

  test("generates response models with JSON aliases", async () => {
    const types = await Bun.file(join(output, "src/example_api/types.py")).text();
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(types).toContain("class APIModel(BaseModel):");
    expect(types).toContain('widget_id: str = Field(alias="widgetId")');
    expect(widgets).toContain("WidgetsCreateResponse.model_validate(");
  });

  test("merges composed request schemas without narrowing union fields", async () => {
    const widgets = await Bun.file(join(output, "src/example_api/resources/widgets.py")).text();
    expect(widgets).toContain('provider: Literal["cloud", "local"]');
    expect(widgets).toContain("settings: dict[str, Any]");
    expect(widgets).toContain("name: str");
  });

  test("passes non-object JSON request bodies through unchanged", async () => {
    const events = await Bun.file(join(output, "src/example_api/resources/events.py")).text();
    expect(events).toContain("body: list[str]");
    expect(events).toContain("json=body");
  });
});
