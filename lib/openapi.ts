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
  maxProperties?: number;
  maximum?: number;
  minItems?: number;
  minLength?: number;
  minProperties?: number;
  minimum?: number;
  multipleOf?: number;
  nullable?: boolean;
  oneOf?: JsonSchema[];
  prefixItems?: JsonSchema[];
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
  deprecated?: boolean;
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
  "x-sdk-method"?: string;
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
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
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

export function allocateSdkIdentifiers(
  values: Array<{ location: string; name: string }>,
  reserved: string[] = [],
): string[] {
  const used = new Set(["self", ...reserved]);
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

function serializeQueryParameter(
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

const SDK_VERBS: Record<HttpMethod, string> = {
  delete: "delete",
  get: "retrieve",
  head: "head",
  options: "options",
  patch: "update",
  post: "create",
  put: "update",
  trace: "trace",
};

interface SdkMethodCandidates {
  /** Preferred name: x-sdk-method, the static path leaf, or the CRUD verb for the HTTP method. */
  name: string;
  /** Fallbacks when the preferred name collides within the resource: leaf + parent segment, then verb + leaf. */
  fallbacks: string[];
}

function sdkMethodCandidates(
  operation: OperationObject & { method: HttpMethod; path: string; resource: string },
): SdkMethodCandidates {
  const override = operation["x-sdk-method"];
  if (override !== undefined) {
    if (!/^[a-z_][a-z0-9_]*$/.test(override) || PYTHON_RESERVED.has(override)) {
      throw new Error(`Invalid x-sdk-method for ${operation.path}: ${override}`);
    }
    return { name: override, fallbacks: [] };
  }
  const segments = operation.path.split("/").filter(Boolean);
  const isParameter = (segment: string) => segment.startsWith("{");
  const rootIndex = Math.max(
    segments.findLastIndex((segment) => sdkIdentifier(segment) === operation.resource),
    segments.findLastIndex((segment, index) => !isParameter(segment) && isParameter(segments[index + 1] ?? "")),
  );
  const suffix = segments.slice(Math.max(rootIndex, 0) + 1).filter((segment) => !isParameter(segment));
  const leaf = suffix.at(-1);
  const verb = SDK_VERBS[operation.method];
  if (leaf && (rootIndex >= 0 || !segments.some(isParameter))) {
    const parent = suffix.at(-2);
    return {
      name: sdkIdentifier(leaf),
      fallbacks: [...(parent ? [sdkIdentifier(`${leaf}_${parent}`)] : []), `${verb}_${sdkIdentifier(leaf)}`],
    };
  }
  if (operation.method === "get") {
    const item = segments.some(isParameter) && !/^(list|view|search)\b/i.test(operation.summary ?? "");
    return { name: item ? "retrieve" : "list", fallbacks: [] };
  }
  return { name: verb, fallbacks: [] };
}

export function getOperations(document: OpenApiDocument): ApiOperation[] {
  const operations: ApiOperation[] = [];
  const ids = new Set<string>();

  for (const [path, pathItem] of Object.entries(document.paths)) {
    const inherited = (pathItem.parameters ?? []).map((parameter) => resolveParameter(document, parameter));
    for (const [method, value] of Object.entries(pathItem)) {
      if (!HTTP_METHODS.has(method as HttpMethod) || !value) continue;
      const operation = value as OperationObject;
      const typedMethod = method as HttpMethod;
      const tag = operation.tags?.[0] ?? "Other";
      const parameters = [...inherited];
      for (const parameter of (operation.parameters ?? []).map((item) => resolveParameter(document, item))) {
        const index = parameters.findIndex((item) => item.in === parameter.in && item.name === parameter.name);
        if (index === -1) parameters.push(parameter);
        else parameters[index] = parameter;
      }
      let id = operation.operationId ?? `${typedMethod}-${path}`;
      for (let index = 2; ids.has(id); index += 1) id = `${operation.operationId ?? `${typedMethod}-${path}`}-${index}`;
      ids.add(id);
      const base = {
        ...operation,
        id,
        method: typedMethod,
        path,
        parameters,
        requestBody: resolveRequestBody(document, operation.requestBody),
        resource: sdkIdentifier(tag),
        responses: Object.fromEntries(
          Object.entries(operation.responses ?? {}).map(([status, response]) => [
            status,
            resolveResponse(document, response),
          ]),
        ),
        server: operation.servers?.[0] ?? pathItem.servers?.[0] ?? document.servers?.[0],
        tag,
      };
      operations.push({ ...base, sdkMethod: "" });
    }
  }

  // Resolve names per resource: canonical names first, GET keeps the bare leaf, the rest fall back, then a suffix.
  const candidates = new Map(operations.map((operation) => [operation, sdkMethodCandidates(operation)]));
  const groups = new Map<string, ApiOperation[]>();
  for (const operation of operations) {
    const key = `${operation.resource}.${candidates.get(operation)?.name}`;
    groups.set(key, [...(groups.get(key) ?? []), operation]);
  }
  const used = new Set<string>();
  const claim = (operation: ApiOperation, ...names: string[]) => {
    const preferred = names.find((name) => !used.has(`${operation.resource}.${name}`)) ?? names[0] ?? operation.method;
    operation.sdkMethod = preferred;
    for (let index = 2; used.has(`${operation.resource}.${operation.sdkMethod}`); index += 1) {
      operation.sdkMethod = `${preferred}_${index}`;
    }
    used.add(`${operation.resource}.${operation.sdkMethod}`);
  };
  for (const group of groups.values()) {
    const rank = (operation: ApiOperation) =>
      candidates.get(operation)?.fallbacks.length === 0 ? 0 : operation.method === "get" ? 1 : 2;
    for (const operation of [...group].sort((left, right) => rank(left) - rank(right))) {
      const { name, fallbacks } = candidates.get(operation) ?? { name: operation.method, fallbacks: [] };
      const samePath = group.some((other) => other !== operation && other.path === operation.path);
      const [withParent, withVerb] = fallbacks.length === 2 ? fallbacks : [undefined, fallbacks[0]];
      const ordered = samePath ? [withVerb, withParent] : [withParent, withVerb];
      claim(
        operation,
        ...(group.length === 1 || rank(operation) < 2 ? [name] : []),
        ...(ordered.filter(Boolean) as string[]),
      );
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
  const json = media?.[0] === "application/json" || media?.[0].endsWith("+json");
  const structured = json || ["application/x-www-form-urlencoded", "multipart/form-data"].includes(media?.[0] ?? "");
  const bodySchema = resolveSchema(document, media?.[1].schema);
  const union = bodySchema?.oneOf ?? bodySchema?.anyOf;
  const unionDescriptions = (input: JsonSchema | undefined, depth = 0): string[] => {
    const schema = resolveSchema(document, input);
    if (!schema || depth >= 20) return [];
    const variants = schema.oneOf ?? schema.anyOf;
    return variants?.length
      ? variants
          .map((variant) => resolveSchema(document, variant)?.description)
          .filter((description): description is string => Boolean(description))
      : (schema.allOf ?? []).flatMap((item) => unionDescriptions(item, depth + 1));
  };
  const variantDescription = unionDescriptions(bodySchema).join(" Or ");
  const body = structured ? objectSchema(document, bodySchema) : undefined;
  const variants = union?.map((variant) => objectSchema(document, variant)) ?? [];
  const closed = bodySchema?.allOf?.flatMap((item) => {
    const branch = objectSchema(document, item);
    return branch?.additionalProperties === false
      ? [
          Object.keys(branch.properties ?? {})
            .sort()
            .join("\0"),
        ]
      : [];
  });
  const closedVariants = variants.flatMap((variant) =>
    variant?.additionalProperties === false
      ? [
          Object.keys(variant.properties ?? {})
            .sort()
            .join("\0"),
        ]
      : [],
  );
  const incompatibleClosedBody = Boolean((closed?.length && new Set(closed).size > 1) || closedVariants.length);
  const constrainedComposedBody = Boolean(
    bodySchema?.allOf?.some((item) => typeof objectSchema(document, item)?.additionalProperties === "object"),
  );
  const containsUnion = (input: JsonSchema | undefined, depth = 0): boolean => {
    const schema = resolveSchema(document, input);
    if (!schema || depth >= 20) return false;
    return Boolean(
      schema.oneOf?.length || schema.anyOf?.length || schema.allOf?.some((item) => containsUnion(item, depth + 1)),
    );
  };
  const exclusiveBody = containsUnion(bodySchema);
  if (
    body?.properties &&
    Object.keys(body.properties).length &&
    !exclusiveBody &&
    !incompatibleClosedBody &&
    !constrainedComposedBody &&
    body.minProperties === undefined &&
    body.maxProperties === undefined
  ) {
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
      description: bodySchema?.description || variantDescription || "Request body.",
      location: "body",
      name: "body",
      pythonName: "body",
      required: operation.requestBody?.required ?? false,
      schema: media[1].schema ?? {},
      wholeBody: true,
    });
  }
  const names = allocateSdkIdentifiers(parameters, ["extra_headers", "timeout"]);
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
  let exampleBody = bodyValue;
  if (exampleBody === undefined && request) {
    exampleBody =
      request[1].example !== undefined
        ? request[1].example
        : request[0].startsWith("text/")
          ? requestBodyExample(document, operation)
          : requestBodyExampleValue(document, request);
  }
  const bodyValues =
    exampleBody && typeof exampleBody === "object" && !Array.isArray(exampleBody)
      ? (exampleBody as Record<string, unknown>)
      : {};
  const values = sdkArguments(document, operation)
    .filter((argument) => argument.required)
    .map((argument) => {
      const value =
        argument.location !== "body"
          ? schemaExample(document, argument.schema, 0, argument.name)
          : argument.wholeBody
            ? exampleBody
            : bodyValues[argument.name] !== undefined
              ? bodyValues[argument.name]
              : schemaExample(document, argument.schema, 0, argument.name);
      return { source: `${argument.pythonName}=${pythonLiteral(value)}`, value };
    });
  return [
    `from ${config.package} import ${config.client}`,
    "",
    `client = ${config.client}()  # Reads ${config.environment}`,
    values.length
      ? `response = client.${operation.resource}.${operation.sdkMethod}(\n${values.map(({ source }) => `    ${source},`).join("\n")}\n)`
      : `response = client.${operation.resource}.${operation.sdkMethod}()`,
    "print(response)",
  ].join("\n");
}

export function addPythonCodeSamples(document: OpenApiDocument, config: PythonCodeSampleConfig): OpenApiDocument {
  for (const operation of getOperations(document)) {
    const target = document.paths[operation.path]?.[operation.method];
    if (!target) continue;
    const existing = (target["x-codeSamples"] ?? []).filter((sample) => sample.label !== "Python SDK");
    const source = pythonCodeSample(document, operation, config);
    target["x-codeSamples"] = [...existing, { label: "Python SDK", lang: "Python", source }];
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

export function getAuthentication(document: OpenApiDocument, operation: ApiOperation): ApiAuthentication | undefined {
  for (const requirement of operation.security ?? document.security ?? []) {
    const [name, ...others] = Object.keys(requirement);
    if (!name || others.length) continue;
    const scheme = document.components?.securitySchemes?.[name];
    if (scheme?.type === "apiKey" && scheme.in === "header" && scheme.name) return { header: scheme.name, prefix: "" };
    if (scheme?.type === "http" && scheme.scheme?.toLowerCase() === "bearer") {
      return { header: "Authorization", prefix: "Bearer " };
    }
  }
  return undefined;
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
    ...(resolved?.properties || siblings.properties
      ? { properties: { ...resolved?.properties, ...siblings.properties } }
      : {}),
    ...(resolved?.required || siblings.required
      ? { required: [...new Set([...(resolved?.required ?? []), ...(siblings.required ?? [])])] }
      : {}),
  };
}

function schemasEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (Array.isArray(left) || Array.isArray(right)) {
    return (
      Array.isArray(left) &&
      Array.isArray(right) &&
      left.length === right.length &&
      left.every((value, index) => schemasEqual(value, right[index]))
    );
  }
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  const leftEntries = Object.entries(left);
  const rightRecord = right as Record<string, unknown>;
  return (
    leftEntries.length === Object.keys(rightRecord).length &&
    leftEntries.every(([key, value]) => Object.hasOwn(rightRecord, key) && schemasEqual(value, rightRecord[key]))
  );
}

export function objectSchema(document: OpenApiDocument, input: JsonSchema | undefined): JsonSchema | undefined {
  const schema = resolveSchema(document, input);
  if (!schema) return undefined;
  if (schema.allOf?.length) {
    const objects = schema.allOf
      .map((item) => objectSchema(document, item))
      .filter(
        (item): item is JsonSchema =>
          Boolean(item) &&
          (item?.type === "object" ||
            item?.properties !== undefined ||
            Boolean(item?.required?.length) ||
            item?.minProperties !== undefined ||
            item?.maxProperties !== undefined ||
            item?.additionalProperties !== undefined ||
            item?.propertyNames !== undefined),
      );
    if (objects.length) {
      const composed = [schema, ...objects];
      const minimums = composed.flatMap((item) => (item.minProperties === undefined ? [] : [item.minProperties]));
      const maximums = composed.flatMap((item) => (item.maxProperties === undefined ? [] : [item.maxProperties]));
      const additional = composed.flatMap((item) =>
        typeof item.additionalProperties === "object" ? [item.additionalProperties] : [],
      );
      const names = composed.flatMap((item) => (item.propertyNames ? [item.propertyNames] : []));
      const propertyNames = names.length === 1 ? names[0] : names.length ? { allOf: names } : undefined;
      const properties: Record<string, JsonSchema> = {};
      for (const item of composed) {
        for (const [name, property] of Object.entries(item.properties ?? {})) {
          properties[name] =
            properties[name] && !schemasEqual(properties[name], property)
              ? { allOf: [properties[name], property] }
              : property;
        }
      }
      for (const [name, property] of Object.entries(properties)) {
        const constraints = composed.flatMap((item) =>
          typeof item.additionalProperties === "object" && !Object.hasOwn(item.properties ?? {}, name)
            ? [item.additionalProperties]
            : [],
        );
        if (constraints.length) properties[name] = { allOf: [property, ...constraints] };
      }
      const closed = composed.filter((item) => item.additionalProperties === false);
      if (closed.length) {
        for (const property of Object.keys(properties)) {
          if (closed.some((item) => !Object.hasOwn(item.properties ?? {}, property))) delete properties[property];
        }
      }
      return {
        ...schema,
        ...(composed.some((item) => item.additionalProperties === false)
          ? { additionalProperties: false }
          : additional.length
            ? { additionalProperties: additional.length === 1 ? additional[0] : { allOf: additional } }
            : {}),
        ...(maximums.length ? { maxProperties: Math.min(...maximums) } : {}),
        ...(minimums.length ? { minProperties: Math.max(...minimums) } : {}),
        ...(propertyNames ? { propertyNames } : {}),
        properties: Object.fromEntries(
          Object.entries(properties).filter(
            ([property]) => !propertyNames || schemaMatches(document, property, propertyNames),
          ),
        ),
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
        current && !schemasEqual(current, property)
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

function stringFormatMatches(value: string, format?: string): boolean {
  const dateValid = (date: string) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
    const parsed = new Date(`${date}T00:00:00Z`);
    return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
  };
  if (format === "date") return dateValid(value);
  if (format === "date-time") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/);
    if (!match?.[1]) return false;
    return (
      dateValid(match[1]) &&
      Number(match[2]) <= 23 &&
      Number(match[3]) <= 59 &&
      Number(match[4]) <= 59 &&
      !Number.isNaN(Date.parse(value))
    );
  }
  if (format === "email") return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value);
  if (format === "uri" || format === "url") return URL.canParse(value);
  if (format === "hostname")
    return /^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(
      value,
    );
  if (format === "ipv4")
    return (
      value.split(".").length === 4 && value.split(".").every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255)
    );
  if (format === "ipv6") {
    const halves = value.split("::");
    if (halves.length > 2) return false;
    const groups = halves.flatMap((half) => (half ? half.split(":") : []));
    if (groups.some((group) => !/^[0-9a-f]{1,4}$/i.test(group))) return false;
    return halves.length === 2 ? groups.length < 8 : groups.length === 8;
  }
  if (format === "time") {
    const match = value.match(/^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/);
    if (!match) return false;
    return (
      Number(match[1]) <= 23 &&
      Number(match[2]) <= 59 &&
      Number(match[3]) <= 59 &&
      (!match[5] || (Number(match[5]) <= 23 && Number(match[6]) <= 59))
    );
  }
  if (format === "duration")
    return /^P(?=\d|T\d)(?:\d+(?:\.\d+)?Y)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?W)?(?:\d+(?:\.\d+)?D)?(?:T(?=\d)(?:\d+(?:\.\d+)?H)?(?:\d+(?:\.\d+)?M)?(?:\d+(?:\.\d+)?S)?)?$/.test(
      value,
    );
  if (format === "uuid")
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  return true;
}

