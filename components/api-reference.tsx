// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

"use client";

import { CheckIcon, CopyIcon, KeyRoundIcon, LoaderCircleIcon, MenuIcon, PlayIcon, SearchIcon } from "lucide-react";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  type ApiOperation,
  buildApiRequest,
  expandServerUrl,
  formEntries,
  getAuthentication,
  getOperations,
  type JsonSchema,
  type OpenApiDocument,
  objectSchema,
  pythonCodeSample,
  requestBodyExample,
  requestMedia,
  resolveSchema,
  schemaExample,
  schemaFields,
  schemaLabel,
  serializeQueryParameter,
  serializeSimplePath,
  successMedia,
} from "@/lib/openapi";
import { cn } from "@/lib/utils";

const METHOD_VARIANTS = {
  delete: "destructive",
  get: "secondary",
  head: "outline",
  options: "outline",
  patch: "outline",
  post: "default",
  put: "default",
  trace: "outline",
} as const;

function operationSearchText(operation: ApiOperation) {
  return `${operation.method} ${operation.path} ${operation.summary ?? ""} ${operation.tag}`.toLowerCase();
}

function shellQuote(value: unknown): string {
  return `'${String(value).replaceAll("'", `'"'"'`)}'`;
}

interface PythonExample {
  client: string;
  install: string;
  package: string;
}

