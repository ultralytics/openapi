// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

type HttpMethod = "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

export interface JsonSchema {
  $ref?: string;
  additionalProperties?: boolean | JsonSchema;
  allOf?: JsonSchema[];
  anyOf?: JsonSchema[];
  const?: unknown;
  default?: unknown;
  description?: string;
  enum?: unknown[];
  example?: unknown;
  format?: string;
  items?: JsonSchema;
  nullable?: boolean;
  oneOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  propertyNames?: JsonSchema;
  readOnly?: boolean;
  required?: string[];
  title?: string;
  type?: string | string[];
  writeOnly?: boolean;
}

export interface Parameter {
  allowReserved?: boolean;
  content?: Record<string, MediaType>;
  description?: string;
  explode?: boolean;
  in: "cookie" | "header" | "path" | "query";
  name: string;
  required?: boolean;
  schema?: JsonSchema;
  style?: string;
}

interface ParameterReference {
  $ref: string;
}

type ParameterInput = Parameter | ParameterReference;

interface ReferenceObject {
  $ref: string;
}

interface RequestBodyObject {
  content?: Record<string, MediaType>;
  required?: boolean;
}

interface ResponseObject {
  content?: Record<string, MediaType>;
  description?: string;
}

export interface OpenApiServer {
  description?: string;
  url: string;
  variables?: Record<string, { default: string; description?: string; enum?: string[] }>;
}

export interface MediaType {
  encoding?: Record<string, unknown>;
  example?: unknown;
  schema?: JsonSchema;
}

interface OperationObject {
  description?: string;
  operationId?: string;
  parameters?: ParameterInput[];
  requestBody?: ReferenceObject | RequestBodyObject;
  responses?: Record<string, ReferenceObject | ResponseObject>;
  security?: Array<Record<string, string[]>>;
  servers?: OpenApiServer[];
  summary?: string;
  tags?: string[];
  "x-codeSamples"?: Array<{ label: string; lang: string; source: string }>;
}

export interface OpenApiDocument {
  components?: {
    schemas?: Record<string, JsonSchema>;
    parameters?: Record<string, Parameter>;
    requestBodies?: Record<string, RequestBodyObject>;
    responses?: Record<string, ResponseObject>;
    securitySchemes?: Record<
      string,
      { description?: string; in?: "cookie" | "header" | "query"; name?: string; scheme?: string; type?: string }
    >;
  };
  info: {
    description?: string;
    title: string;
    version: string;
  };
  externalDocs?: { description?: string; url: string };
  openapi: string;
  paths: Record<
    string,
    Partial<Record<HttpMethod, OperationObject>> & { parameters?: ParameterInput[]; servers?: OpenApiServer[] }
  >;
  security?: Array<Record<string, string[]>>;
  servers?: OpenApiServer[];
  tags?: Array<{ description?: string; name: string }>;
}

export interface ApiAuthentication {
  header: string;
  prefix: string;
}

export interface ApiOperation extends OperationObject {
  id: string;
  method: HttpMethod;
  path: string;
  resource: string;
  sdkMethod: string;
  tag: string;
  parameters?: Parameter[];
  requestBody?: RequestBodyObject;
  responses?: Record<string, ResponseObject>;
  server?: OpenApiServer;
}

export interface PythonCodeSampleConfig {
  client: string;
  environment: string;
  package: string;
}

const HTTP_METHODS = new Set<HttpMethod>(["delete", "get", "head", "options", "patch", "post", "put", "trace"]);

const PYTHON_RESERVED = new Set([
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "false",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "none",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "true",
  "try",
  "while",
  "with",
  "yield",
]);

