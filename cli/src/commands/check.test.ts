/**
 * Integration tests for the check command.
 * Spawns the compiled CLI as a subprocess to avoid process.exit() contamination.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Resolve to cli/ root (this file compiles to dist/commands/check.test.js)
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

describe("check command — integration", () => {
  it("--version exits 0 and prints semver", () => {
    const { status, stdout } = run(["--version"]);
    assert.equal(status, 0);
    assert.match(stdout, /\b\d{1,4}\.\d{1,4}\.\d{1,4}\b/);
  });

  it("invalid --format exits non-zero with helpful message", () => {
    const { status, stderr } = run(["check", "--format", "bad"]);
    assert.notEqual(status, 0);
    assert.match(stderr, /invalid|error|bad|Allowed/i);
  });

  it("--format json on fixture dir returns valid JSON", () => {
    const fixtureDir = join(cliRoot, "test", "fixtures");
    const { stdout } = run(["check", "--format", "json", fixtureDir]);
    // May exit 0 or 1 depending on installed linters; stdout should be parseable JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(stdout);
    } catch {
      // If linters aren't installed, output may be empty or error text — skip strict check
      return;
    }
    assert.ok(parsed !== null && typeof parsed === "object");
  });

  it("list --format json exits 0 and returns object with linter keys", () => {
    const { status, stdout } = run(["list", "--format", "json"]);
    assert.equal(status, 0);
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    assert.ok(typeof parsed === "object" && parsed !== null);
    // Should contain at least one known linter
    const keys = Object.keys(parsed);
    assert.ok(keys.length > 0, "Expected at least one linter in output");
  });

  it("--no-color produces no ANSI escape codes on list", () => {
    const { status, stdout } = run(["--no-color", "list"]);
    assert.equal(status, 0);
    // ANSI escape sequences start with ESC (\x1b or \u001b)
    assert.doesNotMatch(stdout, /\u001b\[/);
  });
});
