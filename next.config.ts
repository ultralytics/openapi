// Ultralytics 🚀 AGPL-3.0 License - https://ultralytics.com/license

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import type { NextConfig } from "next";

import { configPath, getConfig } from "./lib/config";

const config = getConfig();
const buildInputs = [
  "app",
  "components",
  "lib",
  "bun.lock",
  "package.json",
  "next.config.ts",
  "postcss.config.mjs",
  configPath,
  "public/openapi.json",
];

function hashPath(hash: ReturnType<typeof createHash>, path: string, label = path): void {
  if (statSync(path).isDirectory()) {
    for (const entry of readdirSync(path).sort()) hashPath(hash, `${path}/${entry}`, `${label}/${entry}`);
  } else {
    hash.update(label).update(readFileSync(path));
  }
}

const nextConfig: NextConfig = {
  basePath: config.docs?.basePath,
  generateBuildId: async () => {
    const hash = createHash("sha256");
    for (const path of buildInputs) hashPath(hash, path, path === configPath ? "openapi.config.json" : path);
    return hash.digest("hex").slice(0, 20);
  },
  output: "export",
};

export default nextConfig;
