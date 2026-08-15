// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { rm } from "node:fs/promises";
import type { OpenApiConfig } from "../config";
import type { ApiOperation, JsonSchema, MediaType, OpenApiDocument, SdkArgument } from "../openapi";
import {
  allocateSdkIdentifiers,
  expandServerUrl,
  getAuthentication,
  getOperations,
  objectSchema,
  requestMedia,
  resolveSchema,
  resolveServerUrl,
  sdkArguments,
  sdkIdentifier as snake,
  successMedia,
  successMediaEntries,
  successSchema,
} from "../openapi";

interface PythonOperation extends ApiOperation {
  arguments: SdkArgument[];
  contentType?: string;
  name: string;
  responseName?: string;
  responseSchema?: JsonSchema;
  responseText?: boolean;
}

function pascal(value: string): string {
  const name = snake(value);
  return `${name.startsWith("_") ? "_" : ""}${name
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")}`;
}

function quote(value: unknown): string {
  if (value === null) return "None";
  if (value === true) return "True";
  if (value === false) return "False";
  return JSON.stringify(value);
}

function pythonDocstringText(value: string, indentation = ""): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll('"""', '\\"\\"\\"')
    .replaceAll("\r", "")
    .replaceAll("\n", `\n${indentation}`);
}

function isNullable(document: OpenApiDocument, schema: JsonSchema, depth = 0): boolean {
  if (depth > 10) return false;
  const union = schema.oneOf ?? schema.anyOf;
  let nullable = false;
  if (schema.const !== undefined) nullable = schema.const === null;
  else if (schema.enum) nullable = schema.enum.includes(null);
  else if (schema.nullable === true) nullable = true;
  else if (schema.type !== undefined)
    nullable = schema.type === "null" || (Array.isArray(schema.type) && schema.type.includes("null"));
  else if (union)
    nullable = union.some((variant) => isNullable(document, resolveSchema(document, variant) ?? variant, depth + 1));
  else nullable = !schema.properties && !schema.required;
  return (
    nullable &&
    (schema.allOf ?? []).every((item) => {
      const resolved = resolveSchema(document, item) ?? item;
      return isNullable(document, resolved, depth + 1);
    })
  );
}

function literalValues(document: OpenApiDocument, input: JsonSchema, depth = 0): unknown[] | undefined {
  if (depth > 10) return undefined;
  const schema = resolveSchema(document, input) ?? input;
  if (schema.const !== undefined) return [schema.const];
  if (schema.enum?.length) return schema.enum;
  const variants = schema.oneOf ?? schema.anyOf;
  if (!variants?.length) return undefined;
  const values = variants.map((variant) => literalValues(document, variant, depth + 1));
  return values.every((value) => value !== undefined) ? values.flatMap((value) => value ?? []) : undefined;
}

function pythonType(document: OpenApiDocument, input: JsonSchema | undefined, nested = false): string {
  const schema = resolveSchema(document, input);
  if (!schema) return "Any";
  const nullable = isNullable(document, schema);
  const result = (type: string) =>
    nullable && type !== "Any" && !type.split(" | ").includes("None") ? `${type} | None` : type;
  if (schema.const === null) return "None";
  if (schema.const !== undefined) return result(`Literal[${quote(schema.const)}]`);
  if (schema.enum?.length) return result(`Literal[${schema.enum.map(quote).join(", ")}]`);
  const variants = schema.oneOf ?? schema.anyOf;
  if (variants?.length) {
    if (variants.every((item) => objectSchema(document, item)?.properties)) return result("dict[str, Any]");
    const literalVariants = literalValues(document, schema);
    if (literalVariants) {
      const values = [...new Set(literalVariants)];
      const nonNull = values.filter((value) => value !== null);
      return result(
        `${nonNull.length ? `Literal[${nonNull.map(quote).join(", ")}]` : ""}${values.includes(null) ? `${nonNull.length ? " | " : ""}None` : ""}`,
      );
    }
    const types = [...new Set(variants.flatMap((item) => pythonType(document, item, true).split(" | ")))];
    if (schema.oneOf === undefined && schema.anyOf && types.includes("Any")) return "Any";
    return result([...types.filter((type) => type !== "None"), ...types.filter((type) => type === "None")].join(" | "));
  }
  const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
  if (type === "null") return "None";
  if (schema.format === "binary") return result("BinaryIO");
  if (type === "string") return result("str");
  if (type === "integer") return result("int");
  if (type === "number") return result("float");
  if (type === "boolean") return result("bool");
  if (type === "array") return result(`list[${pythonType(document, schema.items, true)}]`);
  if (type === "object" || schema.properties) return result(nested ? "dict[str, Any]" : "dict[str, Any]");
  return result("Any");
}

