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
    output = await mkdtemp(join(tmpdir(), "ultralytics-openapi-"));
    const document = (await Bun.file("public/openapi.json").json()) as OpenApiDocument;
    count = await generatePython(document, config, output);
  });

  afterAll(async () => {
    await rm(output, { force: true, recursive: true });
  });

  test("generates every Platform operation", () => {
    expect(count).toBe(113);
  });

  test("generates the public sync and async clients", async () => {
    const source = await Bun.file(join(output, "src/ultralytics_platform/__init__.py")).text();
    expect(source).toContain("from .client import Platform");
    expect(source).toContain("from .async_client import AsyncPlatform");
  });

  test("generates intuitive resource methods and Google-style docstrings", async () => {
    const source = await Bun.file(join(output, "src/ultralytics_platform/resources/datasets.py")).text();
    expect(source).toContain("def list(");
    expect(source).toContain("def retrieve_selected_images(");
    expect(source).toContain("def delete_classes(");
    expect(source).toContain("Args:\n");
    expect(source).toContain("dataset_id (str):");
    expect(source).toContain("Returns:\n");
    expect(source).toContain("Raises:\n");
  });

  test("generates authentication, retries, errors, and multipart uploads", async () => {
    const client = await Bun.file(join(output, "src/ultralytics_platform/client.py")).text();
    const runtime = await Bun.file(join(output, "src/ultralytics_platform/_client.py")).text();
    const datasets = await Bun.file(join(output, "src/ultralytics_platform/resources/datasets.py")).text();
    expect(client).toContain('os.environ.get("ULTRALYTICS_API_KEY")');
    expect(client).not.toContain("raise ValueError");
    expect(runtime).toContain('retryable = method.upper() in {"GET", "HEAD", "OPTIONS"}');
    expect(runtime).toContain('headers={"Authorization": f"Bearer {api_key}"} if api_key else {}');
    expect(runtime).toContain("{408, 409, 429}");
    expect(runtime).toContain('response.headers.get("retry-after"');
    expect(runtime).toContain("raise APIError(");
    expect(datasets).toContain('files={"image": image}');
  });

  test("generates nested response models with JSON aliases", async () => {
    const types = await Bun.file(join(output, "src/ultralytics_platform/types.py")).text();
    const datasets = await Bun.file(join(output, "src/ultralytics_platform/resources/datasets.py")).text();
    expect(types).toContain("class APIModel(BaseModel):");
    expect(types).toContain('dataset_id: str | None = Field(alias="datasetId", default=None)');
    expect(datasets).toContain("DatasetsCreateResponse.model_validate(");
  });
});
