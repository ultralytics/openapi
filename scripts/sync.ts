// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { mkdir } from "node:fs/promises";
import config from "../openapi.config.json";

const document = /^https?:\/\//.test(config.source)
  ? await fetch(config.source).then((response) => {
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