function isTextResponse(document: OpenApiDocument, media: [string, MediaType] | undefined): boolean {
  if (!media || media[0] === "application/json" || media[0].endsWith("+json")) return false;
  const schema = resolveSchema(document, media[1].schema);
  if (schema?.format === "binary") return false;
  if (media[0].startsWith("text/")) return true;
  const type = Array.isArray(schema?.type) ? schema.type.find((item) => item !== "null") : schema?.type;
  return Boolean(type === "string" || schema?.enum?.every((value) => typeof value === "string"));
}

function responseMode(document: OpenApiDocument, media: [string, MediaType]): "binary" | "json" | "text" {
  if (media[0] === "application/json" || media[0].endsWith("+json")) return "json";
  return isTextResponse(document, media) ? "text" : "binary";
}

function validateOperation(document: OpenApiDocument, operation: ApiOperation): void {
  const unsupported = (operation.parameters ?? []).find(
    (parameter) => parameter.in === "path" && parameter.style && parameter.style !== "simple",
  );
  if (unsupported) throw new Error(`Unsupported path style: ${unsupported.style}`);
  if (operation.parameters?.some((parameter) => parameter.in === "query" && parameter.allowReserved)) {
    throw new Error("Unsupported query parameter: allowReserved");
  }
  const structuredParameter = operation.parameters?.find((parameter) => {
    const schema = resolveSchema(document, parameter.schema);
    const type = Array.isArray(schema?.type) ? schema.type.find((item) => item !== "null") : schema?.type;
    return (
      (parameter.in === "header" || parameter.in === "cookie") &&
      (type === "array" || type === "object" || schema?.properties)
    );
  });
  if (structuredParameter) {
    throw new Error(`Unsupported ${structuredParameter.in} parameter: ${structuredParameter.name}`);
  }
  const media = requestMedia(operation);
  if (media && !media[1].schema) throw new Error(`Unsupported schema-less request body: ${media[0]}`);
  if (media?.[1].encoding && Object.keys(media[1].encoding).length) {
    throw new Error(`Unsupported request body encoding: ${media[0]}`);
  }
  const responseModes = new Set(successMediaEntries(operation).map((item) => responseMode(document, item)));
  if (responseModes.size > 1) {
    throw new Error(`Unsupported mixed successful response media: ${operation.method.toUpperCase()} ${operation.path}`);
  }
}

function prepare(document: OpenApiDocument): Map<string, PythonOperation[]> {
  const resources = new Map<string, PythonOperation[]>();
  for (const operation of getOperations(document)) {
    validateOperation(document, operation);
    const media = successMedia(operation);
    const responseSchema = successSchema(document, operation);
    const resource = operation.resource;
    const values = resources.get(resource) ?? [];
    const name = operation.sdkMethod;
    values.push({
      ...operation,
      arguments: sdkArguments(document, operation),
      contentType: requestMedia(operation)?.[0],
      name,
      responseName: responseSchema ? `${pascal(operation.tag)}${pascal(name)}Response` : undefined,
      responseSchema,
      responseText: isTextResponse(document, media),
    });
    resources.set(resource, values);
  }
  return resources;
}