function stringExample(schema: JsonSchema, name?: string, patterns = schema.pattern ? [schema.pattern] : []): string {
  const knownFormats = new Set([
    "binary",
    "byte",
    "date",
    "date-time",
    "duration",
    "email",
    "hostname",
    "ipv4",
    "ipv6",
    "password",
    "time",
    "uri",
    "url",
    "uuid",
  ]);
  const constrainLength = (candidate: string) =>
    (schema.maxLength === undefined ? candidate : candidate.slice(0, schema.maxLength)).padEnd(
      schema.minLength ?? 0,
      "x",
    );
  if (schema.format && !knownFormats.has(schema.format) && !patterns.length) {
    return constrainLength(`<${schema.format} value>`);
  }
  let value = name ? `example-${name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()}` : "example";
  if (schema.format === "date") value = "2026-01-01";
  else if (schema.format === "date-time") value = "2026-01-01T00:00:00Z";
  else if (schema.format === "email") value = "jane@example.com";
  else if (schema.format === "uri" || schema.format === "url") value = "https://example.com";
  else if (schema.format === "hostname") value = "example.com";
  else if (schema.format === "ipv4") value = "192.0.2.1";
  else if (schema.format === "ipv6") value = "2001:db8::1";
  else if (schema.format === "time") value = "12:00:00Z";
  else if (schema.format === "duration") value = "P1D";
  else if (schema.format === "uuid") value = "123e4567-e89b-12d3-a456-426614174000";
  else if (schema.format === "binary") value = "path/to/file";
  else if (schema.format === "byte") value = "ZXhhbXBsZQ==";
  else if (schema.format === "password") value = "example-password";
  try {
    const expressions = patterns.map((pattern) => new RegExp(pattern));
    const candidates = [
      value,
      ...(patterns.some((pattern) => pattern.includes("[A-Z]+")) ? ["KEY"] : []),
      "example",
      ...patterns.flatMap((pattern) => {
        if (/^[a-zA-Z0-9._-]+$/.test(pattern)) return [pattern];
        const simple = pattern
          .split("|")
          .map((alternative) => alternative.replace(/^\^/, "").replace(/\$$/, ""))
          .filter((alternative) => /^[a-zA-Z0-9._-]+$/.test(alternative));
        if (simple.length) return simple;
        return pattern === "^$" ? [""] : [];
      }),
    ].map(constrainLength);
    return (
      candidates.find(
        (candidate) =>
          stringFormatMatches(candidate, schema.format) &&
          expressions.every((expression) => expression.test(candidate)),
      ) ?? constrainLength(`<${schema.format ?? "pattern"} value>`)
    );
  } catch {
    return constrainLength("<pattern value>");
  }
}