function codeExamples(
  document: OpenApiDocument,
  operation: ApiOperation,
  body: string,
  environment: string,
  origin: string,
  pythonConfig: PythonExample,
) {
  const server = operation.server ?? document.servers?.[0];
  const expandedServer = server ? expandServerUrl(server) : undefined;
  const baseUrl =
    expandedServer && origin ? new URL(expandedServer, `${origin}/`).toString() : (expandedServer ?? origin);
  const parameterExamples = new Map(
    (operation.parameters ?? [])
      .filter((parameter) => parameter.required)
      .map((parameter) => [`${parameter.in}:${parameter.name}`, schemaExample(document, parameter.schema)]),
  );
  let path = operation.path;
  for (const parameter of (operation.parameters ?? []).filter((parameter) => parameter.in === "path")) {
    path = path.replace(
      `{${parameter.name}}`,
      serializeSimplePath(parameterExamples.get(`path:${parameter.name}`), parameter.explode, parameter.allowReserved),
    );
  }
  const query = (operation.parameters ?? [])
    .filter((parameter) => parameter.in === "query" && parameter.required)
    .map((parameter) =>
      serializeQueryParameter(
        parameter.name,
        parameterExamples.get(`query:${parameter.name}`),
        parameter.style,
        parameter.explode,
        parameter.allowReserved,
      ),
    )
    .join("&");
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}${query ? `?${query}` : ""}`;
  const request = requestMedia(operation);
  const authentication = getAuthentication(document, operation);
  const hasJsonBody = request?.[0] === "application/json" || request?.[0].endsWith("+json");
  const bodySchema = objectSchema(document, request?.[1].schema);
  const bodyProperties = Object.fromEntries(
    Object.entries(bodySchema?.properties ?? {}).filter(([, schema]) => !resolveSchema(document, schema)?.readOnly),
  );
  let bodyValue: unknown = request ? schemaExample(document, request[1].schema) : undefined;
  let bodyValues: Record<string, unknown> = {};
  try {
    bodyValue = JSON.parse(body);
    if (bodyValue && typeof bodyValue === "object" && !Array.isArray(bodyValue)) {
      bodyValues = bodyValue as Record<string, unknown>;
    }
  } catch {
    if (request?.[0].startsWith("text/")) bodyValue = body;
  }
  const curl = [
    `curl --request ${operation.method.toUpperCase()}`,
    `  --url ${shellQuote(url)}`,
    authentication
      ? `  --header ${shellQuote(`${authentication.header}: ${authentication.prefix}`)}"$${environment}"`
      : "",
    ...(operation.parameters ?? [])
      .filter((parameter) => parameter.in === "header" && parameter.required)
      .map(
        (parameter) =>
          `  --header ${shellQuote(`${parameter.name}: ${serializeSimplePath(parameterExamples.get(`header:${parameter.name}`), parameter.explode)}`)}`,
      ),
    ...(operation.parameters ?? [])
      .filter((parameter) => parameter.in === "cookie" && parameter.required)
      .map(
        (parameter) =>
          `  --cookie ${shellQuote(serializeQueryParameter(parameter.name, parameterExamples.get(`cookie:${parameter.name}`), "form", parameter.explode).replaceAll("&", "; "))}`,
      ),
    request && request[0] !== "multipart/form-data" ? `  --header ${shellQuote(`Content-Type: ${request[0]}`)}` : "",
    hasJsonBody ? `  --data ${shellQuote(body)}` : "",
    request?.[0] === "application/x-www-form-urlencoded"
      ? formEntries(bodyValues)
          .map(([name, value]) => `  --data-urlencode ${shellQuote(`${name}=${value}`)}`)
          .join(" \\\n")
      : "",
    request && !hasJsonBody && !["application/x-www-form-urlencoded", "multipart/form-data"].includes(request[0])
      ? `  --data ${shellQuote(body)}`
      : "",
    request?.[0] === "multipart/form-data"
      ? Object.entries(bodyProperties)
          .map(
            ([name, schema]) =>
              `  --form ${shellQuote(`${name}=${resolveSchema(document, schema)?.format === "binary" ? "@path/to/file" : (bodyValues[name] ?? "value")}`)}`,
          )
          .join(" \\\n")
      : "",
  ]
    .filter(Boolean)
    .join(" \\\n");
  const python = pythonCodeSample(document, operation, { ...pythonConfig, environment }, bodyValue);
  return { curl, python };
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="relative overflow-hidden rounded-lg border bg-zinc-950 text-zinc-50">
      <Button
        aria-label="Copy code"
        className="absolute top-2 right-2 text-zinc-300 hover:bg-zinc-800 hover:text-white"
        onClick={copy}
        size="icon-sm"
        variant="ghost"
      >
        {copied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
      </Button>
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function OperationNavigation({
  onQueryChange,
  query,
  selectedId,
  tags,
}: {
  onQueryChange: (value: string) => void;
  query: string;
  selectedId?: string;
  tags: Map<string, ApiOperation[]>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-4">
        <div className="relative">
          <SearchIcon
            aria-hidden="true"
            className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="Search operations"
            autoComplete="off"
            className="pr-12 pl-8"
            name="api-search"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search operations…"
            value={query}
          />
          <kbd className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 text-xs text-muted-foreground">
            ⌘K
          </kbd>
        </div>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-5 p-3" aria-label="API operations">
          <a
            className={cn(
              "block rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-ring",
              !selectedId && "bg-sidebar-accent text-sidebar-accent-foreground",
            )}
            aria-current={!selectedId ? "page" : undefined}
            href="#overview"
          >
            Overview
          </a>
          {[...tags].map(([tag, taggedOperations]) => (
            <div key={tag}>
              <p className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{tag}</p>
              <div className="space-y-0.5">
                {taggedOperations.map((operation) => (
                  <a
                    aria-current={selectedId === operation.id ? "page" : undefined}
                    className={cn(
                      "operation-list-item flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent",
                      selectedId === operation.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    key={operation.id}
                    href={`#operation=${encodeURIComponent(operation.id)}`}
                  >
                    <span className="w-10 shrink-0 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                      {operation.method}
                    </span>
                    <span className="truncate">{operation.summary ?? operation.path}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}