function docstring(document: OpenApiDocument, operation: PythonOperation, returnType: string): string {
  const lines = [`        """${pythonDocstringText(operation.summary ?? operation.name, "        ")}.`];
  if (operation.description) lines.push("", `        ${pythonDocstringText(operation.description, "        ")}`);
  if (operation.arguments.length) {
    lines.push("", "        Args:");
    for (const argument of operation.arguments) {
      lines.push(
        `            ${argument.pythonName} (${pythonType(document, argument.schema)}${argument.required ? "" : ", optional"}): ${pythonDocstringText(argument.description, "                ")}`,
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
      if (!argument.required && argument.location === "body") {
        return `${argument.pythonName}: ${type} | NotGiven = NOT_GIVEN`;
      }
      const defaultValue = argument.required ? "" : " = None";
      return `${argument.pythonName}: ${argument.required || type.split(" | ").includes("None") ? type : `${type} | None`}${defaultValue}`;
    }),
  ].join(", ");
  const returnType = operation.responseName ?? pythonType(document, operation.responseSchema);
  const serverOverride = operation.server && operation.server !== document.servers?.[0];
  const server = serverOverride && operation.server ? expandServerUrl(operation.server) : undefined;
  const relativeServer = server && !/^[a-z][a-z\d+.-]*:\/\//i.test(server);
  const operationPath =
    serverOverride && server && !relativeServer
      ? `${resolveServerUrl(document, "http://localhost:3000", operation)}/${operation.path.replace(/^\//, "")}`
      : operation.path;
  let path = operationPath;
  for (const argument of pathArguments) {
    path = path.replace(
      `{${argument.name}}`,
      `{_path_parameter(${argument.pythonName}, explode=${argument.explode === true ? "True" : "False"}, allow_reserved=${argument.allowReserved === true ? "True" : "False"})}`,
    );
  }
  const query = operation.arguments.filter((argument) => argument.location === "query");
  const headers = operation.arguments.filter((argument) => argument.location === "header");
  const cookies = operation.arguments.filter((argument) => argument.location === "cookie");
  const body = operation.arguments.filter((argument) => argument.location === "body");
  const binary = body.filter((argument) => resolveSchema(document, argument.schema)?.format === "binary");
  const data = body.filter((argument) => resolveSchema(document, argument.schema)?.format !== "binary");
  const wholeBody = body.find((argument) => argument.wholeBody);
  const multipartBody =
    wholeBody && operation.contentType === "multipart/form-data" ? objectSchema(document, wholeBody.schema) : undefined;
  const multipartBinary = Object.entries(multipartBody?.properties ?? {})
    .filter(([, schema]) => resolveSchema(document, schema)?.format === "binary")
    .map(([name]) => name);
  const json = operation.contentType === "application/json" || operation.contentType?.endsWith("+json");
  const authentication = getAuthentication(document, operation);
  const options = [
    relativeServer ? `server=${quote(server)}` : "",
    authentication ? `auth=(${quote(authentication.header)}, ${quote(authentication.prefix)})` : "",
    operation.responseText ? "text=True" : "",
    query.length
      ? `params=[${query
          .map(
            (item) =>
              `*_query_parameter(${quote(item.name)}, ${item.pythonName}, style=${quote(item.style ?? "form")}, explode=${item.explode === false ? "False" : "True"})`,
          )
          .join(", ")}]`
      : "",
    headers.length ||
    (operation.contentType && !["application/json", "multipart/form-data"].includes(operation.contentType))
      ? `headers={${[
          ...headers.map((item) => `${quote(item.name)}: ${item.pythonName}`),
          ...(operation.contentType && !["application/json", "multipart/form-data"].includes(operation.contentType)
            ? [`"Content-Type": ${quote(operation.contentType)}`]
            : []),
        ].join(", ")}}`
      : "",
    cookies.length ? `cookies={${cookies.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}` : "",
    ["application/x-www-form-urlencoded", "multipart/form-data"].includes(operation.contentType ?? "") &&
    (data.length || multipartBody)
      ? wholeBody
        ? `data={key: value for key, value in ${wholeBody.pythonName}.items() if key not in ${JSON.stringify(multipartBinary)}}`
        : `data={${data.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}`
      : "",
    binary.length || multipartBinary.length
      ? wholeBody
        ? `files={key: ${wholeBody.pythonName}[key] for key in ${JSON.stringify(multipartBinary)} if key in ${wholeBody.pythonName}}`
        : `files={${binary.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}`
      : "",
    json && body.length
      ? wholeBody
        ? `json=${wholeBody.pythonName}`
        : `json={${body.map((item) => `${quote(item.name)}: ${item.pythonName}`).join(", ")}}`
      : "",
    operation.contentType &&
    !json &&
    !["application/x-www-form-urlencoded", "multipart/form-data"].includes(operation.contentType) &&
    wholeBody
      ? `content=${wholeBody.pythonName}`
      : "",
  ].filter(Boolean);
  const pathValue = path.includes("{") ? `f${quote(path)}` : quote(path);
  const call = `${async ? "await " : ""}self._client.request(${quote(operation.method.toUpperCase())}, ${pathValue}${options.length ? `, ${options.join(", ")}` : ""})`;
  const result = `cast(${returnType}, ${call})`;
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
  const clientImports = [
    ...(body.includes("NotGiven") ? ["NOT_GIVEN"] : []),
    "AsyncAPIClient",
    ...(body.includes("NotGiven") ? ["NotGiven"] : []),
    "SyncAPIClient",
    ...(body.includes("_path_parameter(") ? ["_path_parameter"] : []),
    ...(body.includes("_query_parameter(") ? ["_query_parameter"] : []),
  ];
  const clientImport = `from .._client import (\n${clientImports.map((name) => `    ${name},`).join("\n")}\n)\n`;
  const tag = pythonDocstringText(operations[0]?.tag ?? className, "    ");
  return `from __future__ import annotations\n\n${typingSource}${clientImport}${imports}\nclass ${className}:\n    """${tag} API operations."""\n\n    def __init__(self, client: SyncAPIClient) -> None:\n        self._client = client\n\n${methods}\n\n\nclass Async${className}:\n    """Asynchronous ${tag} API operations."""\n\n    def __init__(self, client: AsyncAPIClient) -> None:\n        self._client = client\n\n${asyncMethods}\n`;
}

