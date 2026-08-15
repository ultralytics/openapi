// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { readFileSync } from "node:fs";

import { ApiReference } from "@/components/api-reference";
import { getConfig } from "@/lib/config";
import type { OpenApiDocument } from "@/lib/openapi";

export default function Page() {
  const config = getConfig();
  const document = JSON.parse(readFileSync("public/openapi.json", "utf8")) as OpenApiDocument;
  return (
    <ApiReference
      apiKeyEnvironment={config.apiKey.environment}
      document={document}
      python={config.python}
      specUrl={`${config.docs?.basePath ?? ""}/openapi.json`}
    />
  );
}
