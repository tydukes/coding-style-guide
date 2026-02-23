/**
 * @module commands/test-helpers
 * @description Shared subprocess runner for CLI integration tests
 */

import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// cli/ root — this file compiles to dist/commands/test-helpers.js
export const cliRoot = join(__dirname, "..", "..");
export const cliEntry = join(cliRoot, "dist", "index.js");

export interface RunResult {
  status: number | null;
  stdout: string;
  stderr: string;
}

export function run(args: string[]): RunResult {
  const result = spawnSync(process.execPath, [cliEntry, ...args], {
    encoding: "utf-8",
    cwd: cliRoot,
    timeout: 30_000,
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}