function modelSource(document: OpenApiDocument, resources: Map<string, PythonOperation[]>): string {
  const classes: string[] = [];
  const defined = new Set<string>();
  const generated = new Set<string>();
  const references = new Map<string, string>();

  function possibleTypes(input: JsonSchema, depth = 0): { object: boolean; other: boolean } {
    const schema = resolveSchema(document, input) ?? input;
    if (depth > 10) return { object: true, other: true };
    const types = Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];
    let result = types.length
      ? { object: types.includes("object"), other: types.some((type) => type !== "object" && type !== "null") }
      : { object: true, other: true };
    if (schema.const !== undefined) {
      result = {
        object: schema.const !== null && typeof schema.const === "object" && !Array.isArray(schema.const),
        other: schema.const !== null && (typeof schema.const !== "object" || Array.isArray(schema.const)),
      };
    } else if (schema.enum) {
      result = {
        object: schema.enum.some((value) => value !== null && typeof value === "object" && !Array.isArray(value)),
        other: schema.enum.some((value) => value !== null && (typeof value !== "object" || Array.isArray(value))),
      };
    }
    const union = schema.oneOf ?? schema.anyOf;
    if (union) {
      const variants = union.map((item) => possibleTypes(item, depth + 1));
      result.object &&= variants.some((item) => item.object);
      result.other &&= variants.some((item) => item.other);
    }
    for (const item of schema.allOf ?? []) {
      const nested = possibleTypes(item, depth + 1);
      result.object &&= nested.object;
      result.other &&= nested.other;
    }
    return result;
  }

  function objectUnion(
    input: JsonSchema | undefined,
    depth = 0,
    objectOnly = false,
  ): { nullable: boolean; variants: JsonSchema[] } | undefined {
    const schema = resolveSchema(document, input);
    if (!schema || depth > 10) return undefined;
    const union = schema.oneOf ?? schema.anyOf;
    if (!union?.length) {
      for (const [index, item] of (schema.allOf ?? []).entries()) {
        const shared = { ...schema, allOf: schema.allOf?.filter((_, itemIndex) => itemIndex !== index) };
        const sharedTypes = possibleTypes(shared);
        const nested = objectUnion(item, depth + 1, objectOnly || (sharedTypes.object && !sharedTypes.other));
        if (!nested) continue;
        const variants: JsonSchema[] = [];
        const nullable = isNullable(document, schema);
        for (const variant of nested.variants) {
          const composed = {
            ...shared,
            allOf: [...(shared.allOf ?? []), variant],
            required: [...new Set([...(shared.required ?? []), ...(variant.required ?? [])])],
          };
          const expanded = objectUnion(composed, depth + 1, objectOnly);
          if (expanded) {
            variants.push(...expanded.variants);
          } else {
            const object = objectSchema(document, composed);
            if (!object?.properties) return undefined;
            variants.push(object);
          }
        }
        return variants.length ? { nullable, variants } : undefined;
      }
      return undefined;
    }
    const shared = { ...schema };
    delete shared.oneOf;
    delete shared.anyOf;
    const sharedAllOf = shared.allOf ?? [];
    const sharedTypes = possibleTypes(shared);
    const constrained = objectOnly || (sharedTypes.object && !sharedTypes.other);
    const objects: JsonSchema[] = [];
    const nullable = isNullable(document, schema);
    for (const variant of union) {
      const resolved = resolveSchema(document, variant) ?? variant;
      if (
        resolved.const === null ||
        (resolved.enum?.length === 1 && resolved.enum[0] === null) ||
        resolved.type === "null" ||
        (Array.isArray(resolved.type) && resolved.type.length === 1 && resolved.type[0] === "null")
      ) {
        continue;
      }
      const types = possibleTypes(resolved);
      if (!types.object) {
        if (constrained) continue;
        return undefined;
      }
      if (types.other && !constrained) return undefined;
      const nested = objectUnion(resolved, depth + 1, constrained);
      const variants = nested?.variants ?? [resolved];
      for (const item of variants) {
        const composed = {
          ...shared,
          allOf: [...sharedAllOf, item as JsonSchema],
          required: [...new Set([...(shared.required ?? []), ...(item.required ?? [])])],
        };
        const expanded = objectUnion(composed, depth + 1, objectOnly);
        if (expanded) {
          objects.push(...expanded.variants);
        } else {
          const merged = objectSchema(document, composed);
          if (!merged?.properties) return undefined;
          objects.push(merged);
        }
      }
    }
    return objects.length ? { nullable, variants: objects } : undefined;
  }

  function modelType(input: JsonSchema | undefined, name: string): string {
    const schema = resolveSchema(document, input);
    if (!schema) return "Any";
    const nullable = isNullable(document, schema);
    const union = objectUnion(schema);
    const effectiveNullable = nullable || (union?.nullable ?? false);
    const result = (type: string) =>
      effectiveNullable && type !== "Any" && !type.split(" | ").includes("None") ? `${type} | None` : type;
    const reference = input?.$ref ? references.get(input.$ref) : undefined;
    if (reference) return defined.has(reference) ? result(reference) : quote(result(reference));
    if (input?.$ref) references.set(input.$ref, name);
    if (schema.format === "binary") return result("bytes");
    if (schema.format === "date-time") return result("str");
    if (union && union.variants.length > 1) {
      const names = union.variants.map((variant, index) => {
        const variantName = `${name}Variant${index + 1}`;
        addModel(variant, variantName);
        return variantName;
      });
      const type = names.join(" | ");
      if (input?.$ref) {
        classes.push(`${name} = ${type}`);
        defined.add(name);
        return result(name);
      }
      return result(type);
    }
    if (!union && (schema.oneOf?.length || schema.anyOf?.length)) return pythonType(document, schema, true);
    const object = objectSchema(document, schema);
    if (object?.properties) {
      addModel(object, name);
      return result(name);
    }
    const type = Array.isArray(schema.type) ? schema.type.find((item) => item !== "null") : schema.type;
    if (type === "array") return result(`list[${modelType(schema.items, `${name}Item`)}]`);
    if (type === "object" && typeof schema.additionalProperties === "object") {
      return result(`dict[str, ${modelType(schema.additionalProperties, `${name}Value`)}]`);
    }
    return pythonType(document, schema, true);
  }

  function addModel(schema: JsonSchema, name: string) {
    if (generated.has(name)) return;
    generated.add(name);
    const required = new Set(schema.required ?? []);
    const properties = Object.entries(schema.properties ?? {}).filter(
      ([, value]) => !resolveSchema(document, value)?.writeOnly,
    );
    const fieldNames = allocateSdkIdentifiers(properties.map(([wireName]) => ({ location: "field", name: wireName })));
    const fields = properties.map(([wireName, value], index) => {
      const fieldName = fieldNames[index] ?? snake(wireName);
      const type = modelType(value, `${name}${pascal(fieldName)}`);
      return `${quote(wireName)}: ${required.has(wireName) ? type : `NotRequired[${type}]`}`;
    });
    classes.push(`${name} = TypedDict(${quote(name)}, {${fields.join(", ")}})`);
    defined.add(name);
  }

  for (const operations of resources.values()) {
    for (const operation of operations) {
      if (!operation.responseName) continue;
      const response = resolveSchema(document, operation.responseSchema) ?? operation.responseSchema;
      const union = objectUnion(response);
      if (union && union.variants.length > 1) {
        const valueName = union.nullable ? `${operation.responseName}Value` : operation.responseName;
        if (operation.responseSchema?.$ref && !references.has(operation.responseSchema.$ref)) {
          references.set(operation.responseSchema.$ref, valueName);
        }
        const names = union.variants.map((variant, index) => {
          const name = `${operation.responseName}Variant${index + 1}`;
          addModel(variant, name);
          return name;
        });
        if (union.nullable) {
          classes.push(`${valueName} = ${names.join(" | ")}`);
          defined.add(valueName);
        }
        classes.push(`${operation.responseName} = ${union.nullable ? `${valueName} | None` : names.join(" | ")}`);
        defined.add(operation.responseName);
        continue;
      }
      if (!union && response && (response.oneOf?.length || response.anyOf?.length)) {
        classes.push(`${operation.responseName} = ${modelType(operation.responseSchema, operation.responseName)}`);
        continue;
      }
      const schema = objectSchema(document, operation.responseSchema);
      const nullableObject = !!schema?.properties && !!response && isNullable(document, response);
      const modelName = nullableObject ? `${operation.responseName}Value` : operation.responseName;
      if (operation.responseSchema?.$ref && !references.has(operation.responseSchema.$ref)) {
        references.set(operation.responseSchema.$ref, modelName);
      }
      if (schema?.properties) {
        addModel(schema, modelName);
        if (nullableObject) classes.push(`${operation.responseName} = ${modelName} | None`);
      } else if (operation.responseSchema) {
        const type = modelType(operation.responseSchema, operation.responseName);
        classes.push(`${operation.responseName} = ${type}`);
      }
    }
  }
  const body = classes.join("\n\n\n");
  const typing = ["Any", "Literal", "NotRequired", "TypedDict"].filter((name) =>
    new RegExp(`\\b${name}\\b`).test(body),
  );
  const typingImport = typing.length ? `from typing import ${typing.join(", ")}\n` : "";
  return `from __future__ import annotations\n\n${typingImport}\n${body}\n`;
}

