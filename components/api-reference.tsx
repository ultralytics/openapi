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
  getAuthentication,
  getOperations,
  type OpenApiDocument,
  objectSchema,
  requestMedia,
  resolveServerUrl,
  schemaExample,
  schemaLabel,
  sdkIdentifier,
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

function requestBodyExample(document: OpenApiDocument, operation: ApiOperation) {
  const request = requestMedia(operation);
  if (!request) return "";
  let example = request[1].example ?? schemaExample(document, request[1].schema);
  const schema = objectSchema(document, request[1].schema);
  if (example && typeof example === "object" && !Array.isArray(example)) {
    example = { ...example };
    for (const [name, property] of Object.entries(schema?.properties ?? {})) {
      if (property.readOnly) delete (example as Record<string, unknown>)[name];
    }
  }
  return request[0].startsWith("text/") && typeof example === "string" ? example : JSON.stringify(example, null, 2);
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

interface PythonExample {
  client: string;
  package: string;
}

function codeExamples(
  document: OpenApiDocument,
  operation: ApiOperation,
  body: string,
  environment: string,
  pythonConfig: PythonExample,
) {
  const baseUrl = resolveServerUrl(document, "http://localhost:3000", operation);
  const parameterExamples = new Map(
    (operation.parameters ?? [])
      .filter((parameter) => parameter.required)
      .map((parameter) => [`${parameter.in}:${parameter.name}`, schemaExample(document, parameter.schema)]),
  );
  let path = operation.path;
  for (const parameter of (operation.parameters ?? []).filter((parameter) => parameter.in === "path")) {
    path = path.replace(
      `{${parameter.name}}`,
      encodeURIComponent(String(parameterExamples.get(`path:${parameter.name}`))),
    );
  }
  const query = (operation.parameters ?? [])
    .filter((parameter) => parameter.in === "query" && parameter.required)
    .map(
      (parameter) =>
        `${encodeURIComponent(parameter.name)}=${encodeURIComponent(String(parameterExamples.get(`query:${parameter.name}`)))}`,
    )
    .join("&");
  const url = `${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}${query ? `?${query}` : ""}`;
  const request = requestMedia(operation);
  const authentication = getAuthentication(document, operation);
  const hasJsonBody = request?.[0] === "application/json";
  const bodySchema = objectSchema(document, request?.[1].schema);
  const bodyProperties = Object.fromEntries(
    Object.entries(bodySchema?.properties ?? {}).filter(([, schema]) => !schema.readOnly),
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
    `  --url '${url}'`,
    authentication ? `  --header "${authentication.header}: ${authentication.prefix}\${${environment}}"` : "",
    ...(operation.parameters ?? [])
      .filter((parameter) => parameter.in === "header" && parameter.required)
      .map((parameter) => `  --header '${parameter.name}: ${parameterExamples.get(`header:${parameter.name}`)}'`),
    ...(operation.parameters ?? [])
      .filter((parameter) => parameter.in === "cookie" && parameter.required)
      .map((parameter) => `  --cookie '${parameter.name}=${parameterExamples.get(`cookie:${parameter.name}`)}'`),
    request && request[0] !== "multipart/form-data" ? `  --header 'Content-Type: ${request[0]}'` : "",
    hasJsonBody ? `  --data '${body}'` : "",
    request?.[0] === "application/x-www-form-urlencoded"
      ? Object.entries(bodyProperties)
          .map(([name]) => `  --data-urlencode '${name}=${bodyValues[name] ?? "value"}'`)
          .join(" \\\n")
      : "",
    request && !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(request[0])
      ? `  --data '${body}'`
      : "",
    request?.[0] === "multipart/form-data"
      ? Object.entries(bodyProperties)
          .map(
            ([name, schema]) =>
              `  --form '${name}=${schema.format === "binary" ? "@path/to/file" : (bodyValues[name] ?? "value")}'`,
          )
          .join(" \\\n")
      : "",
  ]
    .filter(Boolean)
    .join(" \\\n");
  const arguments_ = [
    ...(operation.parameters ?? [])
      .filter((parameter) => parameter.required)
      .map(
        (parameter) => `${sdkIdentifier(parameter.name)}=${pythonLiteral(schemaExample(document, parameter.schema))}`,
      ),
    ...(bodySchema?.required ?? [])
      .filter((name) => bodyProperties[name])
      .map(
        (name) =>
          `${sdkIdentifier(name)}=${pythonLiteral(bodyValues[name] ?? schemaExample(document, bodyProperties[name]))}`,
      ),
    ...(!bodySchema?.properties && request?.[1].schema && operation.requestBody?.required
      ? [`body=${pythonLiteral(bodyValue)}`]
      : []),
  ];
  const python = [
    `from ${pythonConfig.package} import ${pythonConfig.client}`,
    "",
    `client = ${pythonConfig.client}()  # ${environment}`,
    arguments_.length
      ? `response = client.${operation.resource}.${operation.sdkMethod}(\n${arguments_.map((argument) => `    ${argument},`).join("\n")}\n)`
      : `response = client.${operation.resource}.${operation.sdkMethod}()`,
    "print(response)",
  ].join("\n");
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
        {copied ? <CheckIcon /> : <CopyIcon />}
      </Button>
      <pre className="overflow-x-auto p-4 pr-12 font-mono text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function OperationNavigation({
  onQueryChange,
  onSelect,
  query,
  selectedId,
  tags,
}: {
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  query: string;
  selectedId: string;
  tags: Map<string, ApiOperation[]>;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="p-4">
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search operations"
            className="pl-8"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="Search API"
            value={query}
          />
        </div>
      </div>
      <Separator />
      <ScrollArea className="min-h-0 flex-1">
        <nav className="space-y-5 p-3" aria-label="API operations">
          {[...tags].map(([tag, taggedOperations]) => (
            <div key={tag}>
              <p className="mb-1 px-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{tag}</p>
              <div className="space-y-0.5">
                {taggedOperations.map((operation) => (
                  <button
                    className={cn(
                      "operation-list-item flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent",
                      selectedId === operation.id && "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    key={operation.id}
                    onClick={() => onSelect(operation.id)}
                    type="button"
                  >
                    <span className="w-10 shrink-0 font-mono text-[10px] font-semibold uppercase text-muted-foreground">
                      {operation.method}
                    </span>
                    <span className="truncate">{operation.summary ?? operation.path}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
      </ScrollArea>
    </div>
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
  const parameters = operation.parameters ?? [];
  const hasCookieParameters = parameters.some((parameter) => parameter.in === "cookie");
  const request = requestMedia(operation);
  const requestSchema = objectSchema(document, request?.[1].schema);
  const binaryFields = Object.entries(requestSchema?.properties ?? {}).filter(
    ([, schema]) => schema.format === "binary",
  );
  const success = successMedia(operation);
  const authentication = getAuthentication(document, operation);
  const examples = useMemo(
    () => codeExamples(document, operation, body, environment, python),
    [body, document, environment, operation, python],
  );

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
    const missing = parameters.find((parameter) => parameter.required && !values[`${parameter.in}:${parameter.name}`]);
    if (missing) {
      setResult(`Enter ${missing.name} before sending the request.`);
      return;
    }
    let path = operation.path;
    for (const parameter of parameters.filter((item) => item.in === "path")) {
      const value = values[`path:${parameter.name}`];
      path = path.replace(`{${parameter.name}}`, encodeURIComponent(value ?? ""));
    }

    const baseUrl = resolveServerUrl(document, window.location.origin, operation);
    const url = new URL(`${baseUrl.replace(/\/$/, "")}/${path.replace(/^\//, "")}`, window.location.origin);
    for (const parameter of parameters.filter((item) => item.in === "query")) {
      const value = values[`query:${parameter.name}`];
      if (value) url.searchParams.set(parameter.name, value);
    }

    const headers: Record<string, string> = { Accept: "application/json" };
    if (apiKey && authentication) headers[authentication.header] = `${authentication.prefix}${apiKey}`;
    if (request && request[0] !== "multipart/form-data") headers["Content-Type"] = request[0];
    for (const parameter of parameters.filter((item) => item.in === "header")) {
      const value = values[`header:${parameter.name}`];
      if (value) headers[parameter.name] = value;
    }

    let requestBody: BodyInit | undefined;
    if (request?.[0] === "application/json") requestBody = body;
    if (request?.[0] === "application/x-www-form-urlencoded") {
      try {
        requestBody = new URLSearchParams(JSON.parse(body));
      } catch {
        setResult("Enter valid JSON request values before sending the request.");
        return;
      }
    }
    if (request?.[0] === "multipart/form-data") {
      const form = new FormData();
      let values: Record<string, unknown> = {};
      try {
        values = JSON.parse(body);
      } catch {
        setResult("Enter valid JSON request values before sending the request.");
        return;
      }
      for (const [name, value] of Object.entries(values)) {
        if (requestSchema?.properties?.[name]?.format === "binary" || value === null || value === undefined) continue;
        form.append(name, typeof value === "string" ? value : JSON.stringify(value));
      }
      for (const [name, file] of Object.entries(files)) form.append(name, file);
      const missingFile = binaryFields.find(([name]) => requestSchema?.required?.includes(name) && !files[name]);
      if (missingFile) {
        setResult(`Choose ${missingFile[0]} before sending the request.`);
        return;
      }
      requestBody = form;
    }
    if (
      request &&
      !["application/json", "application/x-www-form-urlencoded", "multipart/form-data"].includes(request[0])
    ) {
      requestBody = body;
    }

    setSending(true);
    setResult("");
    setStatus(undefined);
    try {
      const response = await fetch(url, {
        body: requestBody,
        headers,
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
    <main className="min-w-0 flex-1 px-5 py-8 lg:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.8fr)]">
        <div className="min-w-0 space-y-8">
          <section>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge variant={METHOD_VARIANTS[operation.method]}>{operation.method.toUpperCase()}</Badge>
              <code className="break-all font-mono text-sm">{operation.path}</code>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-tight">{operation.summary ?? operation.id}</h1>
            {operation.description ? (
              <div className="mt-4 text-sm leading-7 text-muted-foreground">
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
                className="min-h-64 font-mono text-xs leading-relaxed"
                onChange={(event) => setBody(event.target.value)}
                spellCheck={false}
                value={body}
              />
              {binaryFields.map(([name]) => (
                <Input
                  aria-label={name}
                  key={name}
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
                {sending ? <LoaderCircleIcon className="animate-spin" /> : <PlayIcon />}
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
                <div className="space-y-2">
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
  const [selectedId, setSelectedId] = useState("");
  const deferredQuery = useDeferredValue(query);
  const operations = useMemo(() => (document ? getOperations(document) : []), [document]);
  const filtered = useMemo(() => {
    const normalized = deferredQuery.trim().toLowerCase();
    return normalized
      ? operations.filter((operation) => operationSearchText(operation).includes(normalized))
      : operations;
  }, [deferredQuery, operations]);
  const selected =
    filtered.find((operation) => operation.id === selectedId) ??
    filtered[0] ??
    operations.find((operation) => operation.id === selectedId) ??
    operations[0];
  const tags = useMemo(() => {
    const grouped = new Map<string, ApiOperation[]>();
    for (const operation of filtered) grouped.set(operation.tag, [...(grouped.get(operation.tag) ?? []), operation]);
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

  if (error) return <div className="p-8 text-sm text-destructive">{error}</div>;
  if (!document || !selected) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        <LoaderCircleIcon className="mr-2 size-4 animate-spin" /> Loading API reference
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
              <MenuIcon />
            </SheetTrigger>
            <SheetContent className="gap-0 p-0" side="left">
              <SheetHeader>
                <SheetTitle>API reference</SheetTitle>
              </SheetHeader>
              <Separator />
              <OperationNavigation
                onQueryChange={setQuery}
                onSelect={(id) => {
                  setSelectedId(id);
                  setNavigationOpen(false);
                }}
                query={query}
                selectedId={selected.id}
                tags={tags}
              />
            </SheetContent>
          </Sheet>
          <div className="flex min-w-0 items-center gap-3">
            <div className="size-7 rounded-lg bg-linear-to-br from-(--ultralytics-logo-gradient-start) to-(--ultralytics-logo-gradient-end)" />
            <div className="min-w-0">
              <p className="truncate font-heading text-sm font-semibold">{document.info.title}</p>
              <p className="text-xs text-muted-foreground">API {document.info.version}</p>
            </div>
          </div>
          {hasAuthentication ? (
            <div className="ml-auto flex w-full max-w-sm items-center gap-2">
              <KeyRoundIcon className="size-4 shrink-0 text-muted-foreground" />
              <Input
                aria-label="API key"
                autoComplete="off"
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
          <OperationNavigation
            onQueryChange={setQuery}
            onSelect={setSelectedId}
            query={query}
            selectedId={selected.id}
            tags={tags}
          />
        </aside>
        <OperationPanel
          apiKey={apiKey}
          document={document}
          environment={apiKeyEnvironment}
          operation={selected}
          python={python}
        />
      </div>
    </div>
  );
}
