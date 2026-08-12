// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { mkdir } from "node:fs/promises";
import { getConfig } from "../lib/config";

const config = getConfig();

if (config.source.startsWith("http://")) throw new Error("Remote OpenAPI sources must use HTTPS");
const document = config.source.startsWith("https://")
  ? await fetch(config.source, { redirect: "error" }).then((response) => {
      if (!response.ok) throw new Error(`Failed to fetch ${config.source}: ${response.status} ${response.statusText}`);
      return response.json();
    })
  : await Bun.file(config.source).json();
if (!document.openapi || !document.info || !document.paths) {
  throw new Error(`${config.source} is not an OpenAPI document`);
}

await mkdir("public", { recursive: true });
await Bun.write("public/openapi.json", `${JSON.stringify(document, null, 2)}\n`);
console.log(`Synced OpenAPI ${document.openapi} with ${Object.keys(document.paths).length} paths`);