function clientSource(): string {
  return `from __future__ import annotations

import time
from typing import Any
from urllib.parse import quote

import httpx

from ._exceptions import APIConnectionError, APIError


class NotGiven:
    """Sentinel for omitted request values."""


NOT_GIVEN = NotGiven()


def _path_parameter(value: Any, *, explode: bool, allow_reserved: bool) -> str:
    safe = ":/?#[]@!$&'()*+,;=" if allow_reserved else ""
    def encode(item: Any) -> str:
        return quote(str(item), safe=safe)

    if isinstance(value, dict):
        parts = [f"{encode(key)}={encode(item)}" for key, item in value.items()] if explode else [encode(item) for pair in value.items() for item in pair]
        return ",".join(parts)
    if isinstance(value, (list, tuple)):
        return ",".join(encode(item) for item in value)
    return encode(value)


def _query_parameter(name: str, value: Any, *, style: str, explode: bool) -> list[tuple[str, Any]]:
    if value is None:
        return []
    if isinstance(value, dict):
        if style == "deepObject":
            return [(f"{name}[{key}]", item) for key, item in value.items()]
        if explode:
            return list(value.items())
        return [(name, ",".join(str(item) for pair in value.items() for item in pair))]
    if isinstance(value, (list, tuple)):
        if style == "form" and explode:
            return [(name, item) for item in value]
        separator = " " if style == "spaceDelimited" else "|" if style == "pipeDelimited" else ","
        return [(name, separator.join(str(item) for item in value))]
    return [(name, value)]


def _without_none(values: Any) -> Any:
    return {key: value for key, value in values.items() if value is not None} if isinstance(values, dict) else values


def _without_not_given(values: Any) -> Any:
    if isinstance(values, dict):
        return {key: value for key, value in values.items() if not isinstance(value, NotGiven)}
    return None if isinstance(values, NotGiven) else values


def _retry_delay(response: httpx.Response | None, attempt: int) -> float:
    if response is not None:
        try:
            return min(max(float(response.headers.get("retry-after", "")), 0), 60)
        except ValueError:
            pass
    return min(0.5 * (2**attempt), 8)


class SyncAPIClient:
    def __init__(
        self,
        *,
        api_key: str | None,
        base_url: str,
        timeout: float | httpx.Timeout,
        max_retries: int,
        http_client: httpx.Client | None,
    ) -> None:
        self._client = http_client or httpx.Client(
            base_url=f"{base_url.rstrip('/')}/",
            timeout=timeout,
        )
        self._client.base_url = httpx.URL(f"{base_url.rstrip('/')}/")
        self._api_key = api_key
        self._max_retries = max_retries

    def request(self, method: str, path: str, **kwargs: Any) -> Any:
        retryable = method.upper() in {"GET", "HEAD", "OPTIONS"}
        headers = _without_none(kwargs.get("headers")) or {}
        if self._api_key and (auth := kwargs.get("auth")):
            headers.setdefault(auth[0], f"{auth[1]}{self._api_key}")
        request_path = self._client.base_url.join(f"{kwargs['server'].rstrip('/')}/{path.lstrip('/')}") if kwargs.get("server") else path.lstrip("/")
        for attempt in range(self._max_retries + 1):
            try:
                response = self._client.request(
                    method,
                    request_path,
                    params=_without_none(kwargs.get("params")),
                    headers=headers,
                    cookies=_without_none(kwargs.get("cookies")),
                    json=_without_not_given(kwargs.get("json")),
                    data=_without_not_given(kwargs.get("data")),
                    files=_without_not_given(kwargs.get("files")),
                    content=_without_not_given(kwargs.get("content")),
                )
            except httpx.HTTPError as error:
                if not retryable or attempt == self._max_retries:
                    raise APIConnectionError(str(error)) from error
                time.sleep(_retry_delay(None, attempt))
                continue
            if not retryable or (response.status_code not in {408, 409, 429} and response.status_code < 500):
                break
            if attempt == self._max_retries:
                break
            time.sleep(_retry_delay(response, attempt))
        if response.is_error:
            raise APIError(response.status_code, response.text, response.headers.get("x-request-id"))
        if response.status_code == 204 or not response.content:
            return None
        media_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
        if media_type == "application/json" or media_type.endswith("+json"):
            return response.json()
        if kwargs.get("text") or media_type.startswith("text/"):
            return response.text
        return response.content

    def close(self) -> None:
        self._client.close()


class AsyncAPIClient:
    def __init__(
        self,
        *,
        api_key: str | None,
        base_url: str,
        timeout: float | httpx.Timeout,
        max_retries: int,
        http_client: httpx.AsyncClient | None,
    ) -> None:
        self._client = http_client or httpx.AsyncClient(
            base_url=f"{base_url.rstrip('/')}/",
            timeout=timeout,
        )
        self._client.base_url = httpx.URL(f"{base_url.rstrip('/')}/")
        self._api_key = api_key
        self._max_retries = max_retries

    async def request(self, method: str, path: str, **kwargs: Any) -> Any:
        retryable = method.upper() in {"GET", "HEAD", "OPTIONS"}
        headers = _without_none(kwargs.get("headers")) or {}
        if self._api_key and (auth := kwargs.get("auth")):
            headers.setdefault(auth[0], f"{auth[1]}{self._api_key}")
        request_path = self._client.base_url.join(f"{kwargs['server'].rstrip('/')}/{path.lstrip('/')}") if kwargs.get("server") else path.lstrip("/")
        for attempt in range(self._max_retries + 1):
            try:
                response = await self._client.request(
                    method,
                    request_path,
                    params=_without_none(kwargs.get("params")),
                    headers=headers,
                    cookies=_without_none(kwargs.get("cookies")),
                    json=_without_not_given(kwargs.get("json")),
                    data=_without_not_given(kwargs.get("data")),
                    files=_without_not_given(kwargs.get("files")),
                    content=_without_not_given(kwargs.get("content")),
                )
            except httpx.HTTPError as error:
                if not retryable or attempt == self._max_retries:
                    raise APIConnectionError(str(error)) from error
                await __import__("asyncio").sleep(_retry_delay(None, attempt))
                continue
            if not retryable or (response.status_code not in {408, 409, 429} and response.status_code < 500):
                break
            if attempt == self._max_retries:
                break
            await __import__("asyncio").sleep(_retry_delay(response, attempt))
        if response.is_error:
            raise APIError(response.status_code, response.text, response.headers.get("x-request-id"))
        if response.status_code == 204 or not response.content:
            return None
        media_type = response.headers.get("content-type", "").split(";", 1)[0].lower()
        if media_type == "application/json" or media_type.endswith("+json"):
            return response.json()
        if kwargs.get("text") or media_type.startswith("text/"):
            return response.text
        return response.content

    async def close(self) -> None:
        await self._client.aclose()
`;
}