function scalarMatches(value: unknown, schema: JsonSchema): boolean {
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (
    types.length &&
    !types.some(
      (type) =>
        (type === "null" && value === null) ||
        (type === "integer" && typeof value === "number" && Number.isInteger(value)) ||
        (type === "number" && typeof value === "number") ||
        type === typeof value,
    )
  )
    return false;
  if (typeof value === "string") {
    if (!stringFormatMatches(value, schema.format)) return false;
    if (schema.minLength !== undefined && value.length < schema.minLength) return false;
    if (schema.maxLength !== undefined && value.length > schema.maxLength) return false;
    if (schema.pattern) {
      try {
        if (!new RegExp(schema.pattern).test(value)) return false;
      } catch {
        return false;
      }
    }
  }
  if (types.includes("integer") && !types.includes("number") && !Number.isInteger(value)) return false;
  if (typeof value === "number") {
    if (
      schema.minimum !== undefined &&
      (value < schema.minimum || (schema.exclusiveMinimum === true && value <= schema.minimum))
    )
      return false;
    if (typeof schema.exclusiveMinimum === "number" && value <= schema.exclusiveMinimum) return false;
    if (
      schema.maximum !== undefined &&
      (value > schema.maximum || (schema.exclusiveMaximum === true && value >= schema.maximum))
    )
      return false;
    if (typeof schema.exclusiveMaximum === "number" && value >= schema.exclusiveMaximum) return false;
    if (schema.multipleOf && Math.abs(value / schema.multipleOf - Math.round(value / schema.multipleOf)) > 1e-9)
      return false;
  }
  return true;
}