export function sdkIdentifier(value: string): string {
  const name = value
    .replace(/[’']s\b/g, "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
  const identifier = name || "value";
  return PYTHON_RESERVED.has(identifier)
    ? `${identifier}_`
    : /^[a-z_]/.test(identifier)
      ? identifier
      : `_${identifier}`;
}

export function allocateSdkIdentifiers(values: Array<{ location: string; name: string }>): string[] {
  const used = new Set(["self"]);
  return values.map(({ location, name: wireName }) => {
    const base = sdkIdentifier(wireName);
    let name = base;
    if (used.has(name)) name = `${base}_${location}`;
    for (let index = 2; used.has(name); index += 1) name = `${base}_${index}`;
    used.add(name);
    return name;
  });
}

export function serializeSimplePath(value: unknown, explode = false, allowReserved = false): string {
  const encode = (item: unknown) => {
    const encoded = encodeURIComponent(String(item));
    return allowReserved
      ? encoded.replace(/%(3A|2F|3F|23|5B|5D|40|21|24|26|27|28|29|2A|2B|2C|3B|3D)/gi, (match) =>
          decodeURIComponent(match),
        )
      : encoded;
  };
  if (Array.isArray(value)) return value.map(encode).join(",");
  if (value && typeof value === "object") {
    return Object.entries(value)
      .flatMap(([key, item]) => (explode ? `${encode(key)}=${encode(item)}` : [encode(key), encode(item)]))
      .join(",");
  }
  return encode(value);
}

export function serializeQueryParameter(
  name: string,
  value: unknown,
  style = "form",
  explode = true,
  allowReserved = false,
): string {
  const encode = (item: unknown, reserved = false) => {
    const encoded = encodeURIComponent(String(item));
    return reserved
      ? encoded.replace(/%(3A|2F|3F|23|5B|5D|40|21|24|26|27|28|29|2A|2B|2C|3B|3D)/gi, (match) =>
          decodeURIComponent(match),
        )
      : encoded;
  };
  const pair = (key: unknown, item: unknown) => `${encode(key)}=${encode(item, allowReserved)}`;
  if (Array.isArray(value)) {
    if (style === "form" && explode) return value.map((item) => pair(name, item)).join("&");
    const separator = style === "spaceDelimited" ? " " : style === "pipeDelimited" ? "|" : ",";
    return pair(name, value.join(separator));
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value);
    if (style === "deepObject") return entries.map(([key, item]) => pair(`${name}[${key}]`, item)).join("&");
    if (explode) return entries.map(([key, item]) => pair(key, item)).join("&");
    return pair(name, entries.flat().join(","));
  }
  return pair(name, value);
}

function singular(value: string): string {
  return value.endsWith("ies") ? `${value.slice(0, -3)}y` : value.endsWith("s") ? value.slice(0, -1) : value;
}

function summarySdkName(operation: OperationObject & { id: string; method: HttpMethod; tag: string }): string {
  const words = sdkIdentifier(operation.summary ?? operation.id).split("_");
  const sourceVerb = words.shift() ?? operation.method;
  const verb =
    sourceVerb === "get" || sourceVerb === "check" || sourceVerb === "download" || sourceVerb === "summarize"
      ? "retrieve"
      : sourceVerb === "view"
        ? words.some((word) => word === "history" || word.endsWith("s"))
          ? "list"
          : "retrieve"
        : sourceVerb;
  const ignored = new Set(["a", "an", "new", "someone", "the", "to", "your"]);
  const resource = singular(sdkIdentifier(operation.tag));
  return sdkIdentifier([verb, ...words.filter((word) => !ignored.has(word) && singular(word) !== resource)].join("_"));
}

function sdkMethod(operation: OperationObject & { id: string; method: HttpMethod; path: string; tag: string }): string {
  const segments = operation.path.split("/").filter(Boolean).slice(1);
  if (
    singular(sdkIdentifier(segments[0] ?? "")) !== singular(sdkIdentifier(operation.tag)) ||
    (operation.method === "post" && /^get\b/i.test(operation.summary ?? ""))
  ) {
    return summarySdkName(operation);
  }
  const hasId = segments.some((part) => part.startsWith("{"));
  const suffix = segments.slice(1).filter((part) => !part.startsWith("{"));
  const base =
    operation.method === "get"
      ? /^(list|view)\b/i.test(operation.summary ?? "")
        ? "list"
        : hasId || suffix.length
          ? "retrieve"
          : "list"
      : operation.method === "post"
        ? "create"
        : operation.method === "put" || operation.method === "patch"
          ? "update"
          : operation.method === "delete"
            ? "delete"
            : operation.method;
  if (!suffix.length) return base;
  const action = suffix.at(-1) ?? "";
  if (
    operation.method === "post" &&
    new Set([
      "archive",
      "cancel",
      "check",
      "clone",
      "complete",
      "create",
      "delete",
      "empty",
      "ingest",
      "merge",
      "predict",
      "redistribute",
      "restore",
      "revoke",
      "start",
      "stop",
      "track-download",
      "transfer-ownership",
    ]).has(action)
  ) {
    return sdkIdentifier([action, ...suffix.slice(0, -1)].join("_"));
  }
  return sdkIdentifier([base, ...suffix].join("_"));
}

export function getOperations(document: OpenApiDocument): ApiOperation[] {
  const operations: ApiOperation[] = [];
  const names = new Map<string, Set<string>>();

  for (const [path, pathItem] of Object.entries(document.paths)) {
    const inherited = (pathItem.parameters ?? []).map((parameter) => resolveParameter(document, parameter));
    for (const [method, value] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method as HttpMethod) || !value) continue;
      const operation = value as OperationObject;
      const typedMethod = method as HttpMethod;
      const tag = operation.tags?.[0] ?? "Other";
      const resource = sdkIdentifier(tag);
      const parameters = [...inherited];
      for (const parameter of (operation.parameters ?? []).map((item) => resolveParameter(document, item))) {
        const index = parameters.findIndex((item) => item.in === parameter.in && item.name === parameter.name);
        if (index === -1) parameters.push(parameter);
        else parameters[index] = parameter;
      }
      const base = {
        ...operation,
        id: operation.operationId ?? `${typedMethod}-${path}`,
        method: typedMethod,
        path,
        parameters,
        requestBody: resolveRequestBody(document, operation.requestBody),
        responses: Object.fromEntries(
          Object.entries(operation.responses ?? {}).map(([status, response]) => [
            status,
            resolveResponse(document, response),
          ]),
        ),
        server: operation.servers?.[0] ?? pathItem.servers?.[0] ?? document.servers?.[0],
        tag,
      };
      const used = names.get(resource) ?? new Set<string>();
      let name = sdkMethod(base);
      if (used.has(name)) {
        name = `${name}_${summarySdkName(base).replace(/^(get|list|create|update|delete)_/, "")}`;
        const candidate = name;
        for (let index = 2; used.has(name); index += 1) name = `${candidate}_${index}`;
      }
      used.add(name);
      names.set(resource, used);
      operations.push({
        ...base,
        id: base.id,
        method: typedMethod,
        path,
        parameters,
        resource,
        sdkMethod: name,
        tag,
      });
    }
  }

  return operations;
}

