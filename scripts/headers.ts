// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { readdir } from "node:fs/promises";
import { extname } from "node:path";
import { getConfig } from "../lib/config";

const header = getConfig().header;

async function addHeader(path: string): Promise<void> {
  const entries = await readdir(path, { withFileTypes: true });
  await Promise.all(
    entries.map(async (entry) => {
      const child = `${path}/${entry.name}`;
      if (entry.isDirectory()) return addHeader(child);

      const extension = extname(entry.name);
      if (extension === ".html") {
        const content = await Bun.file(child).text();
        const doctype = content.match(/^<!doctype html>/i)?.[0] ?? "";
        const prefix = `${doctype ? `${doctype}\n` : ""}<!-- ${header} -->\n\n`;
        if (!content.startsWith(prefix)) await Bun.write(child, `${prefix}${content.slice(doctype.length)}`);
        return;
      }

      const prefix = {
        ".css": `/* ${header} */\n\n`,
        ".js": `// ${header}\n\n`,
        ".py": `# ${header}\n\n`,
        ".toml": `# ${header}\n\n`,
      }[extension];
      if (!prefix) return;

      const content = await Bun.file(child).text();
      if (!content.startsWith(prefix)) await Bun.write(child, `${prefix}${content}`);
    }),
  );
}

if (header) await Promise.all(process.argv.slice(2).map(addHeader));