function SchemaFields({
  direction,
  document,
  schema,
}: {
  direction: "request" | "response";
  document: OpenApiDocument;
  schema: JsonSchema | undefined;
}) {
  const fields = schemaFields(document, schema, direction);
  if (!fields.length) return null;
  return (
    <div className="divide-y rounded-xl border">
      {fields.map((field) => (
        <div className="grid gap-2 p-4 sm:grid-cols-[minmax(200px,0.4fr)_1fr]" key={field.name}>
          <div className="min-w-0" style={{ paddingLeft: `${field.depth * 16}px` }}>
            <div className="flex flex-wrap items-center gap-2">
              <code className="break-all font-mono text-sm font-medium">{field.name}</code>
              {field.required ? <Badge variant="outline">required</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{schemaLabel(document, field.schema)}</p>
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{field.description ?? "No description provided."}</p>
        </div>
      ))}
    </div>
  );
}

function OverviewPanel({
  document,
  environment,
  python,
  specUrl,
}: {
  document: OpenApiDocument;
  environment: string;
  python: PythonExample;
  specUrl: string;
}) {
  const operations = getOperations(document);
  const tagDescriptions = new Map(document.tags?.map((tag) => [tag.name, tag.description]));
  const tags = new Map<string, number>();
  for (const operation of operations) tags.set(operation.tag, (tags.get(operation.tag) ?? 0) + 1);
  const authentications = Object.entries(document.components?.securitySchemes ?? {});
  const pythonExample = `import asyncio\n\nfrom ${python.package} import Async${python.client}, ${python.client}\n\nwith ${python.client}() as client:  # Reads ${environment}\n    ...\n\nasync def main():\n    async with Async${python.client}() as client:\n        ...\n\nasyncio.run(main())`;

  return (
    <main className="min-w-0 flex-1 px-5 py-10 lg:px-10" id="main-content">
      <div className="mx-auto max-w-5xl space-y-10">
        <section>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="secondary">OpenAPI {document.openapi}</Badge>
            <Badge variant="outline">API {document.info.version}</Badge>
            <Badge variant="outline">{operations.length} operations</Badge>
            <Badge variant="outline">REST + Python SDK</Badge>
          </div>
          <h1 className="scroll-mt-20 text-pretty font-heading text-4xl font-semibold tracking-tight" id="overview">
            {document.info.title}
          </h1>
          {document.info.description ? (
            <div className="mt-5 max-w-3xl text-sm leading-7 text-muted-foreground">
              <ReactMarkdown>{document.info.description}</ReactMarkdown>
            </div>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button render={<a download href={specUrl} />} variant="outline">
              Download OpenAPI contract
            </Button>
            {document.externalDocs ? (
              <Button render={<a href={document.externalDocs.url} />} variant="outline">
                {document.externalDocs.description ?? "Guides"}
              </Button>
            ) : null}
          </div>
        </section>

        {document.servers?.length ? (
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold">Servers</h2>
            <div className="divide-y rounded-xl border">
              {document.servers.map((server) => (
                <div className="grid gap-2 p-4 sm:grid-cols-[minmax(260px,0.6fr)_1fr]" key={server.url}>
                  <code className="break-all font-mono text-sm">{expandServerUrl(server)}</code>
                  <p className="text-sm text-muted-foreground">{server.description ?? "API server"}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {authentications.length ? (
          <section className="space-y-4">
            <h2 className="font-heading text-2xl font-semibold">Authentication</h2>
            {authentications.map(([name, authentication]) => (
              <Card key={name}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {authentication.type === "http" ? (authentication.scheme ?? name) : (authentication.name ?? name)}
                  </CardTitle>
                  <CardDescription className="[&_a]:text-link [&_a]:underline">
                    <ReactMarkdown>{authentication.description ?? "Authentication required."}</ReactMarkdown>
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </section>
        ) : null}

        <section className="space-y-4">
          <div>
            <h2 className="font-heading text-2xl font-semibold">Python SDK</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              Install the typed client, set {environment}, then choose a resource to see the Python call generated from
              the same operation as the REST reference.
            </p>
          </div>
          <CodeBlock code={python.install} />
          <CodeBlock code={pythonExample} />
        </section>

        <section className="space-y-4">
          <h2 className="font-heading text-2xl font-semibold">Resources</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[...tags].map(([tag, count]) => (
              <Card key={tag}>
                <CardHeader>
                  <CardTitle className="text-base">{tag}</CardTitle>
                  <CardDescription className="[&_a]:text-link [&_a]:underline">
                    <ReactMarkdown>{tagDescriptions.get(tag) ?? `${count} API operations`}</ReactMarkdown>
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-xs text-muted-foreground">{count} operations</CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function OperationPanel({
  apiKey,
  document,
  environment,
  operation,
  python,
}: {
  apiKey: string;
  document: OpenApiDocument;
  environment: string;
  operation: ApiOperation;
  python: PythonExample;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [body, setBody] = useState(() => requestBodyExample(document, operation));
  const [files, setFiles] = useState<Record<string, File>>({});
  const [result, setResult] = useState("");
  const [status, setStatus] = useState<number>();
  const [sending, setSending] = useState(false);
  const [origin, setOrigin] = useState("");
  const parameters = operation.parameters ?? [];
  const hasCookieParameters = parameters.some((parameter) => parameter.in === "cookie");
  const request = requestMedia(operation);
  const requestSchema = objectSchema(document, request?.[1].schema);
  const binaryFields = Object.entries(requestSchema?.properties ?? {}).filter(
    ([, schema]) => resolveSchema(document, schema)?.format === "binary",
  );
  const success = successMedia(operation);
  const examples = useMemo(
    () => codeExamples(document, operation, body, environment, origin, python),
    [body, document, environment, operation, origin, python],
  );

  useEffect(() => setOrigin(window.location.origin), []);

  useEffect(() => {
    setValues({});
    setBody(requestBodyExample(document, operation));
    setFiles({});
    setResult("");
    setStatus(undefined);
  }, [document, operation]);

  function setParameter(location: string, name: string, value: string) {
    setValues((current) => ({ ...current, [`${location}:${name}`]: value }));
  }

  async function sendRequest() {
    let requestInit: ReturnType<typeof buildApiRequest>;
    try {
      requestInit = buildApiRequest(document, operation, {
        apiKey,
        body,
        files,
        origin: window.location.origin,
        values,
      });
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Invalid request values");
      return;
    }
    setSending(true);
    setResult("");
    setStatus(undefined);
    try {
      const response = await fetch(requestInit.url, {
        body: requestInit.body,
        headers: requestInit.headers,
        method: operation.method.toUpperCase(),
      });
      const text = await response.text();
      setStatus(response.status);
      try {
        setResult(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResult(text || response.statusText);
      }
    } catch (error) {
      setResult(error instanceof Error ? error.message : "Request failed");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-w-0 flex-1 px-5 py-8 lg:px-10" id="main-content">
      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <div className="min-w-0 space-y-8">
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant={METHOD_VARIANTS[operation.method]}>{operation.method.toUpperCase()}</Badge>
              <code className="break-all font-mono text-sm">{operation.path}</code>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{operation.summary ?? operation.id}</h1>
            {operation.description ? (
              <div className="mt-4 text-sm leading-7 text-muted-foreground [&_a]:text-link [&_a]:underline">
                <ReactMarkdown>{operation.description}</ReactMarkdown>
              </div>
            ) : null}
          </section>

          {parameters.length ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-heading text-xl font-semibold">Parameters</h2>
                <p className="text-sm text-muted-foreground">Path, query, and header values for this request.</p>
              </div>
              <div className="divide-y rounded-xl border">
                {parameters.map((parameter) => (
                  <div
                    className="grid gap-3 p-4 sm:grid-cols-[minmax(150px,0.35fr)_1fr]"
                    key={`${parameter.in}:${parameter.name}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <code className="font-mono text-sm font-medium">{parameter.name}</code>
                        {parameter.required ? <Badge variant="outline">required</Badge> : null}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {parameter.in} · {schemaLabel(document, parameter.schema)}
                      </p>
                    </div>
                    <div>
                      <Input
                        aria-label={parameter.name}
                        autoComplete="off"
                        name={`${parameter.in}-${parameter.name}`}
                        onChange={(event) => setParameter(parameter.in, parameter.name, event.target.value)}
                        placeholder={parameter.description ?? parameter.name}
                        required={parameter.required}
                        value={values[`${parameter.in}:${parameter.name}`] ?? ""}
                      />
                      {parameter.description ? (
                        <p className="mt-2 text-xs text-muted-foreground">{parameter.description}</p>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {request ? (
            <section className="space-y-4">
              <div>
                <h2 className="font-heading text-xl font-semibold">Request body</h2>
                <p className="text-sm text-muted-foreground">
                  {request[0]} · {schemaLabel(document, request[1].schema)}
                </p>
              </div>
              <Textarea
                aria-label="Request body"
                autoComplete="off"
                className="min-h-64 font-mono text-xs leading-relaxed"
                name="request-body"
                onChange={(event) => setBody(event.target.value)}
                spellCheck={false}
                value={body}
              />
              <SchemaFields direction="request" document={document} schema={request[1].schema} />
              {binaryFields.map(([name]) => (
                <Input
                  aria-label={name}
                  key={name}
                  name={name}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) setFiles((current) => ({ ...current, [name]: file }));
                  }}
                  required={requestSchema?.required?.includes(name)}
                  type="file"
                />
              ))}
            </section>
          ) : null}

          <section className="space-y-4">
            <div>
              <h2 className="font-heading text-xl font-semibold">Response</h2>
              <p className="text-sm text-muted-foreground">
                {success
                  ? `${success[0]} · ${schemaLabel(document, success[1].schema)}`
                  : "See documented status codes below."}
              </p>
            </div>
            <div className="divide-y rounded-xl border">
              {Object.entries(operation.responses ?? {}).map(([responseStatus, response]) => (
                <div className="grid grid-cols-[72px_1fr] gap-3 p-4 text-sm" key={responseStatus}>
                  <code className="font-mono font-medium">{responseStatus}</code>
                  <span className="text-muted-foreground">{response.description}</span>
                </div>
              ))}
            </div>
            {success?.[1].schema ? (
              <SchemaFields direction="response" document={document} schema={success[1].schema} />
            ) : null}
            {success ? (
              <CodeBlock
                code={JSON.stringify(success[1].example ?? schemaExample(document, success[1].schema), null, 2)}
              />
            ) : null}
          </section>
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:h-fit">
          <Card>
            <CardHeader>
              <CardTitle>Try it</CardTitle>
              <CardDescription>
                {hasCookieParameters
                  ? "Browser requests cannot set cookie parameters. Use the Python or cURL example."
                  : "Your API key is kept only in this page and is never added to code examples."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <Button className="w-full" disabled={sending || hasCookieParameters} onClick={sendRequest}>
                {sending ? (
                  <LoaderCircleIcon aria-hidden="true" className="animate-spin" />
                ) : (
                  <PlayIcon aria-hidden="true" />
                )}
                Send request
              </Button>

              <Tabs defaultValue="python">
                <TabsList>
                  <TabsTrigger value="python">Python</TabsTrigger>
                  <TabsTrigger value="curl">cURL</TabsTrigger>
                </TabsList>
                <TabsContent value="python">
                  <CodeBlock code={examples.python} />
                </TabsContent>
                <TabsContent value="curl">
                  <CodeBlock code={examples.curl} />
                </TabsContent>
              </Tabs>

              {result ? (
                <div aria-live="polite" className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <span>Response</span>
                    {status ? <Badge variant={status < 400 ? "secondary" : "destructive"}>{status}</Badge> : null}
                  </div>
                  <CodeBlock code={result} />
                </div>
              ) : null}
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}

export function ApiReference({
  apiKeyEnvironment,
  python,
  specUrl,
}: {
  apiKeyEnvironment: string;
  python: PythonExample;
  specUrl: string;
}) {
  const [apiKey, setApiKey] = useState("");
  const [document, setDocument] = useState<OpenApiDocument>();
  const [error, setError] = useState("");
  const [navigationOpen, setNavigationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>();
  const deferredQuery = useDeferredValue(query);
  const operations = useMemo(() => (document ? getOperations(document) : []), [document]);
  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return normalized
      ? operations.filter((operation) => operationSearchText(operation).includes(normalized))
      : operations;
  }, [deferredQuery, operations]);
  const selected = operations.find((operation) => operation.id === selectedId);
  const tags = useMemo(() => {
    const grouped = new Map<string, ApiOperation[]>();
    for (const operation of filtered) {
      const group = grouped.get(operation.tag);
      if (group) group.push(operation);
      else grouped.set(operation.tag, [operation]);
    }
    return grouped;
  }, [filtered]);

  useEffect(() => {
    fetch(specUrl)
      .then((response) => {
        if (!response.ok) throw new Error(`Failed to load ${specUrl}: ${response.status}`);
        return response.json();
      })
      .then((value: OpenApiDocument) => setDocument(value))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Failed to load OpenAPI document"),
      );
  }, [specUrl]);

  useEffect(() => {
    function focusSearch(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        for (const input of window.document.querySelectorAll<HTMLInputElement>('[name="api-search"]')) {
          if (input.offsetParent) {
            input.focus();
            break;
          }
        }
      }
    }

    function selectFromHash() {
      const hash = window.location.hash.slice(1);
      setSelectedId(hash.startsWith("operation=") ? decodeURIComponent(hash.slice("operation=".length)) : undefined);
      setNavigationOpen(false);
      window.scrollTo(0, 0);
    }
    selectFromHash();
    window.addEventListener("keydown", focusSearch);
    window.addEventListener("hashchange", selectFromHash);
    return () => {
      window.removeEventListener("keydown", focusSearch);
      window.removeEventListener("hashchange", selectFromHash);
    };
  }, []);

  if (error) return <div className="p-8 text-sm text-destructive">{error}</div>;
  if (!document) {
    return (
      <div aria-live="polite" className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <LoaderCircleIcon aria-hidden="true" className="mr-2 size-4 animate-spin" /> Loading API reference…
      </div>
    );
  }
  const hasAuthentication = operations.some((operation) => getAuthentication(document, operation));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
        <div className="flex h-16 items-center gap-4 px-4 lg:px-6">
          <Sheet onOpenChange={setNavigationOpen} open={navigationOpen}>
            <SheetTrigger
              render={<Button aria-label="Open API navigation" className="lg:hidden" size="icon-sm" variant="ghost" />}
            >
              <MenuIcon aria-hidden="true" />
            </SheetTrigger>
            <SheetContent className="gap-0 p-0" side="left">
              <SheetHeader>
                <SheetTitle>API reference</SheetTitle>
              </SheetHeader>
              <Separator />
              <OperationNavigation onQueryChange={setQuery} query={query} selectedId={selectedId} tags={tags} />
            </SheetContent>
          </Sheet>
          <a
            className="flex min-w-0 items-center gap-3 rounded-md focus-visible:ring-2 focus-visible:ring-ring"
            href="#overview"
          >
            <div className="size-7 rounded-lg bg-linear-to-br from-(--ultralytics-logo-gradient-start) to-(--ultralytics-logo-gradient-end)" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">{document.info.title}</p>
              <p className="text-xs text-muted-foreground">API {document.info.version}</p>
            </div>
          </a>
          {hasAuthentication ? (
            <div className="ml-auto flex w-full max-w-sm items-center gap-2">
              <KeyRoundIcon aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              <Input
                aria-label="API key"
                autoComplete="off"
                name="api-key"
                onChange={(event) => setApiKey(event.target.value)}
                placeholder={apiKeyEnvironment}
                type="password"
                value={apiKey}
              />
            </div>
          ) : null}
        </div>
      </header>

      <div className="flex min-h-[calc(100vh-4rem)]">
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-80 shrink-0 border-r bg-sidebar lg:block">
          <OperationNavigation onQueryChange={setQuery} query={query} selectedId={selectedId} tags={tags} />
        </aside>
        {selected ? (
          <OperationPanel
            apiKey={apiKey}
            document={document}
            environment={apiKeyEnvironment}
            operation={selected}
            python={python}
          />
        ) : (
          <OverviewPanel document={document} environment={apiKeyEnvironment} python={python} specUrl={specUrl} />
        )}
      </div>
    </div>
  );
}
