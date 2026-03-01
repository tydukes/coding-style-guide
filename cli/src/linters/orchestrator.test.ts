/**
 * Unit and integration tests for the linter orchestrator.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { LintResult, LintIssue } from "../types.js";
import { loadConfig } from "../config/loader.js";
import { findFiles, runLinters } from "./orchestrator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
// Compiled to dist/linters/orchestrator.test.js — cli/ root is two dirs up
const cliRoot = join(__dirname, "..", "..");
const fixtureDir = join(cliRoot, "test", "fixtures");

describe("orchestrator — findFiles", () => {
  it("discovers .sh and .yaml files in fixtures dir", async () => {
    const config = await loadConfig();
    const files = await findFiles([`${fixtureDir}/**/*`], config);
    const shFiles = files.filter((f: string) => f.endsWith(".sh"));
    const yamlFiles = files.filter(
      (f: string) => f.endsWith(".yaml") || f.endsWith(".yml")
    );
    assert.ok(shFiles.length > 0, "Expected at least one .sh fixture file");
    assert.ok(yamlFiles.length > 0, "Expected at least one .yaml fixture file");
  });

  it("respects ignore patterns (excludes node_modules)", async () => {
    const config = await loadConfig();
    const files = await findFiles([], config);
    const nodeModulesFiles = files.filter((f: string) => f.includes("node_modules"));
    assert.equal(
      nodeModulesFiles.length,
      0,
      "Expected no files from node_modules"
    );
  });
});

describe("orchestrator — runLinters", () => {
  it("runLinters on bad.sh returns SC2164 when shellcheck is available", async () => {
    const config = await loadConfig();
    const badSh = join(fixtureDir, "bad.sh");
    const output = await runLinters([badSh], config);

    const allIssues = output.results.flatMap((r: LintResult) => r.issues);

    // If shellcheck is not installed, skip the assertion
    if (allIssues.some((i: LintIssue) => i.rule === "linter-not-installed")) {
      return;
    }

    const sc2164 = allIssues.find((i: LintIssue) => i.rule === "SC2164");
    assert.ok(sc2164 !== undefined, "Expected SC2164 issue from bad.sh");
  });

  it("runLinters on bad.yaml returns at least one error when yamllint is available", async () => {
    const config = await loadConfig();
    const badYaml = join(fixtureDir, "bad.yaml");
    const output = await runLinters([badYaml], config);

    const allIssues = output.results.flatMap((r: LintResult) => r.issues);

    // If yamllint is not installed, skip the assertion
    if (allIssues.some((i: LintIssue) => i.rule === "linter-not-installed")) {
      return;
    }

    const errors = allIssues.filter((i: LintIssue) => i.severity === "error");
    assert.ok(errors.length > 0, "Expected at least one error from bad.yaml");
  });
});
