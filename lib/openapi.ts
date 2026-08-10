// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

export type HttpMethod = "delete" | "get" | "head" | "options" | "patch" | "post" | "put" | "trace";

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
  required?: string[];
  title?: string;
  type?: string | string[];
}

export interface Parameter {
  description?: string;
  in: "cookie" | "header" | "path" | "query";
  name: string;
  required?: boolean;
  schema?: JsonSchema;
}

interface ParameterReference {
  $ref: string;
}

type ParameterInput = Parameter | ParameterReference;

export interface MediaType {
  example?: unknown;
  schema?: JsonSchema;
}

export interface OperationObject {
  description?: string;
  operationId?: string;
  parameters?: ParameterInput[];
  requestBody?: {
    content?: Record<string, MediaType>;
    required?: boolean;
  };
  responses?: Record<
    string,
    {
      content?: Record<string, MediaType>;
      description?: string;
    }
  >;
  security?: Array<Record<string, string[]>>;
  summary?: string;
  tags?: string[];
}

export interface OpenApiDocument {
  components?: {
    schemas?: Record<string, JsonSchema>;
    parameters?: Record<string, Parameter>;
    securitySchemes?: Record<
      string,
      { in?: "cookie" | "header" | "query"; name?: string; scheme?: string; type?: string }
    >;
  };
  info: {
    description?: string;
    title: string;
    version: string;
  };
  openapi: string;
  paths: Record<string, Partial<Record<HttpMethod, OperationObject>> & { parameters?: ParameterInput[] }>;
  security?: Array<Record<string, string[]>>;
  servers?: Array<{
    description?: string;
    url: string;
    variables?: Record<string, { default: string; description?: string; enum?: string[] }>;
  }>;
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
  return PYTHON_RESERVED.has(name) ? `${name}_` : name || "value";
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
        tag,
      };
      const used = names.get(resource) ?? new Set<string>();
      let name = sdkMethod(base);
      if (used.has(name)) name = `${name}_${summarySdkName(base).replace(/^(get|list|create|update|delete)_/, "")}`;
      used.add(name);
      names.set(resource, used);
      operations.push({
        ...operation,
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

function resolveParameter(document: OpenApiDocument, input: ParameterInput): Parameter {
  if (!("$ref" in input) || !input.$ref.startsWith("#/components/parameters/")) return input as Parameter;
  const name = decodeURIComponent(input.$ref.slice("#/components/parameters/".length));
  const parameter = document.components?.parameters?.[name];
  if (!parameter) throw new Error(`Unknown parameter reference: ${input.$ref}`);
  return parameter;
}

export function resolveServerUrl(document: OpenApiDocument, origin = "http://localhost:3000"): string {
  const server = document.servers?.[0];
  const expanded = server
    ? server.url.replace(/{([^}]+)}/g, (_, name: string) => server.variables?.[name]?.default ?? `{${name}}`)
    : origin;
  return new URL(expanded, origin).toString().replace(/\/$/, "");
}

export function getAuthentication(document: OpenApiDocument): ApiAuthentication | undefined {
  const schemes = Object.values(document.components?.securitySchemes ?? {});
  const scheme = schemes.find(
    (value) =>
      (value.type === "apiKey" && value.in === "header" && value.name) ||
      (value.type === "http" && value.scheme?.toLowerCase() === "bearer"),
  );
  if (scheme?.type === "apiKey" && scheme.in === "header" && scheme.name) return { header: scheme.name, prefix: "" };
  if (scheme?.type === "http" && scheme.scheme?.toLowerCase() === "bearer") {
    return { header: "Authorization", prefix: "Bearer " };
  }
  return undefined;
}

export function resolveSchema(document: OpenApiDocument, schema: JsonSchema | undefined): JsonSchema | undefined {
  if (!schema?.$ref?.startsWith("#/components/schemas/")) return schema;
  const name = decodeURIComponent(schema.$ref.slice("#/components/schemas/".length));
  return document.components?.schemas?.[name];
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
  const properties: Record<string, JsonSchema> = {};
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
  if (schema.enum?.length) return schema.enum[0];

  const union = schema.oneOf ?? schema.anyOf;
  if (union?.length) return schemaExample(document, union[0], depth + 1);
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
  return Object.entries(operation.requestBody?.content ?? {})[0];
}

export function successMedia(operation: ApiOperation): [string, MediaType] | undefined {
  const response = Object.entries(operation.responses ?? {}).find(([status]) => /^2\d\d$/.test(status))?.[1];
  return response ? Object.entries(response.content ?? {})[0] : undefined;
}