function mergeScalarSchemas(document: OpenApiDocument, inputs: JsonSchema[], name?: string): JsonSchema {
  const flatten = (input: JsonSchema, depth = 0): JsonSchema[] => {
    const schema = resolveSchema(document, input) ?? input;
    if (depth > 8) return [schema];
    return [schema, ...(schema.allOf ?? []).flatMap((item) => flatten(item, depth + 1))];
  };
  const schemas = inputs.flatMap((schema) => flatten(schema));
  const result = Object.assign({}, ...schemas);
  delete result.$ref;
  delete result.allOf;
  delete result.anyOf;
  delete result.oneOf;
  const typeSets = schemas.flatMap((schema) => {
    const values = (Array.isArray(schema.type) ? schema.type : [schema.type]).filter((value): value is string =>
      Boolean(value),
    );
    return values.length
      ? [new Set(values.flatMap((value) => (value === "number" ? ["integer", "number"] : [value])))]
      : [];
  });
  if (typeSets.length) {
    const types = [...(typeSets[0] ?? [])].filter((value) => typeSets.every((items) => items.has(value)));
    if (types.includes("number") && types.includes("integer")) types.splice(types.indexOf("integer"), 1);
    result.type = types.length === 1 ? types[0] : types;
  }
  const minimumLengths = schemas.flatMap((schema) => (schema.minLength === undefined ? [] : [schema.minLength]));
  const maximumLengths = schemas.flatMap((schema) => (schema.maxLength === undefined ? [] : [schema.maxLength]));
  if (minimumLengths.length) result.minLength = Math.max(...minimumLengths);
  if (maximumLengths.length) result.maxLength = Math.min(...maximumLengths);
  const minimumItems = schemas.flatMap((schema) => (schema.minItems === undefined ? [] : [schema.minItems]));
  const maximumItems = schemas.flatMap((schema) => (schema.maxItems === undefined ? [] : [schema.maxItems]));
  if (minimumItems.length) result.minItems = Math.max(...minimumItems);
  if (maximumItems.length) result.maxItems = Math.min(...maximumItems);
  const items = schemas.flatMap((schema) => (schema.items ? [schema.items] : []));
  if (items.length) result.items = items.length === 1 ? items[0] : { allOf: items };
  const minimums = schemas.flatMap((schema) => [
    ...(schema.minimum === undefined ? [] : [{ exclusive: schema.exclusiveMinimum === true, value: schema.minimum }]),
    ...(typeof schema.exclusiveMinimum === "number" ? [{ exclusive: true, value: schema.exclusiveMinimum }] : []),
  ]);
  const maximums = schemas.flatMap((schema) => [
    ...(schema.maximum === undefined ? [] : [{ exclusive: schema.exclusiveMaximum === true, value: schema.maximum }]),
    ...(typeof schema.exclusiveMaximum === "number" ? [{ exclusive: true, value: schema.exclusiveMaximum }] : []),
  ]);
  const minimum = minimums.sort((a, b) => b.value - a.value || Number(b.exclusive) - Number(a.exclusive))[0];
  const maximum = maximums.sort((a, b) => a.value - b.value || Number(b.exclusive) - Number(a.exclusive))[0];
  delete result.minimum;
  delete result.maximum;
  delete result.exclusiveMinimum;
  delete result.exclusiveMaximum;
  if (minimum) result[minimum.exclusive ? "exclusiveMinimum" : "minimum"] = minimum.value;
  if (maximum) result[maximum.exclusive ? "exclusiveMaximum" : "maximum"] = maximum.value;
  const patterns = [...new Set(schemas.flatMap((schema) => (schema.pattern ? [schema.pattern] : [])))];
  const enums = schemas.filter((schema) => schema.enum).map((schema) => schema.enum ?? []);
  if (enums.length) {
    result.enum = enums
      .reduce((values, items) => values.filter((value) => items.includes(value)))
      .filter((value) => schemas.every((schema) => scalarMatches(value, schema)));
  }
  const multiples = schemas.flatMap((schema) => (schema.multipleOf === undefined ? [] : [schema.multipleOf]));
  if (multiples.length) {
    const decimals = Math.max(
      ...multiples.map((value) => {
        const [coefficient = "", exponent = "0"] = String(value).toLowerCase().split("e");
        return Math.max(0, (coefficient.split(".")[1] ?? "").length - Number(exponent));
      }),
    );
    const scale = 10 ** decimals;
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    result.multipleOf =
      multiples
        .map((value) => Math.round(value * scale))
        .reduce((multiple, value) => (multiple * value) / gcd(multiple, value)) / scale;
  }
  const type = Array.isArray(result.type) ? result.type.find((value: string) => value !== "null") : result.type;
  if (
    type === "string" &&
    result.example === undefined &&
    result.default === undefined &&
    result.const === undefined &&
    !result.enum?.length
  ) {
    const formats = [...new Set(schemas.flatMap((schema) => (schema.format ? [schema.format] : [])))];
    const example = [
      ...formats.map((format) => stringExample({ ...result, format }, name, patterns)),
      stringExample(result, name, patterns),
    ].find((candidate) => schemas.every((schema) => scalarMatches(candidate, schema)));
    if (example !== undefined) result.example = example;
  }
  return result;
}

function schemaMatches(document: OpenApiDocument, value: unknown, input: JsonSchema, depth = 0): boolean {
  if (depth > 8) return true;
  const schema = resolveSchema(document, input) ?? input;
  if (schema.const !== undefined && value !== schema.const) return false;
  if (schema.enum?.length && !schema.enum.includes(value)) return false;
  if (schema.allOf?.some((item) => !schemaMatches(document, value, item, depth + 1))) return false;
  if (
    schema.oneOf?.length &&
    schema.oneOf.filter((item) => schemaMatches(document, value, item, depth + 1)).length !== 1
  )
    return false;
  if (schema.anyOf?.length && !schema.anyOf.some((item) => schemaMatches(document, value, item, depth + 1)))
    return false;
  const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
  if (
    types.length &&
    !(value === null && schema.nullable) &&
    !types.some((type) => {
      if (type === "null") return value === null;
      if (type === "array") return Array.isArray(value);
      if (type === "object") return Boolean(value) && typeof value === "object" && !Array.isArray(value);
      if (type === "integer") return typeof value === "number" && Number.isInteger(value);
      return typeof value === type;
    })
  )
    return false;
  if ((typeof value === "string" || typeof value === "number") && !scalarMatches(value, schema)) return false;
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) return false;
    if (schema.maxItems !== undefined && value.length > schema.maxItems) return false;
    if (
      schema.prefixItems?.some(
        (item, index) => index < value.length && !schemaMatches(document, value[index], item, depth + 1),
      )
    )
      return false;
    if (
      schema.items &&
      value
        .slice(schema.prefixItems?.length ?? 0)
        .some((item) => !schemaMatches(document, item, schema.items as JsonSchema, depth + 1))
    )
      return false;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    if (schema.minProperties !== undefined && Object.keys(record).length < schema.minProperties) return false;
    if (schema.maxProperties !== undefined && Object.keys(record).length > schema.maxProperties) return false;
    if (schema.required?.some((name) => !Object.hasOwn(record, name))) return false;
    if (
      schema.propertyNames &&
      Object.keys(record).some((name) => !schemaMatches(document, name, schema.propertyNames as JsonSchema, depth + 1))
    )
      return false;
    if (
      schema.additionalProperties === false &&
      Object.keys(record).some((name) => !Object.hasOwn(schema.properties ?? {}, name))
    )
      return false;
    if (
      typeof schema.additionalProperties === "object" &&
      Object.entries(record).some(
        ([name, property]) =>
          !Object.hasOwn(schema.properties ?? {}, name) &&
          !schemaMatches(document, property, schema.additionalProperties as JsonSchema, depth + 1),
      )
    )
      return false;
    if (
      Object.entries(schema.properties ?? {}).some(
        ([name, property]) =>
          Object.hasOwn(record, name) && !schemaMatches(document, record[name], property, depth + 1),
      )
    )
      return false;
  }
  return true;
}

