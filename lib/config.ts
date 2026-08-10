// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { readFileSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";

export interface OpenApiConfig {
  apiKey: { environment: string };
  docs?: { basePath?: string };
  header?: string;
  license?: { file: string; id: string };
  name: string;
  python: {
    client: string;
    install?: string;
    package: string;
    project: string;
    version: string;
  };
  source: string;
}

export const configPath = process.env.OPENAPI_CONFIG ?? "openapi.config.json";

export function getConfig(): OpenApiConfig {
  const config = JSON.parse(readFileSync(configPath, "utf8")) as OpenApiConfig;
  const directory = dirname(resolve(configPath));
  if (!/^[a-z][a-z\d+.-]*:\/\//i.test(config.source) && !isAbsolute(config.source)) {
    config.source = resolve(directory, config.source);
  }
  if (config.license && !isAbsolute(config.license.file)) {
    config.license.file = resolve(directory, config.license.file);
  }
  return config;
}
