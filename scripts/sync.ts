// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import config from "../openapi.config.json";

const response = await fetch(config.source);
if (!response.ok) throw new Error(`Failed to fetch ${config.source}: ${response.status} ${response.statusText}`);

const document = await response.json();
if (!document.openapi || !document.info || !document.paths) {
  throw new Error(`${config.source} is not an OpenAPI document`);
}

await Bun.write("public/openapi.json", `${JSON.stringify(document, null, 2)}\n`);
console.log(`Synced OpenAPI ${document.openapi} with ${Object.keys(document.paths).length} paths`);