export function schemaExample(
  document: OpenApiDocument,
  input: JsonSchema | undefined,
  depth = 0,
  name?: string,
): unknown {
  if (!input || depth > 8) return null;
  const schema = resolveSchema(document, input) ?? input;
  if (schema.example !== undefined) return schema.example;
  if (schema.default !== undefined) return schema.default;
  if (schema.const !== undefined) return schema.const;
  if (schema.enum?.length) {
    const siblings = { ...schema, enum: undefined };
    return schema.enum.find((value) => schemaMatches(document, value, siblings)) ?? schema.enum[0];
  }

  const union = schema.oneOf ?? schema.anyOf;
  if (union?.length) {
    const siblings = { ...schema, anyOf: undefined, oneOf: undefined };
    for (const item of union) {
      const variant = resolveSchema(document, item) ?? item;
      const type = Array.isArray(variant.type) ? variant.type.find((value) => value !== "null") : variant.type;
      if (variant.type === "null" || (Array.isArray(variant.type) && variant.type.every((value) => value === "null"))) {
        if (schemaMatches(document, null, schema)) return null;
        continue;
      }
      if (
        type === "object" ||
        variant.properties ||
        variant.required ||
        variant.additionalProperties !== undefined ||
        variant.minProperties !== undefined ||
        variant.maxProperties !== undefined ||
        variant.propertyNames
      ) {
        const combined = objectSchema(document, { allOf: [siblings, variant] });
        const required = new Set([...(siblings.required ?? []), ...(variant.required ?? [])]);
        const hasRequired = Boolean(variant.required?.length);
        const narrow = hasRequired || variant.additionalProperties === false || variant.propertyNames;
        const narrowed =
          combined && narrow
            ? {
                ...combined,
                allOf: undefined,
                properties: Object.fromEntries(
                  Object.entries(combined.properties ?? {}).filter(
                    ([property]) =>
                      required.has(property) ||
                      (!hasRequired &&
                        (variant.additionalProperties !== false || Object.hasOwn(variant.properties ?? {}, property)) &&
                        (!variant.propertyNames || schemaMatches(document, property, variant.propertyNames))),
                  ),
                ),
              }
            : combined;
        const selected = schemaExample(document, narrowed ?? variant, depth + 1, name);
        if (schemaMatches(document, selected, schema)) return selected;
        continue;
      }
      const merged = mergeScalarSchemas(document, [variant, siblings], name);
      const selected = schemaExample(document, merged, depth + 1, name);
      if (schemaMatches(document, selected, schema)) return selected;
    }
    return [null, false, 0, {}, []].find((candidate) => schemaMatches(document, candidate, schema)) ?? null;
  }
  if (schema.allOf?.length) {
    for (const [index, item] of schema.allOf.entries()) {
      const nested = resolveSchema(document, item) ?? item;
      const alternatives = nested.oneOf ?? nested.anyOf;
      if (!alternatives?.length) continue;
      for (const alternative of alternatives) {
        const required = new Set([...(nested.required ?? []), ...(alternative.required ?? [])]);
        const properties = { ...nested.properties, ...alternative.properties };
        const replacement = {
          ...nested,
          ...alternative,
          anyOf: undefined,
          oneOf: undefined,
          properties: Object.fromEntries(
            Object.entries(properties).filter(
              ([property]) => required.has(property) || Object.hasOwn(alternative.properties ?? {}, property),
            ),
          ),
          required: [...required],
        };
        const candidate = schemaExample(
          document,
          {
            ...schema,
            allOf: schema.allOf.map((entry, entryIndex) => (entryIndex === index ? replacement : entry)),
          },
          depth + 1,
          name,
        );
        if (schemaMatches(document, candidate, schema)) return candidate;
      }
    }
    const object = objectSchema(document, schema);
    if (object?.properties) {
      const names = schema.allOf.flatMap((item) => {
        const branch = resolveSchema(document, item) ?? item;
        return branch.propertyNames ? [branch.propertyNames] : [];
      });
      const selected = schemaExample(
        document,
        {
          ...object,
          allOf: undefined,
          ...(names.length ? { propertyNames: names.length === 1 ? names[0] : { allOf: names } } : {}),
        },
        depth + 1,
        name,
      );
      if (schemaMatches(document, selected, schema)) return selected;
      for (const item of schema.allOf) {
        const candidate = schemaExample(document, item, depth + 1, name);
        if (schemaMatches(document, candidate, schema)) return candidate;
      }
      const required = new Set(object.required ?? []);
      const closed = schema.allOf.flatMap((item) => {
        const branch = objectSchema(document, item);
        return branch?.additionalProperties === false ? [new Set(Object.keys(branch.properties ?? {}))] : [];
      });
      const propertyNames = schema.allOf.flatMap((item) => {
        const branch = objectSchema(document, item);
        return branch?.propertyNames ? [branch.propertyNames] : [];
      });
      const common = Object.fromEntries(
        Object.entries(selected as Record<string, unknown>).filter(
          ([property]) =>
            (required.has(property) || closed.every((properties) => properties.has(property))) &&
            propertyNames.every((constraint) => schemaMatches(document, property, constraint)),
        ),
      );
      if (schemaMatches(document, common, schema)) return common;
      if (schemaMatches(document, {}, schema)) return {};
      return null;
    }
    const selected = schemaExample(
      document,
      mergeScalarSchemas(document, [schema, ...schema.allOf], name),
      depth + 1,
      name,
    );
    if (schemaMatches(document, selected, schema)) return selected;
    for (const item of schema.allOf) {
      const candidate = schemaExample(document, item, depth + 1, name);
      if (schemaMatches(document, candidate, schema)) return candidate;
    }
    return null;
  }

  if (Array.isArray(schema.type)) {
    const types = schema.type.filter((value) => value !== "null");
    if (schema.type.includes("null") || types.some((value) => value !== "integer" && value !== "number")) {
      for (const candidateType of schema.type) {
        const candidate = schemaExample(document, { ...schema, type: candidateType }, depth + 1, name);
        if (schemaMatches(document, candidate, schema)) return candidate;
      }
      return null;
    }
  }
  const type = Array.isArray(schema.type)
    ? schema.type.includes("number") &&
      schema.type.every((value) => value === "integer" || value === "number" || value === "null")
      ? "number"
      : schema.type.find((value) => value !== "null")
    : schema.type;
  if (schema.type === "null" || (Array.isArray(schema.type) && schema.type.every((value) => value === "null")))
    return null;
  if (type === "array") {
    const length = Math.min(
      schema.maxItems ?? Number.POSITIVE_INFINITY,
      Math.max(schema.prefixItems?.length ?? 0, 1, schema.minItems ?? 0),
    );
    const prefix = (schema.prefixItems ?? [])
      .slice(0, length)
      .map((item) => schemaExample(document, item, depth + 1, name));
    return [
      ...prefix,
      ...Array.from({ length: Math.max(0, length - prefix.length) }, () =>
        schemaExample(document, schema.items, depth + 1, name),
      ),
    ];
  }
  if (type === "boolean") return false;
  if (type === "integer" || type === "number") {
    const multiple = schema.multipleOf && schema.multipleOf > 0 ? schema.multipleOf : undefined;
    const alignment = (() => {
      if (!multiple || type !== "integer") return multiple;
      const [coefficient = "", exponent = "0"] = String(multiple).toLowerCase().split("e");
      const scale = 10 ** Math.max(0, (coefficient.split(".")[1] ?? "").length - Number(exponent));
      const numerator = Math.round(multiple * scale);
      const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
      return numerator / gcd(numerator, scale);
    })();
    const step = alignment ?? 1;
    const minimums = [
      ...(schema.minimum === undefined ? [] : [{ exclusive: schema.exclusiveMinimum === true, value: schema.minimum }]),
      ...(typeof schema.exclusiveMinimum === "number" ? [{ exclusive: true, value: schema.exclusiveMinimum }] : []),
    ];
    const maximums = [
      ...(schema.maximum === undefined ? [] : [{ exclusive: schema.exclusiveMaximum === true, value: schema.maximum }]),
      ...(typeof schema.exclusiveMaximum === "number" ? [{ exclusive: true, value: schema.exclusiveMaximum }] : []),
    ];
    const minimum = minimums.sort((a, b) => b.value - a.value || Number(b.exclusive) - Number(a.exclusive))[0];
    const maximum = maximums.sort((a, b) => a.value - b.value || Number(b.exclusive) - Number(a.exclusive))[0];
    const round = (candidate: number) =>
      type === "integer" && Number.isInteger(candidate) ? candidate : Number(candidate.toPrecision(15));
    if (type === "number" && !multiple && minimum?.exclusive && maximum?.exclusive && !scalarMatches(1, schema)) {
      const midpoint = (minimum.value + maximum.value) / 2;
      const rounded = round(midpoint);
      if (scalarMatches(midpoint, schema)) return midpoint;
      if (scalarMatches(rounded, schema)) return rounded;
    }
    let value = 1;
    if (minimum && (value < minimum.value || (minimum.exclusive && value <= minimum.value))) {
      value = minimum.value;
      if (type === "integer") value = Math.ceil(value);
      if (alignment) value = round(Math.ceil(value / alignment) * alignment);
      if (minimum.exclusive && value <= minimum.value) value = round(value + step);
    } else {
      if (type === "integer") value = Math.ceil(value);
      if (alignment) value = round(Math.ceil(value / alignment) * alignment);
    }
    if (maximum && (value > maximum.value || (maximum.exclusive && value >= maximum.value))) {
      value = maximum.value - (maximum.exclusive ? step : 0);
      if (type === "integer") value = maximum.exclusive ? Math.ceil(maximum.value) - 1 : Math.floor(maximum.value);
      if (alignment) value = round(Math.floor(value / alignment) * alignment);
    }
    if (minimum && (value < minimum.value || (minimum.exclusive && value <= minimum.value))) {
      value = minimum.value;
      if (type === "integer") value = Math.ceil(value);
      if (alignment) value = round(Math.ceil(value / alignment) * alignment);
      if (minimum.exclusive && value <= minimum.value) value = round(value + step);
    }
    return scalarMatches(value, schema) ? value : null;
  }
  if (type === "object" || schema.properties) {
    const properties = Object.entries(schema.properties ?? {}).filter(
      ([property]) => !schema.propertyNames || schemaMatches(document, property, schema.propertyNames),
    );
    const required = new Set(schema.required ?? []);
    const selected =
      schema.maxProperties === undefined
        ? properties
        : [
            ...properties.filter(([property]) => required.has(property)),
            ...properties.filter(([property]) => !required.has(property)),
          ].slice(0, schema.maxProperties);
    const minimum = Math.min(schema.minProperties ?? 0, properties.length);
    if (selected.length < minimum) {
      const names = new Set(selected.map(([property]) => property));
      selected.push(...properties.filter(([property]) => !names.has(property)).slice(0, minimum - selected.length));
    }
    const values = new Map(
      selected.map(([name, property]) => [name, schemaExample(document, property, depth + 1, name)]),
    );
    const additional =
      typeof schema.additionalProperties === "object" ? schema.additionalProperties : { type: "string" };
    for (const property of required) {
      if (!values.has(property)) values.set(property, schemaExample(document, additional, depth + 1, property));
    }
    const target =
      schema.maxProperties === 0
        ? 0
        : Math.max(schema.minProperties ?? 0, values.size || (typeof schema.additionalProperties === "object" ? 1 : 0));
    const key =
      !schema.propertyNames || schemaMatches(document, "key", schema.propertyNames)
        ? "key"
        : String(schemaExample(document, schema.propertyNames, depth + 1, "key"));
    for (let index = 1; values.size < target; index += 1) {
      const alternatives = (schema.propertyNames?.enum ?? []).filter(
        (candidate): candidate is string => typeof candidate === "string" && !values.has(candidate),
      );
      const candidates = [...(index === 1 ? [key] : [`${key}${index}`]), ...alternatives];
      const property = candidates.find(
        (candidate) =>
          !values.has(candidate) && (!schema.propertyNames || schemaMatches(document, candidate, schema.propertyNames)),
      );
      if (!property) break;
      values.set(property, schemaExample(document, additional, depth + 1, property));
    }
    return Object.fromEntries(values);
  }
  return stringExample(schema, name);
}

