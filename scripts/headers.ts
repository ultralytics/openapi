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

      const style = {
        ".css": [`/* ${header} */\n\n`, ""],
        ".html": ["", `<!-- ${header} -->\n`],
        ".js": [`// ${header}\n\n`, ""],
        ".py": [`# ${header}\n\n`, ""],
        ".toml": [`# ${header}\n\n`, ""],
      }[extname(entry.name)];
      if (!style) return;

      const content = await Bun.file(child).text();
      const [prefix, suffix] = style;
      if (!content.startsWith(prefix) || !content.endsWith(suffix))
        await Bun.write(child, `${prefix}${content}${suffix}`);
    }),
  );
}

if (header) await Promise.all(process.argv.slice(2).map(addHeader));