function pythonLiteral(value: unknown): string {
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  if (Array.isArray(value)) return `[${value.map(pythonLiteral).join(", ")}]`;
  if (typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .map(([key, item]) => `${JSON.stringify(key)}: ${pythonLiteral(item)}`)
      .join(", ")}}`;
  }
  return JSON.stringify(value);
}

export function pythonCodeSample(
  document: OpenApiDocument,
  operation: ApiOperation,
  config: PythonCodeSampleConfig,
  bodyValue?: unknown,
): string {
  const request = requestMedia(operation);
  const bodySchema = objectSchema(document, request?.[1].schema);
  const bodyProperties = Object.fromEntries(
    Object.entries(bodySchema?.properties ?? {}).filter(([, schema]) => !resolveSchema(document, schema)?.readOnly),
  );
  const bodyValues =
    bodyValue && typeof bodyValue === "object" && !Array.isArray(bodyValue)
      ? (bodyValue as Record<string, unknown>)
      : {};
  const arguments_ = [
    ...(operation.parameters ?? [])
      .filter((parameter) => parameter.required)
      .map((parameter) => ({
        location: parameter.in,
        name: parameter.name,
        value: schemaExample(document, parameter.schema),
      })),
    ...(bodySchema?.required ?? [])
      .filter((name) => bodyProperties[name])
      .map((name) => ({
        location: "body",
        name,
        value: bodyValues[name] ?? schemaExample(document, bodyProperties[name]),
      })),
    ...(!bodySchema?.properties && request?.[1].schema && operation.requestBody?.required
      ? [{ location: "body", name: "body", value: bodyValue ?? schemaExample(document, request[1].schema) }]
      : []),
  ];
  const names = allocateSdkIdentifiers(arguments_);
  const values = arguments_.map((argument, index) => `${names[index]}=${pythonLiteral(argument.value)}`);
  return [
    `from ${config.package} import ${config.client}`,
    "",
    `client = ${config.client}()  # Reads ${config.environment}`,
    values.length
      ? `response = client.${operation.resource}.${operation.sdkMethod}(\n${values.map((value) => `    ${value},`).join("\n")}\n)`
      : `response = client.${operation.resource}.${operation.sdkMethod}()`,
    "print(response)",
  ].join("\n");
}

export function addPythonCodeSamples(document: OpenApiDocument, config: PythonCodeSampleConfig): OpenApiDocument {
  for (const operation of getOperations(document)) {
    const target = document.paths[operation.path][operation.method];
    if (!target) continue;
    target["x-codeSamples"] = [
      ...(target["x-codeSamples"] ?? []).filter((sample) => sample.label !== "Python SDK"),
      { label: "Python SDK", lang: "Python", source: pythonCodeSample(document, operation, config) },
    ];
  }
  return document;
}