function isBinarySchema(document: OpenApiDocument, input: JsonSchema | undefined, depth = 0): boolean {
  if (!input || depth > 8) return false;
  const schema = resolveSchema(document, input) ?? input;
  return (
    schema.format === "binary" ||
    [...(schema.allOf ?? []), ...(schema.anyOf ?? []), ...(schema.oneOf ?? [])].some((item) =>
      isBinarySchema(document, item, depth + 1),
    )
  );
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
  if (schema.minProperties !== undefined) constraints.push(`minimum properties ${schema.minProperties}`);
  if (schema.maxProperties !== undefined) constraints.push(`maximum properties ${schema.maxProperties}`);
  if (schema.multipleOf !== undefined) constraints.push(`multiple of ${schema.multipleOf}`);
  if (schema.pattern) constraints.push(`pattern ${schema.pattern}`);
  if (schema.default !== undefined) constraints.push(`default ${String(schema.default)}`);
  const nested = [
    ...(schema.allOf ?? []),
    ...(schema.anyOf ?? []),
    ...(schema.oneOf ?? []),
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
  const properties = Object.entries(object?.properties ?? {});
  const fields = properties.flatMap(([name, field]) => {
    const resolved = resolveSchema(document, field);
    if ((direction === "request" && resolved?.readOnly) || (direction === "response" && resolved?.writeOnly)) return [];
    const fieldName = `${prefix}${name}${resolved?.type === "array" ? "[]" : ""}`;
    return [
      { depth, description: resolved?.description, name: fieldName, required: required.has(name), schema: field },
      ...schemaFields(document, field, direction, depth + 1, `${fieldName}.`, seen),
    ];
  });
  if (typeof object?.additionalProperties !== "object") return fields;
  const field = object.additionalProperties;
  const resolved = resolveSchema(document, field);
  if ((direction === "request" && resolved?.readOnly) || (direction === "response" && resolved?.writeOnly))
    return fields;
  const isArray = Array.isArray(resolved?.type) ? resolved.type.includes("array") : resolved?.type === "array";
  const fieldName = `${prefix}[key: string]${isArray ? "[]" : ""}`;
  return [
    ...fields,
    { depth, description: resolved?.description, name: fieldName, required: false, schema: field },
    ...schemaFields(document, field, direction, depth + 1, `${fieldName}.`, seen),
  ];
}

export function requestMedia(operation: ApiOperation): [string, MediaType] | undefined {
  return preferredMedia(operation.requestBody?.content);
}

function successfulResponses(operation: ApiOperation): ResponseObject[] {
  const responses = Object.entries(operation.responses ?? {});
  const exact = responses.filter(([status]) => /^2\d\d$/.test(status));
  return (exact.length ? exact : responses.filter(([status]) => /^2xx$/i.test(status))).map(([, response]) => response);
}

export function successMediaEntries(operation: ApiOperation): Array<[string, MediaType]> {
  return successfulResponses(operation).flatMap((response) => {
    const media = preferredMedia(response.content);
    return media ? [media] : [];
  });
}

export function successMedia(operation: ApiOperation): [string, MediaType] | undefined {
  return successMediaEntries(operation)[0];
}

function withoutSchemaDescriptions(value: JsonSchema): JsonSchema {
  const schema = { ...value };
  delete schema.description;
  if (schema.properties) {
    schema.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([name, item]) => [name, withoutSchemaDescriptions(item)]),
    );
  }
  if (schema.items) schema.items = withoutSchemaDescriptions(schema.items);
  if (schema.oneOf) schema.oneOf = schema.oneOf.map(withoutSchemaDescriptions);
  if (schema.anyOf) schema.anyOf = schema.anyOf.map(withoutSchemaDescriptions);
  if (schema.allOf) schema.allOf = schema.allOf.map(withoutSchemaDescriptions);
  if (typeof schema.additionalProperties === "object") {
    schema.additionalProperties = withoutSchemaDescriptions(schema.additionalProperties);
  }
  return schema;
}

