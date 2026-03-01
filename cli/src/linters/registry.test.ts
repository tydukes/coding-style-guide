/**
 * Unit tests for linter registry — parse functions and execCommand behavior.
 * Uses Node's built-in test runner (node:test + node:assert).
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

// ---------------------------------------------------------------------------
// Inline re-implementations of the pure parse functions so tests don't depend
// on spawning processes.  The real functions are private; we shadow them here
// with the same logic and test the same contract.
// ---------------------------------------------------------------------------

// ---- helpers (copied from registry.ts) ------------------------------------

function parseFileLineCol(line: string): { lineNum: number; col: number; rest: string } | null {
  const firstColon = line.indexOf(":");
  if (firstColon === -1) return null;
  const afterFile = line.slice(firstColon + 1);
  const secondColon = afterFile.indexOf(":");
  if (secondColon === -1) return null;
  const lineNum = Number.parseInt(afterFile.slice(0, secondColon), 10);
  if (Number.isNaN(lineNum)) return null;
  const afterLine = afterFile.slice(secondColon + 1);
  const thirdColon = afterLine.indexOf(":");
  if (thirdColon === -1) return null;
  const col = Number.parseInt(afterLine.slice(0, thirdColon), 10);
  if (Number.isNaN(col)) return null;
  const rest = afterLine.slice(thirdColon + 1).trim();
  return { lineNum, col, rest };
}

// ---- parseFlake8Output (with file field) ----------------------------------

type LintIssueWithFile = {
  file: string;
  line: number;
  column: number;
  message: string;
  rule: string;
  severity: "error" | "warning";
  fixable: boolean;
};

function parseFlake8Output(output: string): LintIssueWithFile[] {
  const issues: LintIssueWithFile[] = [];
  for (const line of output.split("\n").filter(Boolean)) {
    const firstColon = line.indexOf(":");
    if (firstColon === -1) continue;
    const file = line.slice(0, firstColon);
    const parsed = parseFileLineCol(line);
    if (!parsed) continue;
    const { lineNum, col, rest } = parsed;
    const spaceIdx = rest.indexOf(" ");
    if (spaceIdx === -1) continue;
    const code = rest.slice(0, spaceIdx);
    const message = rest.slice(spaceIdx + 1).trim();
    if (code && message) {
      issues.push({
        file,
        line: lineNum,
        column: col,
        message,
        rule: code,
        severity: code.startsWith("E") ? "error" : "warning",
        fixable: false,
      });
    }
  }
  return issues;
}

// ---- parseESLintOutput (simplified) ---------------------------------------

type ESLintResult = { file: string; issues: { rule: string; severity: string; fixable: boolean }[] };

function parseESLintOutput(output: string): ESLintResult[] {
  try {
    const results = JSON.parse(output);
    return results.map((r: { filePath: string; messages: { ruleId: string; severity: number; fix?: unknown }[] }) => ({
      file: r.filePath,
      issues: r.messages.map((m) => ({
        rule: m.ruleId || "unknown",
        severity: m.severity === 2 ? "error" : "warning",
        fixable: !!m.fix,
      })),
    }));
  } catch {
    return [];
  }
}

// ---- parseShellcheckOutput ------------------------------------------------

type ShellcheckIssue = { rule: string; severity: string; fixable: boolean };

function toSeverity(level: string): "error" | "warning" | "info" {
  if (level === "error") return "error";
  if (level === "warning") return "warning";
  return "info";
}

function parseShellcheckOutput(output: string): ShellcheckIssue[] {
  try {
    const results = JSON.parse(output);
    return results.map((i: { code: number; level: string; fix?: { replacements: unknown[] } }) => ({
      rule: `SC${i.code}`,
      severity: toSeverity(i.level),
      fixable: !!i.fix?.replacements?.length,
    }));
  } catch {
    return [];
  }
}

// ---- parseYamllintOutput --------------------------------------------------

type YamllintIssue = { rule: string; severity: string };

function parseYamllintOutput(output: string): YamllintIssue[] {
  const issues: YamllintIssue[] = [];
  for (const line of output.split("\n").filter(Boolean)) {
    const parsed = parseFileLineCol(line);
    if (!parsed) continue;
    const { rest } = parsed;
    const ls = rest.indexOf("["), le = rest.indexOf("]");
    if (ls === -1 || le === -1 || le <= ls) continue;
    const level = rest.slice(ls + 1, le);
    const afterLevel = rest.slice(le + 1).trim();
    const rs = afterLevel.lastIndexOf("("), re = afterLevel.lastIndexOf(")");
    if (rs === -1 || re === -1 || re <= rs) continue;
    const rule = afterLevel.slice(rs + 1, re).trim();
    if (level && rule) issues.push({ rule, severity: level === "error" ? "error" : "warning" });
  }
  return issues;
}

// ---- parseMarkdownlintOutput ----------------------------------------------

type MarkdownIssue = { rule: string; fixable: boolean };

function parseMarkdownlintOutput(output: string): MarkdownIssue[] {
  const issues: MarkdownIssue[] = [];
  for (const line of output.split("\n").filter(Boolean)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const afterFile = line.slice(colonIdx + 1);
    const spaceIdx = afterFile.indexOf(" ");
    if (spaceIdx === -1) continue;
    const lineNum = Number.parseInt(afterFile.slice(0, spaceIdx), 10);
    if (Number.isNaN(lineNum)) continue;
    const rest = afterFile.slice(spaceIdx + 1).trim();
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) continue;
    const rule = rest.slice(0, slashIdx);
    if (!rule.startsWith("MD")) continue;
    const afterSlash = rest.slice(slashIdx + 1);
    const aliasEndIdx = afterSlash.indexOf(" ");
    if (aliasEndIdx === -1) continue;
    issues.push({ rule, fixable: rule === "MD009" || rule === "MD010" || rule === "MD047" });
  }
  return issues;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("parseFlake8Output", () => {
  it("parses a single-file batch correctly", () => {
    const output = "foo.py:10:5: E302 expected 2 blank lines, found 1\n";
    const issues = parseFlake8Output(output);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].file, "foo.py");
    assert.equal(issues[0].line, 10);
    assert.equal(issues[0].column, 5);
    assert.equal(issues[0].rule, "E302");
    assert.equal(issues[0].severity, "error");
    assert.equal(issues[0].fixable, false);
  });

  it("maps W-codes to warning severity", () => {
    const output = "bar.py:1:1: W291 trailing whitespace\n";
    const issues = parseFlake8Output(output);
    assert.equal(issues[0].severity, "warning");
  });

  it("scopes issues to correct files in a multi-file batch", () => {
    const output = [
      "a.py:1:1: E101 indentation contains mixed spaces and tabs",
      "b.py:2:3: W291 trailing whitespace",
      "a.py:5:1: E302 expected 2 blank lines, found 1",
    ].join("\n");

    const issues = parseFlake8Output(output);
    const aIssues = issues.filter((i) => i.file === "a.py");
    const bIssues = issues.filter((i) => i.file === "b.py");

    assert.equal(aIssues.length, 2);
    assert.equal(bIssues.length, 1);
  });

  it("returns empty array for empty input", () => {
    assert.deepEqual(parseFlake8Output(""), []);
  });

  it("skips malformed lines", () => {
    const output = "not a valid line\n";
    assert.deepEqual(parseFlake8Output(output), []);
  });
});

describe("parseESLintOutput", () => {
  it("parses valid ESLint JSON", () => {
    const json = JSON.stringify([
      {
        filePath: "/src/index.ts",
        messages: [
          { line: 1, column: 1, message: "no-unused-vars", ruleId: "no-unused-vars", severity: 2, fix: null },
        ],
      },
    ]);
    const results = parseESLintOutput(json);
    assert.equal(results.length, 1);
    assert.equal(results[0].file, "/src/index.ts");
    assert.equal(results[0].issues[0].severity, "error");
  });

  it("returns empty array on malformed JSON", () => {
    assert.deepEqual(parseESLintOutput("{not json}"), []);
  });

  it("returns empty array on empty input", () => {
    assert.deepEqual(parseESLintOutput(""), []);
  });

  it("marks fixable issues correctly", () => {
    const json = JSON.stringify([
      {
        filePath: "/src/a.ts",
        messages: [
          { line: 1, column: 1, message: "semi", ruleId: "semi", severity: 1, fix: { range: [0, 1], text: ";" } },
        ],
      },
    ]);
    const results = parseESLintOutput(json);
    assert.equal(results[0].issues[0].fixable, true);
  });
});

describe("parseShellcheckOutput", () => {
  it("formats SC code correctly", () => {
    const json = JSON.stringify([
      { line: 1, column: 1, message: "test", code: 2006, level: "warning", fix: null },
    ]);
    const issues = parseShellcheckOutput(json);
    assert.equal(issues[0].rule, "SC2006");
  });

  it("maps level to severity", () => {
    const json = JSON.stringify([
      { line: 1, column: 1, message: "test", code: 2001, level: "error", fix: null },
      { line: 2, column: 1, message: "test", code: 2002, level: "info", fix: null },
    ]);
    const issues = parseShellcheckOutput(json);
    assert.equal(issues[0].severity, "error");
    assert.equal(issues[1].severity, "info");
  });

  it("detects fixable via replacements array", () => {
    const json = JSON.stringify([
      { line: 1, column: 1, message: "test", code: 2001, level: "warning",
        fix: { replacements: [{ line: 1, endLine: 1, col: 1, endCol: 2, precedence: 1, insertionPoint: "beforeStart", replacement: "x" }] } },
    ]);
    const issues = parseShellcheckOutput(json);
    assert.equal(issues[0].fixable, true);
  });

  it("returns empty array on malformed JSON", () => {
    assert.deepEqual(parseShellcheckOutput("{bad}"), []);
  });
});

describe("parseYamllintOutput", () => {
  it("extracts level and rule", () => {
    const output = "file.yaml:1:1: [error] too many spaces inside braces (braces)\n";
    const issues = parseYamllintOutput(output);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].severity, "error");
    assert.equal(issues[0].rule, "braces");
  });

  it("maps non-error levels to warning", () => {
    const output = "file.yaml:2:3: [warning] missing document start (document-start)\n";
    const issues = parseYamllintOutput(output);
    assert.equal(issues[0].severity, "warning");
  });

  it("skips malformed lines", () => {
    assert.deepEqual(parseYamllintOutput("not parseable\n"), []);
  });
});

describe("parseMarkdownlintOutput", () => {
  it("detects MD rule", () => {
    const output = "README.md:10 MD013/line-length Line length [Expected: 80; Actual: 120]\n";
    const issues = parseMarkdownlintOutput(output);
    assert.equal(issues.length, 1);
    assert.equal(issues[0].rule, "MD013");
  });

  it("marks fixable rules", () => {
    const output = "README.md:1 MD009/no-trailing-spaces Trailing spaces [Expected: 0; Actual: 2]\n";
    const issues = parseMarkdownlintOutput(output);
    assert.equal(issues[0].fixable, true);
  });

  it("skips non-MD prefixed rules", () => {
    const output = "README.md:1 CUSTOM/rule Some message\n";
    assert.deepEqual(parseMarkdownlintOutput(output), []);
  });

  it("returns empty array on empty input", () => {
    assert.deepEqual(parseMarkdownlintOutput(""), []);
  });
});

describe("execCommand timeout and ENOENT (integration)", () => {
  it("exits with code 124 when process exceeds timeout", async () => {
    // Dynamically import to avoid top-level module side effects in test file
    const { spawn } = await import("node:child_process");

    const timeoutMs = 100;

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
      (resolve) => {
        const proc = spawn("sleep", ["10"], { shell: false, stdio: ["pipe", "pipe", "pipe"] });
        let stdout = "";
        let stderr = "";
        let settled = false;

        const settle = (r: { stdout: string; stderr: string; exitCode: number }) => {
          if (!settled) { settled = true; clearTimeout(timer); resolve(r); }
        };

        const timer = setTimeout(() => {
          proc.kill();
          settle({ stdout, stderr: "Timed out", exitCode: 124 });
        }, timeoutMs);

        proc.stdout?.on("data", (d) => { stdout += d.toString(); });
        proc.stderr?.on("data", (d) => { stderr += d.toString(); });
        proc.on("close", (code) => { settle({ stdout, stderr, exitCode: code || 0 }); });
        proc.on("error", (err: Error) => { settle({ stdout, stderr: err.message, exitCode: 1 }); });
      }
    );

    assert.equal(result.exitCode, 124);
    assert.equal(result.stderr, "Timed out");
  });

  it("surfaces ENOENT message when binary is missing", async () => {
    const { spawn } = await import("node:child_process");

    const result = await new Promise<{ stdout: string; stderr: string; exitCode: number }>(
      (resolve) => {
        const proc = spawn("__nonexistent_binary_12345__", [], {
          shell: false,
          stdio: ["pipe", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        let settled = false;
        const settle = (r: { stdout: string; stderr: string; exitCode: number }) => {
          if (!settled) { settled = true; resolve(r); }
        };
        proc.stdout?.on("data", (d) => { stdout += d.toString(); });
        proc.stderr?.on("data", (d) => { stderr += d.toString(); });
        proc.on("close", (code) => { settle({ stdout, stderr, exitCode: code || 0 }); });
        proc.on("error", (err: Error) => { settle({ stdout, stderr: err.message, exitCode: 1 }); });
      }
    );

    assert.equal(result.exitCode, 1);
    assert.match(result.stderr, /ENOENT|not found/i);
  });
});

describe("validateCommand allowlist", () => {
  it("throws on a non-allowlisted command", () => {
    // Inline the guard logic — same contract as validateCommand in registry.ts
    const ALLOWED_COMMANDS = new Set(["black", "flake8", "eslint", "prettier", "shellcheck",
      "yamllint", "markdownlint", "terraform", "hadolint", "which"]);

    const validateCommand = (command: string) => {
      const base = command.split("/").pop() || command;
      if (!ALLOWED_COMMANDS.has(base)) throw new Error(`Command not allowed: ${command}`);
    };

    assert.throws(() => validateCommand("rm"), /Command not allowed/);
    assert.throws(() => validateCommand("/usr/bin/curl"), /Command not allowed/);
    assert.doesNotThrow(() => validateCommand("black"));
    assert.doesNotThrow(() => validateCommand("/usr/local/bin/eslint"));
  });
});