function componentName(reference: string, section: string): string {
  const prefix = `#/components/${section}/`;
  if (!reference.startsWith(prefix)) throw new Error(`Unsupported reference: ${reference}`);
  return decodeURIComponent(reference.slice(prefix.length));
}

function resolveRequestBody(
  document: OpenApiDocument,
  input: OperationObject["requestBody"],
): RequestBodyObject | undefined {
  if (!input || !("$ref" in input)) return input;
  const body = document.components?.requestBodies?.[componentName(input.$ref, "requestBodies")];
  if (!body) throw new Error(`Unknown request body reference: ${input.$ref}`);
  return body;
}

function resolveResponse(document: OpenApiDocument, input: ReferenceObject | ResponseObject): ResponseObject {
  if (!("$ref" in input)) return input;
  const response = document.components?.responses?.[componentName(input.$ref, "responses")];
  if (!response) throw new Error(`Unknown response reference: ${input.$ref}`);
  return response;
}

function resolveParameter(document: OpenApiDocument, input: ParameterInput): Parameter {
  let parameter: Parameter;
  if (!("$ref" in input) || !input.$ref.startsWith("#/components/parameters/")) parameter = input as Parameter;
  else {
    const name = decodeURIComponent(input.$ref.slice("#/components/parameters/".length));
    const resolved = document.components?.parameters?.[name];
    if (!resolved) throw new Error(`Unknown parameter reference: ${input.$ref}`);
    parameter = resolved;
  }
  if (parameter.content) throw new Error(`Unsupported content parameter: ${parameter.in} ${parameter.name}`);
  return parameter;
}

export function resolveServerUrl(
  document: OpenApiDocument,
  origin = "http://localhost:3000",
  operation?: ApiOperation,
): string {
  const server = operation?.server ?? document.servers?.[0];
  const expanded = server ? expandServerUrl(server) : origin;
  return new URL(expanded, origin).toString().replace(/\/$/, "");
}

export function expandServerUrl(server: OpenApiServer): string {
  return server.url.replace(/{([^}]+)}/g, (_, name: string) => server.variables?.[name]?.default ?? `{${name}}`);
}

export function getAuthentication(document: OpenApiDocument, operation?: ApiOperation): ApiAuthentication | undefined {
  const requirements = operation
    ? (operation.security ?? document.security ?? [])
    : getOperations(document).flatMap((item) => item.security ?? document.security ?? []);
  const names = new Set(requirements.flatMap((requirement) => Object.keys(requirement)));
  const authentications = [...names].flatMap((name) => {
    const scheme = document.components?.securitySchemes?.[name];
    if (scheme?.type === "apiKey" && scheme.in === "header" && scheme.name) {
      return [{ header: scheme.name, prefix: "" }];
    }
    if (scheme?.type === "http" && scheme.scheme?.toLowerCase() === "bearer") {
      return [{ header: "Authorization", prefix: "Bearer " }];
    }
    return [];
  });
  if (authentications.length !== names.size) throw new Error("Unsupported authentication scheme");
  const unique = [...new Map(authentications.map((item) => [`${item.header}:${item.prefix}`, item])).values()];
  if (unique.length > 1) throw new Error("Multiple authentication schemes require separate generated clients");
  return unique[0];
}

export function resolveSchema(
  document: OpenApiDocument,
  schema: JsonSchema | undefined,
  seen = new Set<string>(),
): JsonSchema | undefined {
  if (!schema?.$ref?.startsWith("#/components/schemas/")) return schema;
  const name = decodeURIComponent(schema.$ref.slice("#/components/schemas/".length));
  if (seen.has(name)) return schema;
  const target = document.components?.schemas?.[name];
  if (!target) return schema;
  const resolved = resolveSchema(document, target, new Set([...seen, name]));
  const siblings = { ...schema };
  delete siblings.$ref;
  return {
    ...resolved,
    ...siblings,
    properties:
      resolved?.properties || siblings.properties ? { ...resolved?.properties, ...siblings.properties } : undefined,
    required:
      resolved?.required || siblings.required
        ? [...new Set([...(resolved?.required ?? []), ...(siblings.required ?? [])])]
        : undefined,
  };
}

