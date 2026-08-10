// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { getConfig } from "../lib/config";
import { generatePython } from "../lib/generators/python";
import type { OpenApiDocument } from "../lib/openapi";

const config = getConfig();

const document = (await Bun.file("public/openapi.json").json()) as OpenApiDocument;
const count = await generatePython(document, config, "generated/python");
console.log(`Generated ${count} Python operations in generated/python`);
