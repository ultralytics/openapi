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
  objectSchema,
  requestBodyExample,
  requestMedia,
  resolveServerUrl,
  schemaConstraints,
  schemaExample,
  schemaFields,
  schemaLabel,
  sdkArguments,
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
    expect(project).toContain('description = "Typed Python SDK for Example API"');
    expect(project).toContain('authors = [{ name = "Ultralytics", email = "hello@ultralytics.com" }]');
    expect(project).toContain('keywords = ["api-client","openapi","sdk"]');
    expect(project).toContain('"Programming Language :: Python :: 3.11"');
    expect(project).toContain('"Programming Language :: Python :: 3.14"');
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

  test("uses a configured package README", async () => {
    const directory = await mkdtemp(join(tmpdir(), "openapi-readme-"));
    const readme = join(directory, "README.md");
    try {
      await Bun.write(readme, "# Consumer-owned README\n");
      await generatePython(document, { ...config, python: { ...config.python, readme } }, join(directory, "generated"));
      expect(await Bun.file(join(directory, "generated/README.md")).text()).toBe("# Consumer-owned README\n");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
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
    if (media) {
      media[1].example = { description: null, name: "Widget", provider: "cloud", region: "us", settings: {} };
    }
    const echo = getOperations(source).find((operation) => operation.path === "/echo");
    const echoMedia = echo && requestMedia(echo);
    if (echoMedia) {
      echoMedia[1].example = null;
      if (echoMedia[1].schema) echoMedia[1].schema.type = ["string", "null"];
    }
    const widgetQuery = source.paths["/widgets/{widgetId}"]?.get?.parameters?.[0];
    if (widgetQuery && "$ref" in widgetQuery) throw new Error("Expected inline widget query parameter");
    if (widgetQuery?.schema) widgetQuery.schema.example = "widget_456";
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

    const incomplete = structuredClone(source);
    const incompleteQuery = incomplete.paths["/widgets/{widgetId}"]?.get?.parameters?.[0];
    if (incompleteQuery && "$ref" in incompleteQuery) throw new Error("Expected inline widget query parameter");
    if (incompleteQuery?.schema) delete incompleteQuery.schema.example;
    const withoutPlaceholder = addPythonCodeSamples(incomplete, {
      client: config.python.client,
      environment: config.apiKey.environment,
      package: config.python.package,
    });
    expect(withoutPlaceholder.paths["/widgets/{widgetId}"]?.get?.["x-codeSamples"]?.[0]?.source).toContain(
      'widget_id_query="resource-id"',
    );
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
    expect(curl).toContain("-F 'file=@path/to/file'");
    expect(curl).toStartWith("curl https://api.example.com/v1/uploads");
    expect(curl).not.toContain("--request");
    expect(curl).not.toContain("--url");
    expect(curl).not.toContain("Content-Type: multipart/form-data");
    expect(curl).not.toContain("-d '");
    const raw = getOperations(document).find((operation) => requestMedia(operation)?.[0] === "text/plain");
    expect(raw).toBeDefined();
    if (!raw) return;
    expect(
      curlCodeSample(document, raw, {
        body: requestBodyExample(document, raw),
        origin: "https://docs.example.com",
      }),
    ).toContain("-d 'example'");
    const multipartDocument = structuredClone(document);
    const multipartUpload = getOperations(multipartDocument).find(
      (operation) => requestMedia(operation)?.[0] === "multipart/form-data",
    );
    const media = multipartUpload && requestMedia(multipartUpload);
    if (media?.[1].schema?.properties) media[1].schema.properties.note = { type: "string" };
    expect(multipartUpload).toBeDefined();
    if (!multipartUpload) return;
    const authoredMultipartCurl = curlCodeSample(multipartDocument, multipartUpload, {
      body: JSON.stringify({ note: "@/tmp/secret" }),
      origin: "https://docs.example.com",
    });
    expect(authoredMultipartCurl).toContain("--form-string 'note=@/tmp/secret'");
    expect(authoredMultipartCurl).not.toContain("file=@");
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

    const minimalDocument = structuredClone(document);
    const create = getOperations(minimalDocument).find(
      (operation) => operation.path === "/widgets" && operation.method === "post",
    );
    const createMedia = create && requestMedia(create);
    expect(create).toBeDefined();
    expect(createMedia).toBeDefined();
    if (!create || !createMedia) return;
    createMedia[1].schema = {
      properties: { name: { type: "string" }, description: { type: "string" } },
      type: "object",
    };
    const minimalBody = requestBodyExample(minimalDocument, create);
    expect(minimalBody).toBe('{\n  "name": "Example name"\n}');
    createMedia[1].schema = {
      allOf: [
        { additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" },
        { additionalProperties: false, properties: { b: { type: "integer" } }, type: "object" },
      ],
    };
    expect(sdkArguments(minimalDocument, create)).toMatchObject([{ name: "body", wholeBody: true }]);
    const minimalCurl = curlCodeSample(minimalDocument, create, {
      body: minimalBody,
      environment: "EXAMPLE_API_KEY",
      origin: "https://docs.example.com",
    });
    expect(minimalCurl).toContain('-H "Authorization: Bearer $EXAMPLE_API_KEY"');
    expect(minimalCurl).not.toContain("description");
    createMedia[1].schema = {
      example: { name: "authored", undocumented: "preserved" },
      properties: { name: { type: "string" } },
      type: "object",
    };
    expect(requestBodyExample(minimalDocument, create)).toContain('"undocumented": "preserved"');
    createMedia[1].schema = {
      oneOf: [{ example: { name: "authored", optional: "preserved" }, type: "object" }],
    };
    expect(requestBodyExample(minimalDocument, create)).toContain('"optional": "preserved"');
    createMedia[1].schema = {
      allOf: [{ oneOf: [{ example: { name: "authored", optional: "preserved" }, type: "object" }] }],
    };
    expect(requestBodyExample(minimalDocument, create)).toContain('"optional": "preserved"');
    createMedia[1].schema = {
      allOf: [
        { example: { model: "yolo11n.pt" }, properties: { model: { type: "string" } }, type: "object" },
        { properties: { images: { items: { type: "string" }, type: "array" } }, required: ["images"], type: "object" },
      ],
    };
    expect(JSON.parse(requestBodyExample(minimalDocument, create))).toEqual({
      images: ["example-images"],
      model: "yolo11n.pt",
    });
    createMedia[1].schema = { allOf: [{ example: "authored", type: "string" }, { minLength: 1 }] };
    expect(requestBodyExample(minimalDocument, create)).toBe('"authored"');
    createMedia[1].schema = { allOf: [{ example: null, type: ["string", "null"] }] };
    expect(requestBodyExample(minimalDocument, create)).toBe("null");
    const unionCreate = structuredClone(create);
    unionCreate.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            oneOf: [
              {
                description: "Upload a file",
                properties: { conf: { type: "number" }, file: { format: "binary", type: "string" } },
                required: ["file"],
                type: "object",
              },
              {
                description: "Use a source URL",
                properties: {
                  conf: { type: "number" },
                  file: { anyOf: [{ format: "binary", type: "string" }, { type: "null" }] },
                  source: { type: "string" },
                },
                required: ["source"],
                type: "object",
              },
            ],
          },
        },
      },
    };
    const unionBody = requestBodyExample(minimalDocument, unionCreate);
    expect(unionBody).toBe('{\n  "file": "path/to/file"\n}');
    const laterUnion = structuredClone(create);
    laterUnion.requestBody = {
      required: true,
      content: {
        "application/json": {
          schema: {
            anyOf: [
              { additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" },
              { additionalProperties: false, properties: { b: { type: "integer" } }, type: "object" },
            ],
            properties: { b: { type: "integer" } },
            required: ["b"],
            type: "object",
          },
        },
      },
    };
    expect(requestBodyExample(minimalDocument, laterUnion)).toBe('{\n  "b": 1\n}');
    createMedia[1].schema = {
      minProperties: 2,
      properties: { a: { type: "integer" }, b: { type: "integer" } },
      type: "object",
    };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "a": 1,\n  "b": 1\n}');
    createMedia[1].schema = {
      additionalProperties: { type: "string" },
      minProperties: 2,
      properties: { a: { type: "integer" } },
      type: "object",
    };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "a": 1,\n  "key": "example-key"\n}');
    createMedia[1].schema = {
      maxProperties: 1,
      properties: { id: { readOnly: true, type: "string" } },
      required: ["id"],
      type: "object",
    };
    expect(requestBodyExample(minimalDocument, create)).toBe("{}");
    createMedia[1].schema = {
      additionalProperties: { type: "string" },
      minProperties: 1,
      properties: { id: { readOnly: true, type: "string" } },
      type: "object",
    };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "key": "example-key"\n}');
    createMedia[1].schema = {
      additionalProperties: { type: "string" },
      minProperties: 2,
      properties: { a: { type: "integer" } },
      propertyNames: { pattern: "^key[0-9]*$", type: "string" },
      type: "object",
    };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "key": "example-key",\n  "key2": "example-key2"\n}');
    createMedia[1].schema = {
      allOf: [{ properties: { a: { type: "integer" }, b: { type: "integer" } }, type: "object" }, { required: ["b"] }],
    };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "b": 1\n}');
    createMedia[1].schema = {
      allOf: [
        { properties: { a: { type: "integer" }, b: { type: "integer" } }, type: "object" },
        { propertyNames: { pattern: "^b$", type: "string" } },
      ],
    };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "b": 1\n}');
    expect(sdkArguments(minimalDocument, unionCreate)).toMatchObject([
      {
        description: "Upload a file Or Use a source URL",
        name: "body",
        required: true,
        wholeBody: true,
      },
    ]);
    const undescribedUnion = structuredClone(unionCreate);
    const undescribedVariants = requestMedia(undescribedUnion)?.[1].schema?.oneOf;
    for (const variant of undescribedVariants ?? []) delete variant.description;
    expect(sdkArguments(minimalDocument, undescribedUnion)).toMatchObject([{ description: "Request body." }]);
    const optionalClosedUnion = structuredClone(unionCreate);
    const optionalClosedMedia = requestMedia(optionalClosedUnion);
    if (optionalClosedMedia) {
      optionalClosedMedia[1].schema = {
        oneOf: [
          { additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" },
          { additionalProperties: false, properties: { b: { type: "integer" } }, type: "object" },
        ],
      };
    }
    expect(sdkArguments(minimalDocument, optionalClosedUnion)).toMatchObject([{ name: "body", wholeBody: true }]);
    const optionalClosedAnyOf = structuredClone(optionalClosedUnion);
    const optionalClosedAnyOfMedia = requestMedia(optionalClosedAnyOf);
    if (optionalClosedAnyOfMedia?.[1].schema?.oneOf) {
      optionalClosedAnyOfMedia[1].schema.anyOf = optionalClosedAnyOfMedia[1].schema.oneOf;
      delete optionalClosedAnyOfMedia[1].schema.oneOf;
    }
    expect(sdkArguments(minimalDocument, optionalClosedAnyOf)).toMatchObject([{ name: "body", wholeBody: true }]);
    expect(
      curlCodeSample(minimalDocument, unionCreate, {
        body: unionBody,
        origin: "https://docs.example.com",
      }),
    ).toContain("-F 'file=@path/to/file'");
    const laterBinary = structuredClone(unionCreate);
    const laterMedia = requestMedia(laterBinary);
    if (laterMedia?.[1].schema?.oneOf?.[0]?.properties) delete laterMedia[1].schema.oneOf[0].properties.file;
    expect(
      curlCodeSample(minimalDocument, laterBinary, {
        body: JSON.stringify({ file: "later.bin", source: "upload" }),
        origin: "https://docs.example.com",
      }),
    ).toContain("-F 'file=@later.bin'");
    const jsonUnionCreate = structuredClone(unionCreate);
    const unionMedia = requestMedia(unionCreate);
    expect(unionMedia).toBeDefined();
    if (!unionMedia) return;
    jsonUnionCreate.requestBody = {
      content: { "application/json": unionMedia[1] },
    };
    expect(sdkArguments(minimalDocument, jsonUnionCreate)).toMatchObject([
      { name: "body", required: false, wholeBody: true },
    ]);
    createMedia[1].schema = { example: null, type: ["object", "null"] };
    expect(requestBodyExample(minimalDocument, create)).toBe("null");
    createMedia[1].schema = { additionalProperties: { type: "string" }, type: "object" };
    expect(requestBodyExample(minimalDocument, create)).toBe('{\n  "key": "example-key"\n}');
    createMedia[1].schema = { properties: { id: { readOnly: true, type: "string" } }, type: "object" };
    expect(requestBodyExample(minimalDocument, create)).toBe("{}");
    minimalDocument.components = { schemas: { Node: { oneOf: [{ $ref: "#/components/schemas/Node" }] } } };
    createMedia[1].schema = { $ref: "#/components/schemas/Node" };
    expect(() => requestBodyExample(minimalDocument, create)).not.toThrow();
    const retrieve = getOperations(document).find((operation) => operation.path === "/widgets/{widgetId}");
    expect(retrieve).toBeDefined();
    if (!retrieve) return;
    const pathParameter = retrieve.parameters?.find((parameter) => parameter.in === "path");
    if (pathParameter) pathParameter.schema = { type: "integer" };
    const retrieveCurl = curlCodeSample(document, retrieve, { origin: "https://docs.example.com" });
    expect(retrieveCurl).toStartWith("curl -g ");
    expect(retrieveCurl).toContain("/widgets/{widgetId}");
    expect(
      curlCodeSample(document, retrieve, {
        origin: "https://docs.example.com",
        values: { "path:widgetId": "1" },
      }),
    ).toContain("/widgets/1");
    expect(
      curlCodeSample(document, retrieve, {
        origin: "https://docs.example.com",
        values: { "path:widgetId": "" },
      }),
    ).toContain("/widgets/{widgetId}");
    const session = getOperations(document).find((operation) => operation.path === "/sessions");
    expect(session).toBeDefined();
    if (!session) return;
    expect(curlCodeSample(document, session, { body: '{"tags":[]}', origin: "https://docs.example.com" })).toContain(
      "-X POST",
    );
    const getWithBody = structuredClone(structured);
    getWithBody.requestBody = raw.requestBody;
    expect(
      curlCodeSample(structuredDocument, getWithBody, {
        body: requestBodyExample(document, raw),
        origin: "https://docs.example.com",
      }),
    ).toContain("-X GET");
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
        maximum: Number.MAX_SAFE_INTEGER,
        minimum: -Number.MAX_SAFE_INTEGER,
        type: "integer",
      }),
    ).toEqual([`minimum ${-Number.MAX_SAFE_INTEGER}`, `maximum ${Number.MAX_SAFE_INTEGER}`]);
    expect(
      schemaConstraints(document, {
        allOf: [{ enum: ["obb"], type: "string" }],
        anyOf: [{ enum: ["classify"], type: "string" }],
        oneOf: [{ enum: ["pose"], type: "string" }],
      }),
    ).toEqual(["values: obb", "values: classify", "values: pose"]);
  });

  test("uses generic string examples", () => {
    expect(schemaExample(document, { type: "string" })).toBe("example");
    expect(schemaExample(document, { format: "email", type: "string" })).toBe("jane@example.com");
    expect(schemaExample(document, { format: "email", maxLength: 10, type: "string" })).toBe("a@b.co");
    expect(schemaExample(document, { format: "ipv4", type: "string" })).toBe("192.0.2.1");
    expect(schemaExample(document, { format: "custom", type: "string" })).toBe("<custom value>");
    expect(schemaExample(document, { format: "date", type: "string" }, 0, "data")).toBe("2026-01-01");
    expect(
      schemaExample(document, {
        format: "date",
        pattern: "^2026-02-30$|^2027-01-01$",
        type: "string",
      }),
    ).toBe("2027-01-01");
    expect(schemaExample(document, { format: "date-time", maxLength: 10, type: "string" })).toBe("<date-time value>");
    expect(schemaExample(document, { format: "uuid", type: "string" }, 0, "model")).toBe(
      "123e4567-e89b-12d3-a456-426614174000",
    );
    expect(schemaExample(document, { type: "string" }, 0, "project")).toBe("example-project");
    expect(schemaExample(document, { maxLength: 2, type: "string" }, 0, "iconLetter")).toBe("ex");
    expect(schemaExample(document, { pattern: "^[A-Z]{8}$", type: "string" }, 0, "code")).toBe("AAAAAAAA");
    expect(schemaExample(document, { pattern: "^[a-z0-9]+$", type: "string" }, 0, "model")).toBe("yolo26n");
    expect(schemaExample(document, { pattern: "^[a-z]+$", type: "string" }, 0, "model")).toBe("example");
    expect(schemaExample(document, { maxLength: 6, pattern: "^yolo26n$|^yolo26$", type: "string" }, 0, "model")).toBe(
      "yolo26",
    );
    expect(schemaExample(document, { minLength: 10, oneOf: [{ type: "string" }] })).toBe("examplexxx");
    expect(schemaExample(document, { allOf: [{ type: "string" }, { minLength: 10 }] })).toBe("examplexxx");
    expect(
      schemaExample(document, {
        allOf: [{ allOf: [{ type: "string" }, { minLength: 10 }, { pattern: "^example" }] }, { pattern: "xxx$" }],
      }),
    ).toBe("examplexxx");
    expect(schemaExample(document, { type: "null" })).toBeNull();
    expect(schemaExample(document, { type: ["null"] })).toBeNull();
    expect(
      schemaExample(document, {
        allOf: [
          { minimum: 20, type: "integer" },
          { minimum: 10, type: "integer" },
        ],
      }),
    ).toBe(20);
    expect(
      schemaExample(document, {
        allOf: [
          { maximum: 20, type: "integer" },
          { exclusiveMaximum: 10, type: "integer" },
        ],
      }),
    ).toBe(1);
    expect(
      schemaExample(document, {
        allOf: [
          { enum: ["a", "b"], type: "string" },
          { enum: ["c", "b"], type: "string" },
        ],
      }),
    ).toBe("b");
    expect(
      schemaExample(document, {
        anyOf: [
          { pattern: "^a$", type: "string" },
          { properties: { id: { type: "integer" } }, type: "object" },
        ],
        pattern: "^b$",
      }),
    ).toEqual({ id: 1 });
    expect(
      schemaExample(document, {
        allOf: [
          {
            anyOf: [
              { pattern: "^a$", type: "string" },
              { pattern: "^b$", type: "string" },
            ],
          },
          { pattern: "^b$" },
        ],
      }),
    ).toBe("b");
    expect(
      schemaExample(document, {
        anyOf: [{ type: "null" }, { properties: { id: { type: "integer" } }, type: "object" }],
        type: "object",
      }),
    ).toEqual({ id: 1 });
    expect(
      schemaExample(document, {
        allOf: [
          { items: { type: "string" }, type: "array" },
          { minItems: 2, type: "array" },
        ],
      }),
    ).toEqual(["example", "example"]);
    expect(
      schemaExample(document, {
        allOf: [
          { items: { type: "string" }, type: "array" },
          { maxItems: 0, type: "array" },
        ],
      }),
    ).toEqual([]);
    expect(
      schemaExample(document, {
        oneOf: [{ pattern: "^a$", type: "string" }, { type: "string" }],
      }),
    ).toBe("example");
    expect(
      schemaExample(document, {
        allOf: [
          {
            allOf: [{ maxLength: 5 }],
            anyOf: [{ pattern: "^abcde$|^yolo26n$", type: "string" }],
          },
        ],
      }),
    ).toBe("abcde");
    expect(
      schemaExample(document, {
        allOf: [{ enum: ["a", "b"], type: "string" }, { pattern: "^b$" }],
      }),
    ).toBe("b");
    expect(
      schemaExample(document, {
        anyOf: [
          { additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" },
          { additionalProperties: false, properties: { b: { type: "integer" } }, type: "object" },
        ],
        properties: { b: { type: "integer" } },
        required: ["b"],
        type: "object",
      }),
    ).toEqual({ b: 1 });
    expect(
      schemaExample(document, {
        const: null,
        oneOf: [{ nullable: true, type: "string" }, { type: "number" }],
      }),
    ).toBeNull();
    expect(schemaExample(document, { oneOf: [{}, { type: "string" }] })).toBeNull();
    expect(
      schemaExample(document, {
        allOf: [
          {
            properties: { failureId: { type: "string" } },
            required: ["failureId"],
            type: "object",
          },
          {
            oneOf: [{ required: ["error"] }, { required: ["retryAfter"] }],
            properties: { error: { type: "string" }, retryAfter: { type: "integer" } },
          },
        ],
      }),
    ).toEqual({ error: "example-error", failureId: "resource-id" });
    expect(schemaExample(document, { exclusiveMaximum: 0.6, exclusiveMinimum: 0.5, type: "number" })).toBe(0.55);
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 2,
        propertyNames: { enum: ["a", "b"], type: "string" },
        type: "object",
      }),
    ).toEqual({ a: "example-a", b: "example-b" });
    expect(
      schemaExample(document, {
        allOf: [{ format: "custom", type: "string" }, { pattern: "^abc$" }],
      }),
    ).toBe("abc");
    expect(
      schemaExample(document, {
        oneOf: [{ required: ["a"] }, { required: ["b"] }],
        properties: { a: { type: "integer" }, b: { type: "integer" } },
        type: "object",
      }),
    ).toEqual({ a: 1 });
    expect(
      schemaExample(document, {
        oneOf: [
          {
            additionalProperties: false,
            minProperties: 1,
            properties: { a: { type: "integer" } },
            required: [],
            type: "object",
          },
        ],
        type: "object",
      }),
    ).toEqual({ a: 1 });
    expect(schemaExample(document, { minLength: 3, pattern: "^[0-9]+$", type: "string" })).toBe("000");
    expect(schemaExample(document, { pattern: "^[0-9]+$", type: "string" })).toBe("0");
    expect(schemaExample(document, { pattern: "^\\d+$", type: "string" })).toBe("0");
    expect(schemaExample(document, { pattern: "^\\d{3}$", type: "string" })).toBe("000");
    expect(schemaExample(document, { pattern: "^\\d{3,5}$", type: "string" })).toBe("000");
    expect(schemaExample(document, { minLength: 4, pattern: "^\\d{3,5}$", type: "string" })).toBe("0000");
    expect(schemaExample(document, { pattern: "^[0-9]*$", type: "string" })).toBe("0");
    expect(schemaExample(document, { pattern: "^[0-9A-F]{8}$", type: "string" })).toBe("00000000");
    expect(schemaExample(document, { pattern: "^a+$", type: "string" })).toBe("a");
    expect(schemaExample(document, { pattern: "^a{3}$", type: "string" })).toBe("aaa");
    expect(schemaExample(document, { pattern: "^[0-9A-F]{8,}$", type: "string" })).toBe("00000000");
    expect(schemaExample(document, { pattern: "^[0-9]{3,}$", type: "string" })).toBe("000");
    expect(schemaExample(document, { minLength: 4, pattern: "^[0-9]{3,5}$", type: "string" })).toBe("0000");
    expect(schemaExample(document, { pattern: "^[0-9A-F]+$", type: "string" })).toBe("0");
    expect(schemaExample(document, { format: "ipv4", maxLength: 7, type: "string" })).toBe("1.1.1.1");
    expect(schemaExample(document, { format: "custom", maxLength: 5, type: "string" })).toBe("<cust");
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 2,
        propertyNames: { pattern: "^[0-9]{3}$", type: "string" },
        type: "object",
      }),
    ).toEqual({ "000": "example-000", "001": "example-001" });
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 2,
        propertyNames: { pattern: "^(ab|cd)$", type: "string" },
        type: "object",
      }),
    ).toEqual({ ab: "example-ab", cd: "example-cd" });
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 2,
        propertyNames: { pattern: "^a+$", type: "string" },
        type: "object",
      }),
    ).toEqual({ a: "example-a", aa: "example-aa" });
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 2,
        propertyNames: { pattern: "^[a-z]{3}$", type: "string" },
        type: "object",
      }),
    ).toEqual({ key: "example-key", kea: "example-kea" });
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 3,
        propertyNames: { pattern: "^[a-z]{2}$", type: "string" },
        type: "object",
      }),
    ).toEqual({ aa: "example-aa", ac: "example-ac", ad: "example-ad" });
    expect(schemaExample(document, { pattern: "^$", type: "string" })).toBe("");
    expect(schemaExample(document, { pattern: "foo", type: "string" })).toBe("foo");
    expect(schemaExample(document, { pattern: "foo|bar", type: "string" })).toBe("foo");
    expect(schemaExample(document, { pattern: "^foo", type: "string" })).toBe("foo");
    expect(schemaExample(document, { type: "string" }, 0, "apiKey")).toBe("your-api-key");
    expect(schemaExample(document, { type: "string" }, 0, "baseModel")).toBe("yolo26n.pt");
    expect(schemaExample(document, { pattern: "^b[0-9]*$", type: "string" })).toBe("b0");
    expect(
      schemaExample(document, {
        additionalProperties: false,
        properties: { a: { type: "integer" }, b: { type: "integer" } },
        propertyNames: { pattern: "^a$", type: "string" },
        type: "object",
      }),
    ).toEqual({ a: 1 });
    expect(
      schemaExample(document, {
        anyOf: [{ additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" }],
        minProperties: 1,
        properties: { a: { type: "integer" }, b: { type: "integer" } },
        type: "object",
      }),
    ).toEqual({ a: 1 });
    expect(
      schemaExample(document, {
        allOf: [
          {
            properties: { a: { type: "integer" }, b: { type: "integer" } },
            propertyNames: { pattern: "^[a-z]+$", type: "string" },
            required: ["a"],
            type: "object",
          },
          { propertyNames: { pattern: "^a$", type: "string" } },
        ],
      }),
    ).toEqual({ a: 1 });
    expect(
      objectSchema(document, {
        allOf: [
          { properties: { a: { type: "integer" }, b: { type: "integer" } }, type: "object" },
          { propertyNames: { pattern: "^a$", type: "string" } },
        ],
      })?.properties,
    ).toEqual({ a: { type: "integer" } });
    expect(
      objectSchema(document, {
        additionalProperties: false,
        allOf: [{ properties: { a: { type: "integer" } }, type: "object" }],
        type: "object",
      })?.properties,
    ).toEqual({});
    expect(
      objectSchema(document, {
        allOf: [
          { additionalProperties: false, properties: { a: { type: "integer" } } },
          { properties: { b: { type: "integer" } } },
        ],
      })?.properties,
    ).toEqual({ a: { type: "integer" } });
    expect(
      objectSchema(document, {
        allOf: [
          { properties: { name: { pattern: "^a", type: "string" } } },
          { properties: { name: { minLength: 2, type: "string" } } },
        ],
      })?.properties?.name,
    ).toEqual({
      allOf: [
        { pattern: "^a", type: "string" },
        { minLength: 2, type: "string" },
      ],
    });
    expect(schemaConstraints(document, { maxProperties: 3, minProperties: 1, type: "object" })).toEqual([
      "minimum properties 1",
      "maximum properties 3",
    ]);
    expect(
      schemaExample(document, {
        allOf: [
          {
            oneOf: [{ additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" }],
          },
          { minProperties: 1, type: "object" },
        ],
      }),
    ).toEqual({ a: 1 });
    expect(
      schemaExample(document, {
        allOf: [
          {
            additionalProperties: { type: "string" },
            minProperties: 2,
            properties: { b: { type: "integer" } },
            type: "object",
          },
          { propertyNames: { pattern: "^b[0-9]*$", type: "string" } },
        ],
      }),
    ).toEqual({ b: 1, b0: "example-b0" });
    expect(schemaExample(document, { enum: ["a", "b"], pattern: "^b$", type: "string" })).toBe("b");
    expect(
      schemaExample(document, { maxProperties: 0, properties: { id: { type: "integer" } }, type: "object" }),
    ).toEqual({});
    expect(
      schemaExample(document, {
        allOf: [
          { properties: { a: { type: "integer" } }, type: "object" },
          { maxProperties: 0, type: "object" },
        ],
      }),
    ).toEqual({});
    expect(
      schemaExample(document, { additionalProperties: { type: "string" }, maxProperties: 0, type: "object" }),
    ).toEqual({});
    expect(
      schemaExample(document, { additionalProperties: { type: "string" }, minProperties: 2, type: "object" }),
    ).toEqual({ key: "example-key", key2: "example-key2" });
    expect(
      schemaExample(document, {
        anyOf: [
          {
            additionalProperties: { type: "integer" },
            properties: { a: { type: "integer" } },
            type: "object",
          },
          { additionalProperties: false, properties: { b: { type: "string" } }, type: "object" },
        ],
        properties: { b: { type: "string" } },
        required: ["b"],
        type: "object",
      }),
    ).toEqual({ b: "example-b" });
    expect(
      schemaExample(document, {
        allOf: [
          { properties: { a: { type: "integer" } }, type: "object" },
          { additionalProperties: false, properties: { b: { type: "integer" } }, type: "object" },
        ],
      }),
    ).toEqual({ b: 1 });
    expect(schemaExample(document, { anyOf: [{ type: ["string", "number"] }], pattern: "^a$" })).toBe("a");
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 2,
        properties: { a: { type: "integer" } },
        type: "object",
      }),
    ).toEqual({ a: 1, key: "example-key" });
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        required: ["foo"],
        type: "object",
      }),
    ).toEqual({ foo: "example-foo" });
    expect(
      schemaExample(document, {
        allOf: [{ type: ["string", "number"] }, { minimum: 1, type: "number" }],
      }),
    ).toBe(1);
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 1,
        propertyNames: { pattern: "^[A-Z]+$", type: "string" },
        type: "object",
      }),
    ).toEqual({ KEY: "example-key" });
    expect(
      schemaExample(document, {
        anyOf: [{ maximum: 1.9, minimum: 1.5, type: ["integer", "number"] }],
      }),
    ).toBe(1.5);
    expect(
      schemaExample(document, {
        allOf: [
          { additionalProperties: false, properties: { a: { type: "integer" } }, type: "object" },
          { additionalProperties: false, properties: { b: { type: "integer" } }, type: "object" },
        ],
      }),
    ).toEqual({});
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 1,
        propertyNames: { pattern: "^[A-Z]{8}$", type: "string" },
        type: "object",
      }),
    ).toEqual({ AAAAAAAA: "example-aaaaaaaa" });
    expect(schemaExample(document, { exclusiveMinimum: 1, minimum: 5, type: "number" })).toBe(5);
    expect(
      schemaExample(document, {
        allOf: [
          { multipleOf: 0.2, type: "number" },
          { multipleOf: 0.3, type: "number" },
        ],
      }),
    ).toBe(1.2);
    expect(
      schemaExample(document, {
        allOf: [{ type: "integer" }, { maximum: 2.5, minimum: 1.5, type: "number" }],
      }),
    ).toBe(2);
    expect(
      schemaExample(document, {
        allOf: [
          { enum: [1, 2], type: "integer" },
          { multipleOf: 2, type: "integer" },
        ],
      }),
    ).toBe(2);
    expect(
      schemaExample(document, {
        anyOf: [
          { pattern: "^a$", type: "string" },
          { pattern: "^b$", type: "string" },
        ],
        pattern: "^b$",
      }),
    ).toBe("b");
    expect(
      schemaExample(document, {
        allOf: [
          { multipleOf: 1e-7, type: "number" },
          { multipleOf: 0.3, type: "number" },
        ],
      }),
    ).toBe(1.2);
    expect(schemaExample(document, { minimum: -Number.MAX_SAFE_INTEGER, type: "integer" })).toBe(1);
    expect(schemaExample(document, { maximum: 1.9, minimum: 1.5, type: ["integer", "number"] })).toBe(1.5);
    expect(schemaExample(document, { multipleOf: 0.3, type: "integer" })).toBe(3);
    expect(
      schemaExample(document, {
        maxItems: 0,
        minItems: 1,
        pattern: "^a$",
        type: ["array", "string"],
      }),
    ).toBe("a");
    expect(
      schemaExample(document, {
        exclusiveMaximum: 0.25,
        exclusiveMinimum: 0.15,
        multipleOf: 0.1,
        type: "number",
      }),
    ).toBe(0.2);
    expect(
      schemaExample(document, {
        allOf: [{ type: ["string", "null"] }, { type: "null" }],
      }),
    ).toBeNull();
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 1,
        propertyNames: { pattern: "^[0-9]{3}$", type: "string" },
        type: "object",
      }),
    ).toEqual({ "000": "example-000" });
    expect(schemaExample(document, { format: "time", pattern: "^99:99:99Z$|^12:00:00Z$", type: "string" })).toBe(
      "12:00:00Z",
    );
    expect(schemaExample(document, { format: "ipv6", pattern: "^::::$|^2001:db8::1$", type: "string" })).toBe(
      "2001:db8::1",
    );
    expect(schemaExample(document, { format: "duration", pattern: "^P1$", type: "string" })).toBe("<duration value>");
    expect(
      schemaExample(document, {
        minimum: 10,
        pattern: "^a$",
        type: ["string", "number"],
      }),
    ).toBe("a");
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 1,
        propertyNames: { pattern: "^[a-z]{3}[0-9]+$", type: "string" },
        type: "object",
      }),
    ).toEqual({ aaa0: "example-aaa0" });
    expect(
      schemaExample(document, {
        additionalProperties: { type: "string" },
        minProperties: 1,
        propertyNames: { pattern: "^(ab|cd)$", type: "string" },
        type: "object",
      }),
    ).toEqual({ ab: "example-ab" });
    expect(
      schemaExample(document, {
        allOf: [
          { format: "date", type: "string" },
          { format: "password", type: "string" },
        ],
      }),
    ).toBe("2026-01-01");
    expect(
      schemaExample(document, {
        allOf: [
          {
            additionalProperties: false,
            properties: { a: { type: "integer" }, b: { type: "integer" } },
            type: "object",
          },
          {
            additionalProperties: false,
            properties: { b: { type: "integer" }, c: { type: "integer" } },
            required: ["b"],
            type: "object",
          },
        ],
      }),
    ).toEqual({ b: 1 });
    expect(
      schemaExample(document, {
        exclusiveMaximum: true,
        exclusiveMinimum: true,
        maximum: -0.5,
        minimum: -2,
        type: "integer",
      }),
    ).toBe(-1);
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

  test("keeps binary files in multipart unions", async () => {
    const source = structuredClone(document);
    const upload = getOperations(source).find((operation) => requestMedia(operation)?.[0] === "multipart/form-data");
    const media = upload && requestMedia(upload);
    expect(media).toBeDefined();
    if (!media) return;
    media[1].schema = {
      anyOf: [
        {
          properties: {
            assetType: {
              anyOf: [{ enum: ["datasets"] }, { anyOf: [{ const: "models" }, { enum: ["images"] }] }],
            },
            file: { description: "File", format: "binary", type: "string" },
          },
          required: ["assetType", "file"],
          type: "object",
        },
        {
          properties: {
            assetType: { anyOf: [{ enum: ["datasets"] }, { enum: ["models", "images"] }] },
            file: { type: "string", format: "binary", description: "File" },
            source: { type: "string" },
          },
          required: ["assetType", "source"],
          type: "object",
        },
      ],
    };
    const directory = await mkdtemp(join(tmpdir(), "openapi-multipart-union-"));
    try {
      await generatePython(source, config, directory);
      const uploads = await Bun.file(join(directory, "src/example_api/resources/uploads.py")).text();
      expect(uploads).toContain("body: dict[str, Any]");
      expect(uploads).toContain('files={key: body[key] for key in ["file"] if key in body}');
      expect(uploads).toContain('data={key: value for key, value in body.items() if key not in ["file"]}');
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
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

  test("types every successful response", async () => {
    const source = structuredClone(document);
    const operation = source.paths["/widgets"]?.post;
    expect(operation).toBeDefined();
    if (!operation) return;
    operation.responses = {
      "200": {
        description: "Accepted without a response body",
      },
      "201": {
        content: {
          "application/json": {
            schema: {
              properties: { status: { const: "ready", type: "string" } },
              required: ["status"],
              type: "object",
            },
          },
        },
        description: "Ready",
      },
      "202": {
        content: {
          "Application/JSON": {
            schema: {
              properties: { status: { const: "deploying", type: "string" } },
              required: ["status"],
              type: "object",
            },
          },
        },
        description: "Deploying",
      },
      "203": {
        content: {
          "application/hal+json": {
            schema: {
              description: "Same deploying response with annotation and different key order",
              required: ["status"],
              properties: { status: { type: "string", const: "deploying" } },
              type: "object",
            },
          },
        },
        description: "Deploying",
      },
    };
    const directory = await mkdtemp(join(tmpdir(), "openapi-success-responses-"));
    try {
      await generatePython(source, config, directory);
      const types = await Bun.file(join(directory, "src/example_api/types.py")).text();
      expect(types).toContain(
        'WidgetsCreateResponseVariant1 = TypedDict("WidgetsCreateResponseVariant1", {"status": Literal["ready"]})',
      );
      expect(types).toContain(
        'WidgetsCreateResponseVariant2 = TypedDict("WidgetsCreateResponseVariant2", {"status": Literal["deploying"]})',
      );
      expect(types).toContain(
        "WidgetsCreateResponseValue = WidgetsCreateResponseVariant1 | WidgetsCreateResponseVariant2",
      );
      expect(types).toContain("WidgetsCreateResponse = WidgetsCreateResponseValue | None");
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
  });

  test("preserves response fields and rejects only mixed parse modes", async () => {
    const source = structuredClone(document);
    const operation = source.paths["/widgets"]?.post;
    expect(operation).toBeDefined();
    if (!operation) return;
    operation.responses = {
      "200": {
        content: {
          "application/json": {
            schema: { properties: { id: { type: "string" } }, required: ["id"], type: "object" },
          },
        },
        description: "Created",
      },
      "202": {
        content: {
          "application/json": {
            schema: {
              properties: { id: { type: "string" }, description: { type: "string" } },
              required: ["id"],
              type: "object",
            },
          },
        },
        description: "Accepted",
      },
    };
    const directory = await mkdtemp(join(tmpdir(), "openapi-success-fields-"));
    try {
      await generatePython(source, config, directory);
      const types = await Bun.file(join(directory, "src/example_api/types.py")).text();
      expect(types).toContain('"description": NotRequired[str]');

      operation.responses = {
        "200": { content: { "text/plain": { schema: { type: "string" } } }, description: "Ready" },
        "202": { content: { "text/plain": {} }, description: "Accepted" },
      };
      await expect(generatePython(source, config, directory)).resolves.toBe(8);

      operation.responses["202"] = {
        content: { "application/json": { schema: { type: "object" } } },
        description: "Accepted",
      };
      await expect(generatePython(source, config, directory)).rejects.toThrow(
        "Unsupported mixed successful response media: POST /widgets",
      );

      operation.responses["202"] = {
        content: { "application/octet-stream": {} },
        description: "Accepted",
      };
      await expect(generatePython(source, config, directory)).rejects.toThrow(
        "Unsupported mixed successful response media: POST /widgets",
      );
    } finally {
      await rm(directory, { force: true, recursive: true });
    }
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
