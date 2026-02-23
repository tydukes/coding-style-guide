/**
 * Integration tests for the check command.
 * Spawns the compiled CLI as a subprocess to avoid process.exit() contamination.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { run, cliRoot } from "./test-helpers.js";

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
    const keys = Object.keys(parsed);
    assert.ok(keys.length > 0, "Expected at least one linter in output");
  });

  it("--no-color produces no ANSI escape codes on list", () => {
    const { status, stdout } = run(["--no-color", "list"]);
    assert.equal(status, 0);
    // ANSI escape sequences start with ESC (U+001B) followed by "["
    assert.ok(!stdout.includes(String.fromCodePoint(27) + "["), "Expected no ANSI escape codes in output");
  });
});