const EXCEPTIONS_SOURCE = `from __future__ import annotations


class APIError(Exception):
    """Error returned by the API."""

    def __init__(self, status_code: int, body: str, request_id: str | None = None) -> None:
        self.status_code = status_code
        self.body = body
        self.request_id = request_id
        super().__init__(f"API request failed with status {status_code}: {body}")


class APIConnectionError(Exception):
    """Network error raised while contacting the API."""
`;

function publicClientSource(
  config: OpenApiConfig,
  resources: Map<string, PythonOperation[]>,
  async: boolean,
  baseUrl: string,
): string {
  const className = `${async ? "Async" : ""}${config.python.client}`;
  const apiClient = `${async ? "Async" : "Sync"}APIClient`;
  const imports = [...resources.keys()].map((resource) => `${async ? "Async" : ""}${pascal(resource)}`).sort();
  const properties = [...resources.keys()]
    .map((resource) => `        self.${resource} = ${async ? "Async" : ""}${pascal(resource)}(self._client)`)
    .join("\n");
  const httpClient = `httpx.${async ? "Async" : ""}Client`;
  const enter = async
    ? `    async def __aenter__(self) -> ${className}:  # noqa: PYI034\n        return self\n\n    async def __aexit__(\n        self,\n        exc_type: type[BaseException] | None,\n        exc: BaseException | None,\n        traceback: object,\n    ) -> None:\n        await self.close()`
    : `    def __enter__(self) -> ${className}:  # noqa: PYI034\n        return self\n\n    def __exit__(\n        self,\n        exc_type: type[BaseException] | None,\n        exc: BaseException | None,\n        traceback: object,\n    ) -> None:\n        self.close()`;
  return `from __future__ import annotations\n\nimport os\n\nimport httpx\n\nfrom ._client import ${apiClient}\nfrom .resources import (\n${imports.map((name) => `    ${name},`).join("\n")}\n)\n\n\nclass ${className}:\n    """Client for the ${pythonDocstringText(config.name, "    ")}."""\n\n    def __init__(\n        self,\n        *,\n        api_key: str | None = None,\n        base_url: str = "${baseUrl}",\n        timeout: float | httpx.Timeout = 60.0,\n        max_retries: int = 2,\n        http_client: ${httpClient} | None = None,\n    ) -> None:\n        """Initialize the client.\n\n        Args:\n            api_key (str, optional): API key. Defaults to ${pythonDocstringText(config.apiKey.environment, "            ")}.\n            base_url (str): API base URL.\n            timeout (float | httpx.Timeout): Request timeout.\n            max_retries (int): Retries for connection errors and retryable responses.\n            http_client (${httpClient}, optional): Custom HTTP client.\n        """\n        resolved_api_key = api_key or os.environ.get("${config.apiKey.environment}")\n        self._client = ${apiClient}(\n            api_key=resolved_api_key,\n            base_url=base_url,\n            timeout=timeout,\n            max_retries=max_retries,\n            http_client=http_client,\n        )\n${properties}\n\n    ${async ? "async " : ""}def close(self) -> None:\n        """Close the underlying HTTP client."""\n        ${async ? "await " : ""}self._client.close()\n\n${enter}\n`;
}