export function successSchema(document: OpenApiDocument, operation: ApiOperation): JsonSchema | undefined {
  const schemas: JsonSchema[] = [];
  const shapes: JsonSchema[] = [];
  for (const response of successfulResponses(operation)) {
    const preferred = preferredMedia(response.content);
    if (!preferred) {
      const schema = { type: "null" } satisfies JsonSchema;
      if (!shapes.some((existing) => schemasEqual(existing, schema))) {
        schemas.push(schema);
        shapes.push(schema);
      }
      continue;
    }
    const [, media] = preferred;
    if (!media.schema) continue;
    const shape = withoutSchemaDescriptions(resolveSchema(document, media.schema) ?? media.schema);
    if (shapes.some((existing) => schemasEqual(existing, shape))) continue;
    schemas.push(media.schema);
    shapes.push(shape);
  }
  return schemas.length > 1 ? { oneOf: schemas } : schemas[0];
}

function authoredSchemaExample(
  document: OpenApiDocument,
  input: JsonSchema | undefined,
  depth = 0,
): { found: boolean; nested?: boolean; value?: unknown } {
  if (depth > 8) return { found: false };
  const schema = resolveSchema(document, input);
  if (!schema) return { found: false };
  if (schema.example !== undefined) return { found: true, value: schema.example };
  const union = schema.oneOf ?? schema.anyOf;
  if (union?.length) {
    const authored = authoredSchemaExample(document, union[0], depth + 1);
    return authored.found ? { ...authored, nested: true } : authored;
  }
  for (const item of schema.allOf ?? []) {
    const authored = authoredSchemaExample(document, item, depth + 1);
    if (authored.found) return { ...authored, nested: true };
  }
  return { found: false };
}

function exampleObjectSchema(
  document: OpenApiDocument,
  input: JsonSchema | undefined,
  value?: unknown,
  depth = 0,
): JsonSchema | undefined {
  if (depth > 8) return input;
  const schema = resolveSchema(document, input);
  if (!schema) return undefined;
  const union = schema.oneOf ?? schema.anyOf;
  const selected = union?.find((item) => schemaMatches(document, value, item)) ?? union?.[0];
  return objectSchema(document, {
    ...schema,
    allOf: [
      ...(schema.allOf ?? []).map((item) => exampleObjectSchema(document, item, value, depth + 1) ?? item),
      ...(selected ? [exampleObjectSchema(document, selected, value, depth + 1) ?? selected] : []),
    ],
    anyOf: undefined,
    oneOf: undefined,
  });
}

function requestBodyExampleValue(document: OpenApiDocument, request: [string, MediaType]): unknown {
  const authored =
    request[1].example !== undefined
      ? { found: true, value: request[1].example }
      : authoredSchemaExample(document, request[1].schema);
  const generated = !authored.found || authored.nested;
  let example = generated ? schemaExample(document, request[1].schema) : authored.value;
  if (generated && example && typeof example === "object" && !Array.isArray(example)) {
    const object = exampleObjectSchema(document, request[1].schema, example);
    example = { ...example };
    const named = Object.entries(object?.properties ?? {});
    const properties = named.filter(([, property]) => !resolveSchema(document, property)?.readOnly);
    const required = new Set(object?.required ?? []);
    const values = example as Record<string, unknown>;
    const present = properties.filter(([name]) => Object.hasOwn(values, name));
    const selected = present.some(([name]) => required.has(name))
      ? present.filter(([name]) => required.has(name))
      : present.slice(0, 1);
    const minimum = object?.minProperties ?? 0;
    if (selected.length < minimum) {
      const names = new Set(selected.map(([name]) => name));
      selected.push(
        ...properties
          .filter(([name]) => Object.hasOwn(values, name) && !names.has(name))
          .slice(0, minimum - selected.length),
      );
    }
    const selectedNames = new Set(selected.map(([name]) => name));
    for (const name of required) {
      const property = object?.properties?.[name];
      if (
        Object.hasOwn(values, name) &&
        !selectedNames.has(name) &&
        (!property || !resolveSchema(document, property)?.readOnly)
      ) {
        selected.push([name, {}]);
        selectedNames.add(name);
      }
    }
    for (const name of Object.keys(values)) {
      if (selected.length >= (object?.minProperties ?? 0)) break;
      const property = object?.properties?.[name];
      if (!selectedNames.has(name) && (!property || !resolveSchema(document, property)?.readOnly)) {
        selected.push([name, {}]);
      }
    }
    if (selected.length < minimum) {
      const writable = schemaExample(document, {
        ...object,
        properties: Object.fromEntries(properties),
        required: [...required].filter((name) => properties.some(([property]) => property === name)),
      });
      if (writable && typeof writable === "object" && !Array.isArray(writable)) {
        Object.assign(values, writable);
        for (const name of Object.keys(writable)) {
          if (selected.length >= minimum) break;
          if (!selectedNames.has(name)) selected.push([name, {}]);
        }
      }
    }
    if (object?.maxProperties !== undefined) selected.splice(object.maxProperties);
    if (selected.length) example = Object.fromEntries(selected.map(([name]) => [name, values[name]]));
    else if (named.length) example = {};
  }
  if (authored.nested && authored.value !== undefined) {
    const combined =
      authored.value !== null &&
      typeof authored.value === "object" &&
      !Array.isArray(authored.value) &&
      example !== null &&
      typeof example === "object" &&
      !Array.isArray(example)
        ? { ...example, ...authored.value }
        : authored.value;
    if (schemaMatches(document, combined, request[1].schema ?? {})) example = combined;
  }
  return example;
}