export function objectSchema(document: OpenApiDocument, input: JsonSchema | undefined): JsonSchema | undefined {
  const schema = resolveSchema(document, input);
  if (!schema) return undefined;
  if (schema.allOf?.length) {
    const objects = schema.allOf.map((item) => objectSchema(document, item)).filter((item) => item?.properties);
    if (objects.length) {
      return {
        ...schema,
        properties: Object.assign({}, schema.properties, ...objects.map((item) => item?.properties)),
        required: [...new Set([...(schema.required ?? []), ...objects.flatMap((item) => item?.required ?? [])])],
        type: "object",
      };
    }
  }
  const variants = schema.anyOf ?? schema.oneOf;
  if (!variants?.length) return schema;
  const objects = variants.map((item) => objectSchema(document, item)).filter((item) => item?.properties);
  if (!objects.length) return schema;
  const required = new Set(objects[0]?.required ?? []);
  for (const item of objects.slice(1)) {
    const names = new Set(item?.required ?? []);
    for (const name of required) if (!names.has(name)) required.delete(name);
  }
  for (const name of schema.required ?? []) required.add(name);
  const properties: Record<string, JsonSchema> = { ...schema.properties };
  for (const object of objects) {
    for (const [name, property] of Object.entries(object?.properties ?? {})) {
      const current = properties[name];
      properties[name] =
        current && JSON.stringify(current) !== JSON.stringify(property)
          ? {
              anyOf: [...(current.anyOf ?? [current]), property],
              description: current.description ?? property.description,
            }
          : property;
    }
  }
  return {
    ...schema,
    properties,
    required: [...required],
    type: "object",
  };
}

export function schemaExample(document: OpenApiDocument, input: JsonSchema | undefined, depth = 0): unknown {
  if (!input || depth > 5) return null;
  const schema = resolveSchema(document, input) ?? input;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;
  if (schema.enum?.length) return schema.enum[0];

  const union = schema.oneOf ?? schema.anyOf;
  if (union?.length) {
    const selected = schemaExample(document, union[0], depth + 1);
    if (selected && typeof selected === "object" && !Array.isArray(selected) && schema.properties) {
      const siblings = schemaExample(document, { ...schema, anyOf: undefined, oneOf: undefined }, depth + 1);
      if (siblings && typeof siblings === "object" && !Array.isArray(siblings)) return { ...siblings, ...selected };
    }
    return selected;
  }
  if (schema.allOf?.length) {
    const object = objectSchema(document, schema);
    if (object?.properties) return schemaExample(document, { ...object, allOf: undefined }, depth + 1);
  }

  const type = Array.isArray(schema.type) ? schema.type.find((value) => value !== "null") : schema.type;
  if (type === "array") return [schemaExample(document, schema.items, depth + 1)];
  if (type === "boolean") return false;
  if (type === "integer" || type === "number") return 0;
  if (type === "object" || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([name, property]) => [
        name,
        schemaExample(document, property, depth + 1),
      ]),
    );
  }
  return schema.format === "date-time" ? "2026-01-01T00:00:00Z" : "string";
}

export function schemaLabel(document: OpenApiDocument, input: JsonSchema | undefined): string {
  if (!input) return "any";
  const schema = resolveSchema(document, input) ?? input;
  if (input.$ref) return input.$ref.split("/").at(-1) ?? "object";
  if (schema.enum) return schema.enum.map(String).join(" | ");
  if (schema.oneOf || schema.anyOf)
    return (schema.oneOf ?? schema.anyOf ?? []).map((item) => schemaLabel(document, item)).join(" | ");
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array") return `${schemaLabel(document, schema.items)}[]`;
  return schema.type ?? (schema.properties ? "object" : "any");
}

export function requestMedia(operation: ApiOperation): [string, MediaType] | undefined {
  return preferredMedia(operation.requestBody?.content);
}

export function successMedia(operation: ApiOperation): [string, MediaType] | undefined {
  const responses = Object.entries(operation.responses ?? {});
  const response =
    responses.find(([status]) => /^2\d\d$/.test(status))?.[1] ??
    responses.find(([status]) => /^2xx$/i.test(status))?.[1];
  return response ? preferredMedia(response.content) : undefined;
}

function preferredMedia(content: Record<string, MediaType> | undefined): [string, MediaType] | undefined {
  const media = Object.entries(content ?? {}).map(
    ([type, value]) => [type.toLowerCase(), value] as [string, MediaType],
  );
  return (
    media.find(([type]) => type === "application/json") ??
    media.find(([type]) => type.endsWith("+json")) ??
    media.find(([type]) => ["multipart/form-data", "application/x-www-form-urlencoded"].includes(type)) ??
    media.find(([type]) => type.startsWith("text/")) ??
    media[0]
  );
}