export async function generatePython(
  document: OpenApiDocument,
  config: OpenApiConfig,
  output: string,
): Promise<number> {
  const resources = prepare(document);
  const root = `${output}/src/${config.python.package}`;
  const baseUrl = resolveServerUrl(document);
  const readmeExample = [...resources]
    .flatMap(([resource, operations]) => operations.map((operation) => ({ operation, resource })))
    .find(({ operation }) => operation.method === "get" && operation.arguments.every((argument) => !argument.required));
  const license = config.license;
  const licenseText = await Bun.file(license.file).text();
  const readme = config.python.readme
    ? await Bun.file(config.python.readme).text()
    : `<div align="center">\n  <a href="https://www.ultralytics.com"><img src="https://raw.githubusercontent.com/ultralytics/assets/main/logo/Ultralytics_Logotype_Original.svg" width="320" alt="Ultralytics logo"></a>\n\n# 🔌 ${config.name} Python SDK\n\n[![PyPI - Version](https://img.shields.io/pypi/v/${config.python.project}?logo=pypi&logoColor=white)](https://pypi.org/project/${config.python.project}/)\n[![PyPI - Python Version](https://img.shields.io/pypi/pyversions/${config.python.project}?logo=python&logoColor=gold)](https://pypi.org/project/${config.python.project}/)\n[![Ultralytics Discord](https://img.shields.io/discord/1089800235347353640?logo=discord&logoColor=white&label=Discord&color=blue)](https://discord.com/invite/ultralytics)\n[![Ultralytics Forums](https://img.shields.io/discourse/users?server=https%3A%2F%2Fcommunity.ultralytics.com&logo=discourse&label=Forums&color=blue)](https://community.ultralytics.com)\n\n</div>\n\nTyped synchronous and asynchronous Python clients generated from the ${config.name} contract.\n\n## 🐍 Installation\n\n\`\`\`bash\n${config.python.install}\n\`\`\`\n\n## 🔑 Authentication\n\nPass your API key directly when creating a client:\n\n\`\`\`python\nfrom ${config.python.package} import ${config.python.client}\n\nclient = ${config.python.client}(api_key="YOUR_API_KEY")\n\`\`\`\n\nAlternatively, set \`${config.apiKey.environment}\` and omit the \`api_key\` argument.\n\n## 🚀 Usage\n\nResources are grouped under one client and support context-manager cleanup:\n\n\`\`\`python\nfrom ${config.python.package} import ${config.python.client}\n\nwith ${config.python.client}() as client:\n    ${readmeExample ? `response = client.${readmeExample.resource}.${readmeExample.operation.name}()` : "..."}\n\`\`\`\n\nEvery resource is also available through the asynchronous client:\n\n\`\`\`python\nimport asyncio\n\nfrom ${config.python.package} import Async${config.python.client}\n\n\nasync def main():\n    async with Async${config.python.client}() as client:\n        ${readmeExample ? `response = await client.${readmeExample.resource}.${readmeExample.operation.name}()` : "..."}\n\n\nasyncio.run(main())\n\`\`\`\n\n## ✨ Features\n\n- Typed synchronous and asynchronous resource clients\n- Multipart uploads and custom HTTP clients\n- Automatic retries for temporary failures\n- Structured API and connection errors\n- Context-manager cleanup\n\n## 📄 License\n\nThis SDK is licensed under the [${license.id.replace("-only", "")} License](${license.url ?? "LICENSE"}). Commercial licensing is available through [Ultralytics Licensing](https://www.ultralytics.com/license).\n\n## 🤝 Community\n\nFor help and feedback, join the [Ultralytics community](https://community.ultralytics.com/) or [Discord](https://discord.com/invite/ultralytics).\n`;
  const projectUrls = config.repository
    ? `\n\n[project.urls]\nRepository = "${config.repository}"\nIssues = "${config.repository}/issues"`
    : "";
  const people = (values: Array<{ email?: string; name: string }> | undefined) =>
    values
      ?.map(
        ({ email, name }) => `{ name = ${JSON.stringify(name)}${email ? `, email = ${JSON.stringify(email)}` : ""} }`,
      )
      .join(", ");
  const projectMetadata = [
    `description = ${JSON.stringify(config.python.description ?? `Python client for ${config.name}`)}`,
    `requires-python = ${JSON.stringify(config.python.requiresPython ?? ">=3.11")}`,
    config.python.authors?.length ? `authors = [${people(config.python.authors)}]` : "",
    config.python.maintainers?.length ? `maintainers = [${people(config.python.maintainers)}]` : "",
    config.python.keywords?.length ? `keywords = ${JSON.stringify(config.python.keywords)}` : "",
    config.python.classifiers?.length ? `classifiers = ${JSON.stringify(config.python.classifiers, null, 4)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  await rm(output, { force: true, recursive: true });
  await Promise.all([
    Bun.write(
      `${output}/pyproject.toml`,
      `[build-system]\nrequires = ["uv_build>=0.12.3,<0.13"]\nbuild-backend = "uv_build"\n\n[project]\nname = "${config.python.project}"\nversion = "${config.python.version}"\n${projectMetadata}\nreadme = "README.md"\nlicense = "${license.id}"\nlicense-files = ["LICENSE"]\ndependencies = ["httpx>=0.28,<1"]${projectUrls}\n\n[tool.ruff]\nline-length = 120\n\n[tool.uv.build-backend]\nmodule-name = "${config.python.package}"\n`,
    ),
    Bun.write(`${output}/README.md`, readme),
    Bun.write(`${output}/LICENSE`, licenseText),
    Bun.write(`${root}/_client.py`, clientSource()),
    Bun.write(`${root}/_exceptions.py`, EXCEPTIONS_SOURCE),
    Bun.write(`${root}/client.py`, publicClientSource(config, resources, false, baseUrl)),
    Bun.write(`${root}/async_client.py`, publicClientSource(config, resources, true, baseUrl)),
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
