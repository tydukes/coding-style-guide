/**
 * Unit tests for output formatters (text, JSON, SARIF).
 * Uses Node's built-in test runner (node:test + node:assert).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatOutput } from "../output/formatter.js";
import type { LintOutput } from "../types.js";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const ERROR_OUTPUT: LintOutput = {
  results: [
    {
      file: "/project/src/main.py",
      language: "python",
      issues: [
        {
          line: 10,
          column: 5,
          message: "expected 2 blank lines, found 1",
          rule: "E302",
          severity: "error",
          fixable: false,
        },
      ],
      fixable: 0,
    },
  ],
  summary: {
    files: 1,
    errors: 1,
    warnings: 0,
    fixable: 0,
    duration: 42,
  },
};

const WARNING_OUTPUT: LintOutput = {
  results: [
    {
      file: "/project/README.md",
      language: "markdown",
      issues: [
        {
          line: 1,
          column: 1,
          message: "Line length",
          rule: "MD013",
          severity: "warning",
          fixable: false,
        },
      ],
      fixable: 0,
    },
  ],
  summary: {
    files: 1,
    errors: 0,
    warnings: 1,
    fixable: 0,
    duration: 10,
  },
};

const CLEAN_OUTPUT: LintOutput = {
  results: [],
  summary: { files: 3, errors: 0, warnings: 0, fixable: 0, duration: 5 },
};

const MIXED_OUTPUT: LintOutput = {
  results: [
    {
      file: "/project/a.py",
      language: "python",
      issues: [
        { line: 1, column: 1, message: "err msg", rule: "E001", severity: "error", fixable: false },
        { line: 2, column: 1, message: "warn msg", rule: "W001", severity: "warning", fixable: true },
      ],
      fixable: 1,
    },
  ],
  summary: { files: 1, errors: 1, warnings: 1, fixable: 1, duration: 7 },
};

// ---------------------------------------------------------------------------
// Text format
// ---------------------------------------------------------------------------

describe("formatOutput — text", () => {
  it("includes error count in summary", () => {
    const out = formatOutput(ERROR_OUTPUT, "text");
    assert.match(out, /1 error/);
  });

  it("includes warning count in summary", () => {
    const out = formatOutput(WARNING_OUTPUT, "text");
    assert.match(out, /1 warning/);
  });

  it("shows fixable indicator when issues are fixable", () => {
    const out = formatOutput(MIXED_OUTPUT, "text");
    assert.match(out, /fixable/i);
  });

  it("quiet mode suppresses warnings", () => {
    const out = formatOutput(MIXED_OUTPUT, "text", { quiet: true });
    // warnings suppressed — the line with "warn msg" should not appear
    assert.doesNotMatch(out, /warn msg/);
    // errors still present
    assert.match(out, /err msg/);
  });

  it("returns a non-empty string for clean output", () => {
    const out = formatOutput(CLEAN_OUTPUT, "text");
    assert.ok(out.length > 0);
    assert.match(out, /3 files? checked/);
  });
});

// ---------------------------------------------------------------------------
// JSON format
// ---------------------------------------------------------------------------

describe("formatOutput — json", () => {
  it("produces valid JSON", () => {
    const out = formatOutput(ERROR_OUTPUT, "json");
    assert.doesNotThrow(() => JSON.parse(out));
  });

  it("round-trips results correctly", () => {
    const out = formatOutput(ERROR_OUTPUT, "json");
    const parsed = JSON.parse(out) as LintOutput;
    assert.equal(parsed.summary.errors, 1);
    assert.equal(parsed.results.length, 1);
    assert.equal(parsed.results[0].issues[0].rule, "E302");
  });

  it("includes summary fields", () => {
    const out = formatOutput(CLEAN_OUTPUT, "json");
    const parsed = JSON.parse(out) as LintOutput;
    assert.equal(parsed.summary.files, 3);
    assert.equal(parsed.summary.duration, 5);
  });
});

// ---------------------------------------------------------------------------
// SARIF format
// ---------------------------------------------------------------------------

describe("formatOutput — sarif", () => {
  it("produces valid JSON", () => {
    const out = formatOutput(ERROR_OUTPUT, "sarif");
    assert.doesNotThrow(() => JSON.parse(out));
  });

  it("has correct SARIF version", () => {
    const out = formatOutput(ERROR_OUTPUT, "sarif");
    const parsed = JSON.parse(out) as { version: string };
    assert.equal(parsed.version, "2.1.0");
  });

  it("has $schema field", () => {
    const out = formatOutput(ERROR_OUTPUT, "sarif");
    const parsed = JSON.parse(out) as { $schema: string };
    assert.match(parsed.$schema, /sarif/i);
  });

  it("has runs array with tool driver", () => {
    const out = formatOutput(ERROR_OUTPUT, "sarif");
    const parsed = JSON.parse(out) as {
      runs: Array<{ tool: { driver: { name: string } } }>;
    };
    assert.ok(Array.isArray(parsed.runs));
    assert.equal(parsed.runs[0].tool.driver.name, "devops-style");
  });

  it("maps issues to SARIF results with ruleId and level", () => {
    const out = formatOutput(ERROR_OUTPUT, "sarif");
    const parsed = JSON.parse(out) as {
      runs: Array<{ results: Array<{ ruleId: string; level: string }> }>;
    };
    const result = parsed.runs[0].results[0];
    assert.equal(result.ruleId, "E302");
    assert.equal(result.level, "error");
  });

  it("produces empty results array for clean output", () => {
    const out = formatOutput(CLEAN_OUTPUT, "sarif");
    const parsed = JSON.parse(out) as {
      runs: Array<{ results: unknown[] }>;
    };
    assert.equal(parsed.runs[0].results.length, 0);
  });
});
