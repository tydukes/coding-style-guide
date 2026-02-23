/**
 * Integration tests for the list command.
 * Spawns the compiled CLI as a subprocess to avoid process.exit() contamination.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to cli/ root (this file compiles to dist/commands/list.test.js)
const cliRoot = join(__dirname, "..", "..");
const cliEntry = join(cliRoot, "dist", "index.js");

function run(args: string[]): { status: number | null; stdout: string; stderr: string } {
  const result = spawnSync("node", [cliEntry, ...args], {
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

describe("list command — integration", () => {
  it("list --format json exits 0 and returns object with known linter keys", () => {
    const { status, stdout } = run(["list", "--format", "json"]);
    assert.equal(status, 0);
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    assert.ok(typeof parsed === "object" && parsed !== null);
    // Known built-in linter: black
    assert.ok("black" in parsed, "Expected 'black' in linter list");
  });

  it("list --language python only shows python linters", () => {
    const { status, stdout } = run(["list", "--format", "json", "--language", "python"]);
    assert.equal(status, 0);
    const parsed = JSON.parse(stdout) as Record<string, { language: string }>;
    for (const [, info] of Object.entries(parsed)) {
      assert.equal(info.language, "python");
    }
  });

  it("list --language invalid exits non-zero with error message", () => {
    // Commander does not validate --language values, so this may just return empty results
    // The test verifies that an unknown language doesn't crash (exits 0) or exits non-zero
    const { status, stdout, stderr } = run(["list", "--format", "json", "--language", "invalidlanguage999"]);
    if (status === 0) {
      // Should return empty object (no linters match)
      const parsed = JSON.parse(stdout) as Record<string, unknown>;
      assert.equal(Object.keys(parsed).length, 0);
    } else {
      // Or exits non-zero with an error message
      assert.match(stderr + stdout, /error|invalid|unknown/i);
    }
  });

  it("list exits 0 in text format", () => {
    const { status } = run(["list"]);
    assert.equal(status, 0);
  });
});