export function requestBodyExample(document: OpenApiDocument, operation: ApiOperation): string {
  const request = requestMedia(operation);
  if (!request) return "";
  const example = requestBodyExampleValue(document, request);
  return request[0].startsWith("text/") && typeof example === "string" ? example : JSON.stringify(example, null, 2);
}

function parameterValue(document: OpenApiDocument, parameter: Parameter, value: string): unknown {
  const schema = resolveSchema(document, parameter.schema);
  const type = Array.isArray(schema?.type) ? schema.type.find((item) => item !== "null") : schema?.type;
  if (type !== "array" && type !== "object" && !schema?.properties) return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`Enter valid JSON for ${parameter.name}.`);
  }
}

function formEntries(values: Record<string, unknown>): Array<[string, unknown]> {
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
    body,
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
    if (value === undefined) return schemaExample(document, parameter.schema, 0, parameter.name);
    try {
      return parameterValue(document, parameter, value);
    } catch {
      return value;
    }
  };
  let path = operation.path;
  for (const parameter of (operation.parameters ?? []).filter((item) => item.in === "path")) {
    const value = serializeSimplePath(parameterValueOrExample(parameter), parameter.explode, parameter.allowReserved);
    path = path.replace(`{${parameter.name}}`, value);
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
    .filter(Boolean)
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
    const parsed = JSON.parse(body ?? "") as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) bodyValues = parsed as Record<string, unknown>;
  } catch {
    // Non-JSON request bodies are emitted verbatim below.
  }
  const formatFormValue = (value: unknown) => (typeof value === "string" ? value : JSON.stringify(value));
  const contentType = request?.[0];
  const form = formEntries(bodyValues);
  const multipart =
    contentType === "multipart/form-data"
      ? [...new Set([...Object.keys(bodyValues), ...Object.keys(files)])].map((name) => {
          const binary = files[name] || isBinarySchema(document, properties[name]);
          const bodyFile = bodyValues[name];
          const value = binary
            ? `@${files[name]?.name ?? (typeof bodyFile === "string" && bodyFile !== "..." ? bodyFile.replace(/^@/, "") : "path/to/file")}`
            : formatFormValue(bodyValues[name]);
          return `  ${binary ? "-F" : "--form-string"} ${shellQuote(`${name}=${value}`)}`;
        })
      : [];
  const hasBodyArgument =
    ((contentType === "application/json" || contentType?.endsWith("+json")) && Boolean(body)) ||
    (contentType === "application/x-www-form-urlencoded" && form.length > 0) ||
    (contentType === "multipart/form-data" && multipart.length > 0) ||
    (contentType !== undefined &&
      !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(contentType) &&
      body !== undefined);
  const inferredPost = operation.method === "post" && hasBodyArgument;
  return [
    `curl${/[{}[\]]/.test(url) ? " -g" : ""} ${/^[A-Za-z0-9._~:/{}%+-]+$/.test(url) ? url : shellQuote(url)}`,
    operation.method === "get"
      ? hasBodyArgument
        ? "  -X GET"
        : ""
      : !inferredPost
        ? `  -X ${operation.method.toUpperCase()}`
        : "",
    authentication
      ? environment
        ? `  -H "${authentication.header}: ${authentication.prefix}$${environment}"`
        : `  -H ${shellQuote(`${authentication.header}: ${authentication.prefix}${apiKey}`)}`
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
          : `  -H ${shellQuote(`${parameter.name}: ${typeof value === "string" ? value : serializeSimplePath(value, parameter.explode)}`)}`;
      }),
    request && request[0] !== "multipart/form-data" ? `  -H ${shellQuote(`Content-Type: ${request[0]}`)}` : "",
    request && (request[0] === "application/json" || request[0].endsWith("+json")) && body
      ? `  -d ${shellQuote(body)}`
      : "",
    request?.[0] === "application/x-www-form-urlencoded"
      ? form
          .map(([name, value]) => `  --data-urlencode ${shellQuote(`${name}=${formatFormValue(value)}`)}`)
          .join(" \\\n")
      : "",
    request &&
    body !== undefined &&
    !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(request[0])
      ? `  -d ${shellQuote(body)}`
      : "",
    request?.[0] === "multipart/form-data" ? multipart.join(" \\\n") : "",
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
    values = {},
  }: {
    apiKey?: string;
    body?: string;
    files?: Record<string, File>;
    origin: string;
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
    .filter(Boolean)
    .join("&");
  const baseUrl = resolveServerUrl(document, origin, operation);
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}${query ? `?${query}` : ""}`;
  const request = requestMedia(operation);
  const success = successMedia(operation);
  const authentication = getAuthentication(document, operation);
  const headers: Record<string, string> = success ? { Accept: success[0] } : {};
  if (apiKey && authentication) headers[authentication.header] = `${authentication.prefix}${apiKey}`;
  if (request && request[0] !== "multipart/form-data") headers["Content-Type"] = request[0];
  for (const parameter of parameters.filter((item) => item.in === "header")) {
    const value = values[`header:${parameter.name}`];
    if (!value) continue;
    const parsed = parameterValue(document, parameter, value);
    headers[parameter.name] = typeof parsed === "string" ? parsed : serializeSimplePath(parsed, parameter.explode);
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
      if (isBinarySchema(document, requestSchema?.properties?.[name]) || value === null || value === undefined)
        continue;
      form.append(name, typeof value === "string" ? value : JSON.stringify(value));
    }
    for (const [name, file] of Object.entries(files)) form.append(name, file);
    const missingFile = Object.entries(requestSchema?.properties ?? {}).find(
      ([name, schema]) => isBinarySchema(document, schema) && requestSchema?.required?.includes(name) && !files[name],
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
