/**
 * Integration tests for the fix command.
 * Spawns the compiled CLI as a subprocess to avoid process.exit() contamination.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { run, cliRoot } from "./test-helpers.js";

describe("fix command — integration", () => {
  it("--help exits 0 and stdout contains 'fix'", () => {
    const { status, stdout } = run(["fix", "--help"]);
    assert.equal(status, 0);
    assert.match(stdout, /fix/i);
  });

  it("fix on fixture dir exits without crash (status < 2)", () => {
    const fixtureDir = join(cliRoot, "test", "fixtures");
    const { status } = run(["fix", "--format", "json", fixtureDir]);
    // Exit 0 (no errors) or 1 (issues found) — both are valid; should not crash
    assert.ok(
      status !== null && status < 2,
      `Expected exit status < 2, got ${status}`
    );
  });
});
