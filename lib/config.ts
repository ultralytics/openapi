// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export interface OpenApiConfig {
  apiKey: { environment: string };
  docs?: { basePath?: string };
  header?: string;
  license: { file: string; id: string; url?: string };
  name: string;
  repository?: string;
  python: {
    authors?: Array<{ email?: string; name: string }>;
    client: string;
    classifiers?: string[];
    description?: string;
    install: string;
    keywords?: string[];
    maintainers?: Array<{ email?: string; name: string }>;
    package: string;
    project: string;
    readme?: string;
    requiresPython?: string;
    version: string;
  };
  source: string;
}

export const configPath = process.env.OPENAPI_CONFIG ?? "openapi.config.json";

export function getConfig(): OpenApiConfig {
  const config = JSON.parse(readFileSync(configPath, "utf8")) as OpenApiConfig;
  const required = {
    "apiKey.environment": config.apiKey?.environment,
    name: config.name,
    "python.client": config.python?.client,
    "python.package": config.python?.package,
    "python.project": config.python?.project,
    "python.version": config.python?.version,
    source: config.source,
  };
  const missing = Object.entries(required).find(([, value]) => !value)?.[0];
  if (missing) throw new Error(`${configPath} is missing ${missing}`);
  config.python.install ||= `pip install ${config.python.project}`;
  config.license ??= {
    file: fileURLToPath(new URL("../LICENSE", import.meta.url)),
    id: "AGPL-3.0-only",
    url: "https://spdx.org/licenses/AGPL-3.0-only.html",
  };
  const directory = dirname(resolve(configPath));
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(config.source) && !isAbsolute(config.source)) {
    config.source = resolve(directory, config.source);
  }
  if (!isAbsolute(config.license.file)) config.license.file = resolve(directory, config.license.file);
  if (config.python.readme && !isAbsolute(config.python.readme)) {
    config.python.readme = resolve(directory, config.python.readme);
  }
  return config;
}
