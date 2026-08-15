// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { mkdir } from "node:fs/promises";
import { getConfig } from "../lib/config";

const config = getConfig();

if (config.source.startsWith("http://")) throw new Error("Remote OpenAPI sources must use HTTPS");
const text = config.source.startsWith("https://")
  ? await fetch(config.source, { redirect: "error" })
      .catch((error: Error) => {
        throw new Error(
          `Failed to fetch ${config.source} (redirects are rejected; use the final URL): ${error.message}`,
        );
      })
      .then((response) => {
        if (!response.ok)
          throw new Error(`Failed to fetch ${config.source}: ${response.status} ${response.statusText}`);
        return response.text();
      })
  : await Bun.file(config.source).text();
const document = JSON.parse(text);
if (!document.openapi || !document.info || !document.paths) {
  throw new Error(`${config.source} is not an OpenAPI document`);
}

await mkdir("public", { recursive: true });
await Bun.write("public/openapi.json", text.endsWith("\n") ? text : `${text}\n`);
console.log(`Synced OpenAPI ${document.openapi} with ${Object.keys(document.paths).length} paths`);
