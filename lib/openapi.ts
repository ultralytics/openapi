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
  exclusiveMaximum?: boolean | number;
  exclusiveMinimum?: boolean | number;
  format?: string;
  items?: JsonSchema;
  maxItems?: number;
  maxLength?: number;
  maximum?: number;
  minItems?: number;
  minLength?: number;
  minimum?: number;
  multipleOf?: number;
  nullable?: boolean;
  oneOf?: JsonSchema[];
  properties?: Record<string, JsonSchema>;
  propertyNames?: JsonSchema;
  pattern?: string;
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

export type ApiAuthenticationMode = "none" | "optional" | "required";

export interface SchemaField {
  depth: number;
  description?: string;
  name: string;
  required: boolean;
  schema: JsonSchema;
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

export interface SdkArgument {
  allowReserved?: boolean;
  description: string;
  explode?: boolean;
  location: "body" | Parameter["in"];
  name: string;
  pythonName: string;
  required: boolean;
  schema: JsonSchema;
  style?: string;
  wholeBody?: boolean;
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

export function sdkArguments(document: OpenApiDocument, operation: ApiOperation): SdkArgument[] {
  const parameters: SdkArgument[] = (operation.parameters ?? []).map((parameter) => ({
    allowReserved: parameter.allowReserved,
    description: parameter.description ?? `${parameter.name} ${parameter.in} parameter.`,
    explode: parameter.explode,
    location: parameter.in,
    name: parameter.name,
    pythonName: sdkIdentifier(parameter.name),
    required: parameter.in === "path" || parameter.required === true,
    schema: parameter.schema ?? {},
    style: parameter.style,
  }));
  const media = requestMedia(operation);
  const structured =
    media?.[0] === "application/json" ||
    media?.[0].endsWith("+json") ||
    ["application/x-www-form-urlencoded", "multipart/form-data"].includes(media?.[0] ?? "");
  const body = structured ? objectSchema(document, media?.[1].schema) : undefined;
  if (body?.properties) {
    for (const [name, schema] of Object.entries(body.properties)) {
      const property = resolveSchema(document, schema) ?? schema;
      if (property.readOnly) continue;
      parameters.push({
        description: property.description ?? `${name} request value.`,
        location: "body",
        name,
        pythonName: sdkIdentifier(name),
        required: body.required?.includes(name) ?? false,
        schema: property,
      });
    }
  } else if (media) {
    parameters.push({
      description: media[1].schema?.description ?? "Request body.",
      location: "body",
      name: "body",
      pythonName: "body",
      required: operation.requestBody?.required ?? false,
      schema: media[1].schema ?? {},
      wholeBody: true,
    });
  }
  const names = allocateSdkIdentifiers(parameters);
  parameters.forEach((parameter, index) => {
    parameter.pythonName = names[index] ?? parameter.pythonName;
  });
  return parameters;
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
  const exampleBody =
    bodyValue !== undefined
      ? bodyValue
      : request?.[1].example !== undefined
        ? request[1].example
        : schemaExample(document, request?.[1].schema);
  const bodyValues =
    exampleBody && typeof exampleBody === "object" && !Array.isArray(exampleBody)
      ? (exampleBody as Record<string, unknown>)
      : {};
  const values = sdkArguments(document, operation)
    .filter((argument) => argument.required)
    .map((argument) => {
      const value =
        argument.location !== "body"
          ? schemaExample(document, argument.schema)
          : argument.wholeBody
            ? exampleBody
            : bodyValues[argument.name] !== undefined
              ? bodyValues[argument.name]
              : schemaExample(document, argument.schema);
      return `${argument.pythonName}=${pythonLiteral(value)}`;
    });
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

export function getAuthenticationMode(document: OpenApiDocument, operation: ApiOperation): ApiAuthenticationMode {
  const requirements = operation.security ?? document.security ?? [];
  if (!getAuthentication(document, operation)) return "none";
  return requirements.some((requirement) => Object.keys(requirement).length === 0) ? "optional" : "required";
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
  if (!input || depth > 8) return null;
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
  if (type === "integer" || type === "number") {
    const multiple = schema.multipleOf && schema.multipleOf > 0 ? schema.multipleOf : undefined;
    const step = multiple ?? 1;
    const minimum = typeof schema.exclusiveMinimum === "number" ? schema.exclusiveMinimum : schema.minimum;
    const maximum = typeof schema.exclusiveMaximum === "number" ? schema.exclusiveMaximum : schema.maximum;
    const minimumExclusive = typeof schema.exclusiveMinimum === "number" || schema.exclusiveMinimum === true;
    const maximumExclusive = typeof schema.exclusiveMaximum === "number" || schema.exclusiveMaximum === true;
    let value = minimum ?? 1;
    if (minimumExclusive) value += step;
    if (type === "integer") value = Math.ceil(value);
    if (multiple) value = Math.ceil(value / multiple) * multiple;
    if (maximum !== undefined && (value > maximum || (maximumExclusive && value >= maximum))) {
      value = maximum - (maximumExclusive ? step : 0);
      if (type === "integer") value = Math.floor(value);
      if (multiple) value = Math.floor(value / multiple) * multiple;
    }
    return value;
  }
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
  if (schema.oneOf || schema.anyOf)
    return (schema.oneOf ?? schema.anyOf ?? []).map((item) => schemaLabel(document, item)).join(" | ");
  if (Array.isArray(schema.type)) return schema.type.join(" | ");
  if (schema.type === "array") return `${schemaLabel(document, schema.items)}[]`;
  return schema.type ?? (schema.properties ? "object" : "any");
}

export function schemaConstraints(document: OpenApiDocument, input: JsonSchema | undefined, depth = 0): string[] {
  if (depth > 8) return [];
  const schema = resolveSchema(document, input);
  if (!schema) return [];
  const constraints: string[] = [];
  if (schema.enum?.length) constraints.push(`values: ${schema.enum.map(String).join(", ")}`);
  if (typeof schema.exclusiveMinimum === "number") constraints.push(`greater than ${schema.exclusiveMinimum}`);
  else if (schema.minimum !== undefined)
    constraints.push(`${schema.exclusiveMinimum ? "greater than" : "minimum"} ${schema.minimum}`);
  if (typeof schema.exclusiveMaximum === "number") constraints.push(`less than ${schema.exclusiveMaximum}`);
  else if (schema.maximum !== undefined)
    constraints.push(`${schema.exclusiveMaximum ? "less than" : "maximum"} ${schema.maximum}`);
  if (schema.minLength !== undefined) constraints.push(`minimum length ${schema.minLength}`);
  if (schema.maxLength !== undefined) constraints.push(`maximum length ${schema.maxLength}`);
  if (schema.minItems !== undefined) constraints.push(`minimum items ${schema.minItems}`);
  if (schema.maxItems !== undefined) constraints.push(`maximum items ${schema.maxItems}`);
  if (schema.multipleOf !== undefined) constraints.push(`multiple of ${schema.multipleOf}`);
  if (schema.pattern) constraints.push(`pattern ${schema.pattern}`);
  if (schema.default !== undefined) constraints.push(`default ${String(schema.default)}`);
  const nested = [
    ...(schema.oneOf ?? schema.anyOf ?? []),
    ...(schema.type === "array" && schema.items ? [schema.items] : []),
  ];
  return [...new Set([...constraints, ...nested.flatMap((item) => schemaConstraints(document, item, depth + 1))])];
}

export function schemaFields(
  document: OpenApiDocument,
  input: JsonSchema | undefined,
  direction: "request" | "response",
  depth = 0,
  prefix = "",
  references = new Set<string>(),
): SchemaField[] {
  if (!input || depth > 4 || (input.$ref && references.has(input.$ref))) return [];
  const seen = input.$ref ? new Set([...references, input.$ref]) : references;
  const schema = resolveSchema(document, input);
  const item = Array.isArray(schema?.type)
    ? schema.type.includes("array")
      ? schema.items
      : schema
    : schema?.type === "array"
      ? schema.items
      : schema;
  const object = objectSchema(document, item);
  const required = new Set(object?.required ?? []);
  return Object.entries(object?.properties ?? {}).flatMap(([name, field]) => {
    const resolved = resolveSchema(document, field);
    if ((direction === "request" && resolved?.readOnly) || (direction === "response" && resolved?.writeOnly)) return [];
    const fieldName = `${prefix}${name}${resolved?.type === "array" ? "[]" : ""}`;
    return [
      { depth, description: resolved?.description, name: fieldName, required: required.has(name), schema: field },
      ...schemaFields(document, field, direction, depth + 1, `${fieldName}.`, seen),
    ];
  });
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

export function requestBodyExample(document: OpenApiDocument, operation: ApiOperation): string {
  const request = requestMedia(operation);
  if (!request) return "";
  let example = request[1].example !== undefined ? request[1].example : schemaExample(document, request[1].schema);
  const schema = objectSchema(document, request[1].schema);
  if (example && typeof example === "object" && !Array.isArray(example)) {
    example = { ...example };
    for (const [name, property] of Object.entries(schema?.properties ?? {})) {
      if (resolveSchema(document, property)?.readOnly) delete (example as Record<string, unknown>)[name];
    }
  }
  return request[0].startsWith("text/") && typeof example === "string" ? example : JSON.stringify(example, null, 2);
}

export function parameterValue(document: OpenApiDocument, parameter: Parameter, value: string): unknown {
  const schema = resolveSchema(document, parameter.schema);
  const type = Array.isArray(schema?.type) ? schema.type.find((item) => item !== "null") : schema?.type;
  if (type !== "array" && type !== "object" && !schema?.properties) return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Enter valid JSON for ${parameter.name}.`);
  }
}

export function formEntries(values: Record<string, unknown>): Array<[string, unknown]> {
  return Object.entries(values).flatMap(([name, value]) => {
    if (Array.isArray(value)) return value.map((item) => [name, item] as [string, unknown]);
    if (value && typeof value === "object") return Object.entries(value as Record<string, unknown>);
    return [[name, value]];
  });
}

function shellQuote(value: unknown): string {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

export function curlCodeSample(
  document: OpenApiDocument,
  operation: ApiOperation,
  {
    apiKey = "YOUR_API_KEY",
    body = "",
    environment,
    files = {},
    origin,
    values = {},
  }: {
    apiKey?: string;
    body?: string;
    environment?: string;
    files?: Record<string, File>;
    origin: string;
    values?: Record<string, string>;
  },
): string {
  const parameterValueOrExample = (parameter: Parameter) => {
    const value = values[`${parameter.in}:${parameter.name}`];
    if (!value) return schemaExample(document, parameter.schema);
    try {
      return parameterValue(document, parameter, value);
    } catch {
      return value;
    }
  };
  let path = operation.path;
  for (const parameter of (operation.parameters ?? []).filter((item) => item.in === "path")) {
    path = path.replace(
      `{${parameter.name}}`,
      serializeSimplePath(parameterValueOrExample(parameter), parameter.explode, parameter.allowReserved),
    );
  }
  const query = (operation.parameters ?? [])
    .filter((parameter) => parameter.in === "query" && (parameter.required || values[`query:${parameter.name}`]))
    .map((parameter) =>
      serializeQueryParameter(
        parameter.name,
        parameterValueOrExample(parameter),
        parameter.style,
        parameter.explode,
        parameter.allowReserved,
      ),
    )
    .join("&");
  const baseUrl = resolveServerUrl(document, origin, operation);
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}${query ? `?${query}` : ""}`;
  const request = requestMedia(operation);
  const authentication = getAuthentication(document, operation);
  const requestSchema = objectSchema(document, request?.[1].schema);
  const properties = Object.fromEntries(
    Object.entries(requestSchema?.properties ?? {}).filter(([, schema]) => !resolveSchema(document, schema)?.readOnly),
  );
  let bodyValues: Record<string, unknown> = {};
  try {
    const parsed = JSON.parse(body) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) bodyValues = parsed as Record<string, unknown>;
  } catch {
    // Non-JSON request bodies are emitted verbatim below.
  }
  const formatFormValue = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));
  return [
    `curl --request ${operation.method.toUpperCase()}`,
    `  --url ${shellQuote(url)}`,
    authentication
      ? `  --header ${shellQuote(`${authentication.header}: ${authentication.prefix}${environment ? "" : apiKey}`)}${environment ? `"$${environment}"` : ""}`
      : "",
    ...(operation.parameters ?? [])
      .filter(
        (parameter) =>
          ["header", "cookie"].includes(parameter.in) &&
          (parameter.required || values[`${parameter.in}:${parameter.name}`]),
      )
      .map((parameter) => {
        const value = parameterValueOrExample(parameter);
        return parameter.in === "cookie"
          ? `  --cookie ${shellQuote(serializeQueryParameter(parameter.name, value, "form", parameter.explode).replaceAll("&", "; "))}`
          : `  --header ${shellQuote(`${parameter.name}: ${serializeSimplePath(value, parameter.explode)}`)}`;
      }),
    request && request[0] !== "multipart/form-data" ? `  --header ${shellQuote(`Content-Type: ${request[0]}`)}` : "",
    request && (request[0] === "application/json" || request[0].endsWith("+json")) && body
      ? `  --data ${shellQuote(body)}`
      : "",
    request?.[0] === "application/x-www-form-urlencoded"
      ? formEntries(bodyValues)
          .map(([name, value]) => `  --data-urlencode ${shellQuote(`${name}=${formatFormValue(value)}`)}`)
          .join(" \\\n")
      : "",
    request &&
    body &&
    !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(request[0])
      ? `  --data ${shellQuote(body)}`
      : "",
    request?.[0] === "multipart/form-data"
      ? Object.entries(properties)
          .map(([name, schema]) => {
            const binary = resolveSchema(document, schema)?.format === "binary";
            const value = binary
              ? `@${files[name]?.name ?? "path/to/file"}`
              : formatFormValue(bodyValues[name] ?? schemaExample(document, schema));
            return `  ${binary ? "--form" : "--form-string"} ${shellQuote(`${name}=${value}`)}`;
          })
          .join(" \\\n")
      : "",
  ]
    .filter(Boolean)
    .join(" \\\n");
}

export function buildApiRequest(
  document: OpenApiDocument,
  operation: ApiOperation,
  {
    apiKey = "",
    body = "",
    files = {},
    origin,
    serverOrigin,
    values = {},
  }: {
    apiKey?: string;
    body?: string;
    files?: Record<string, File>;
    origin: string;
    serverOrigin?: string;
    values?: Record<string, string>;
  },
): { body?: BodyInit; headers: Record<string, string>; url: string } {
  const parameters = operation.parameters ?? [];
  const missing = parameters.find((parameter) => parameter.required && !values[`${parameter.in}:${parameter.name}`]);
  if (missing) throw new Error(`Enter ${missing.name} before sending the request.`);
  if (parameters.some((parameter) => parameter.in === "cookie")) {
    throw new Error("Browser requests cannot set cookie parameters. Use a generated code example.");
  }

  let path = operation.path;
  for (const parameter of parameters.filter((item) => item.in === "path")) {
    path = path.replace(
      `{${parameter.name}}`,
      serializeSimplePath(
        parameterValue(document, parameter, values[`path:${parameter.name}`] ?? ""),
        parameter.explode,
        parameter.allowReserved,
      ),
    );
  }

  const query = parameters
    .filter((item) => item.in === "query" && values[`query:${item.name}`])
    .map((parameter) =>
      serializeQueryParameter(
        parameter.name,
        parameterValue(document, parameter, values[`query:${parameter.name}`] ?? ""),
        parameter.style,
        parameter.explode,
        parameter.allowReserved,
      ),
    )
    .join("&");
  const configuredBaseUrl = resolveServerUrl(document, origin, operation);
  const baseUrl = serverOrigin
    ? new URL(new URL(configuredBaseUrl).pathname, `${serverOrigin}/`).toString().replace(/\/$/, "")
    : configuredBaseUrl;
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}${query ? `?${query}` : ""}`;
  const request = requestMedia(operation);
  const success = successMedia(operation);
  const authentication = getAuthentication(document, operation);
  const headers: Record<string, string> = success ? { Accept: success[0] } : {};
  if (apiKey && authentication) headers[authentication.header] = `${authentication.prefix}${apiKey}`;
  if (request && request[0] !== "multipart/form-data") headers["Content-Type"] = request[0];
  for (const parameter of parameters.filter((item) => item.in === "header")) {
    const value = values[`header:${parameter.name}`];
    if (value)
      headers[parameter.name] = serializeSimplePath(parameterValue(document, parameter, value), parameter.explode);
  }

  let requestBody: BodyInit | undefined;
  if (request?.[0] === "application/json" || request?.[0].endsWith("+json")) requestBody = body;
  if (request?.[0] === "application/x-www-form-urlencoded") {
    const form = new URLSearchParams();
    let bodyValues: Record<string, unknown>;
    try {
      const parsed = JSON.parse(body) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      bodyValues = parsed as Record<string, unknown>;
    } catch {
      throw new Error("Enter valid JSON request values before sending the request.");
    }
    for (const [name, value] of formEntries(bodyValues)) form.append(name, String(value));
    requestBody = form;
  }
  if (request?.[0] === "multipart/form-data") {
    const form = new FormData();
    const requestSchema = objectSchema(document, request[1].schema);
    let bodyValues: Record<string, unknown>;
    try {
      const parsed = JSON.parse(body) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
      bodyValues = parsed as Record<string, unknown>;
    } catch {
      throw new Error("Enter valid JSON request values before sending the request.");
    }
    for (const [name, value] of Object.entries(bodyValues)) {
      if (
        resolveSchema(document, requestSchema?.properties?.[name])?.format === "binary" ||
        value === null ||
        value === undefined
      )
        continue;
      form.append(name, typeof value === "string" ? value : JSON.stringify(value));
    }
    for (const [name, file] of Object.entries(files)) form.append(name, file);
    const missingFile = Object.entries(requestSchema?.properties ?? {}).find(
      ([name, schema]) =>
        resolveSchema(document, schema)?.format === "binary" && requestSchema?.required?.includes(name) && !files[name],
    );
    if (missingFile) throw new Error(`Choose ${missingFile[0]} before sending the request.`);
    requestBody = form;
  }
  if (
    request &&
    !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(request[0])
  ) {
    requestBody = body;
  }
  return { body: requestBody, headers, url };
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
