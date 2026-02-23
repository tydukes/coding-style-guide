/**
 * @module linters/registry
 * @description Registry of available linters and their configurations
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { spawn } from "child_process";
import type { LinterInfo, Language, LintResult, LintIssue, LinterConfig } from "../types.js";

export interface LinterRunner {
  info: LinterInfo;
  check: (files: string[], config: LinterConfig) => Promise<LintResult[]>;
  fix?: (files: string[], config: LinterConfig) => Promise<LintResult[]>;
}

/**
 * Allowlist of known safe linter commands.
 * Only commands in this list can be executed.
 */
const ALLOWED_COMMANDS = new Set([
  "black",
  "flake8",
  "eslint",
  "prettier",
  "shellcheck",
  "yamllint",
  "markdownlint",
  "terraform",
  "hadolint",
  "which",
]);

/**
 * Validate that a command is in the allowlist
 */
function validateCommand(command: string): void {
  // Extract base command (handle paths like /usr/bin/black)
  const baseCommand = command.split("/").pop() || command;
  if (!ALLOWED_COMMANDS.has(baseCommand)) {
    throw new Error(`Command not allowed: ${command}. Only allowlisted linter commands can be executed.`);
  }
}

/**
 * Execute a command and return stdout/stderr.
 * Security: Only allowlisted commands can be executed, and shell is disabled
 * to prevent command injection.
 */
async function execCommand(
  command: string,
  args: string[],
  options?: { cwd?: string; timeoutMs?: number }
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  // Validate command against allowlist
  validateCommand(command);

  const timeoutMs = options?.timeoutMs ?? 30_000;

  return new Promise((resolve) => {
    const controller = new AbortController();

    // Security: shell: false prevents command injection via arguments
    const proc = spawn(command, args, {
      cwd: options?.cwd || process.cwd(),
      shell: false,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const settle = (result: { stdout: string; stderr: string; exitCode: number }) => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve(result);
      }
    };

    const timer = setTimeout(() => {
      controller.abort();
      proc.kill();
      settle({ stdout, stderr: "Timed out", exitCode: 124 });
    }, timeoutMs);

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      settle({ stdout, stderr, exitCode: code || 0 });
    });

    proc.on("error", (err: Error) => {
      settle({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

/**
 * Check if a command is available
 */
async function commandExists(command: string): Promise<boolean> {
  try {
    const result = await execCommand("which", [command]);
    return result.exitCode === 0;
  } catch {
    return false;
  }
}

/**
 * Get version of a command.
 * Extracts semantic version (X.Y.Z) from command output.
 */
async function getVersion(
  command: string,
  versionFlag = "--version"
): Promise<string | undefined> {
  try {
    const result = await execCommand(command, [versionFlag]);
    const output = result.stdout || result.stderr;
    // Safe regex: only matches digits and dots, no backtracking risk
    const match = output.match(/\b(\d{1,4})\.(\d{1,4})\.(\d{1,4})\b/);
    return match ? `${match[1]}.${match[2]}.${match[3]}` : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Parse "file:line:col:" prefix from a line.
 * Returns parsed values or null if format doesn't match.
 */
function parseFileLineCol(line: string): { lineNum: number; col: number; rest: string } | null {
  const firstColon = line.indexOf(":");
  if (firstColon === -1) return null;

  const afterFile = line.slice(firstColon + 1);
  const secondColon = afterFile.indexOf(":");
  if (secondColon === -1) return null;

  const lineNum = parseInt(afterFile.slice(0, secondColon), 10);
  if (isNaN(lineNum)) return null;

  const afterLine = afterFile.slice(secondColon + 1);
  const thirdColon = afterLine.indexOf(":");
  if (thirdColon === -1) return null;

  const col = parseInt(afterLine.slice(0, thirdColon), 10);
  if (isNaN(col)) return null;

  const rest = afterLine.slice(thirdColon + 1).trim();
  return { lineNum, col, rest };
}

/**
 * Create a standard "fixed" result for a list of files.
 */
function createFixedResults(files: string[], language: Language): LintResult[] {
  return files.map((file) => ({
    file,
    language,
    issues: [],
    fixable: 0,
    fixed: 1,
  }));
}

/**
 * Create a "would be reformatted" issue.
 */
function createReformatIssue(rule: string): LintIssue {
  return {
    line: 1,
    column: 1,
    message: "File would be reformatted",
    rule,
    severity: "warning" as const,
    fixable: true,
  };
}

/**
 * Parse flake8 output into lint issues with their source file.
 * Format: file:line:col: code message
 */
function parseFlake8Output(output: string): Array<{ file: string } & LintIssue> {
  const issues: Array<{ file: string } & LintIssue> = [];
  const lines = output.split("\n").filter(Boolean);

  for (const line of lines) {
    // Extract the file path (everything before the first colon)
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

/**
 * Parse ESLint JSON output
 */
function parseESLintOutput(output: string): LintResult[] {
  try {
    const results = JSON.parse(output);
    return results.map(
      (result: {
        filePath: string;
        messages: Array<{
          line: number;
          column: number;
          endLine?: number;
          endColumn?: number;
          message: string;
          ruleId: string;
          severity: number;
          fix?: unknown;
        }>;
      }) => ({
        file: result.filePath,
        language: "typescript" as Language,
        issues: result.messages.map(
          (msg: {
            line: number;
            column: number;
            endLine?: number;
            endColumn?: number;
            message: string;
            ruleId: string;
            severity: number;
            fix?: unknown;
          }) => ({
            line: msg.line,
            column: msg.column,
            endLine: msg.endLine,
            endColumn: msg.endColumn,
            message: msg.message,
            rule: msg.ruleId || "unknown",
            severity: msg.severity === 2 ? "error" : "warning",
            fixable: !!msg.fix,
          })
        ),
        fixable: result.messages.filter(
          (m: { fix?: unknown }) => m.fix
        ).length,
      })
    );
  } catch {
    return [];
  }
}

/**
 * Parse shellcheck JSON output
 */
function parseShellcheckOutput(output: string): LintIssue[] {
  try {
    const results = JSON.parse(output);
    return results.map(
      (issue: {
        line: number;
        column: number;
        endLine?: number;
        endColumn?: number;
        message: string;
        code: number;
        level: string;
        fix?: { replacements: unknown[] };
      }) => ({
        line: issue.line,
        column: issue.column,
        endLine: issue.endLine,
        endColumn: issue.endColumn,
        message: issue.message,
        rule: `SC${issue.code}`,
        severity:
          issue.level === "error"
            ? "error"
            : issue.level === "warning"
              ? "warning"
              : "info",
        fixable: !!issue.fix?.replacements?.length,
      })
    );
  } catch {
    return [];
  }
}

/**
 * Parse yamllint output.
 * Format: file:line:col: [level] message (rule)
 */
function parseYamllintOutput(output: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = output.split("\n").filter(Boolean);

  for (const line of lines) {
    const parsed = parseFileLineCol(line);
    if (!parsed) continue;

    const { lineNum, col, rest } = parsed;

    // Extract [level]
    const levelStart = rest.indexOf("[");
    const levelEnd = rest.indexOf("]");
    if (levelStart === -1 || levelEnd === -1 || levelEnd <= levelStart) continue;

    const level = rest.slice(levelStart + 1, levelEnd);

    // Extract message and (rule)
    const afterLevel = rest.slice(levelEnd + 1).trim();
    const ruleStart = afterLevel.lastIndexOf("(");
    const ruleEnd = afterLevel.lastIndexOf(")");

    if (ruleStart === -1 || ruleEnd === -1 || ruleEnd <= ruleStart) continue;

    const message = afterLevel.slice(0, ruleStart).trim();
    const rule = afterLevel.slice(ruleStart + 1, ruleEnd).trim();

    if (level && message && rule) {
      issues.push({
        line: lineNum,
        column: col,
        message,
        rule,
        severity: level === "error" ? "error" : "warning",
        fixable: false,
      });
    }
  }

  return issues;
}

/**
 * Parse markdownlint output.
 * Format: file:line rule/alias message
 */
function parseMarkdownlintOutput(output: string): LintIssue[] {
  const issues: LintIssue[] = [];
  const lines = output.split("\n").filter(Boolean);

  for (const line of lines) {
    // Parse without complex regex to avoid ReDoS
    // Format: "path:line MDxxx/alias message"
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;

    const afterFile = line.slice(colonIdx + 1);

    // Find where line number ends (first space after colon)
    const spaceIdx = afterFile.indexOf(" ");
    if (spaceIdx === -1) continue;

    const lineNum = parseInt(afterFile.slice(0, spaceIdx), 10);
    if (isNaN(lineNum)) continue;

    const rest = afterFile.slice(spaceIdx + 1).trim();

    // Find the rule (MDxxx format)
    const slashIdx = rest.indexOf("/");
    if (slashIdx === -1) continue;

    const rule = rest.slice(0, slashIdx);
    if (!rule.startsWith("MD")) continue;

    // Find end of alias (next space)
    const afterSlash = rest.slice(slashIdx + 1);
    const aliasEndIdx = afterSlash.indexOf(" ");
    if (aliasEndIdx === -1) continue;

    const message = afterSlash.slice(aliasEndIdx + 1).trim();

    if (rule && message) {
      issues.push({
        line: lineNum,
        column: 1,
        message,
        rule,
        severity: "warning",
        fixable: rule === "MD009" || rule === "MD010" || rule === "MD047",
      });
    }
  }

  return issues;
}

// Linter implementations
const linters: Map<string, LinterRunner> = new Map();

/**
 * Register Python/Black linter
 */
linters.set("black", {
  info: {
    name: "black",
    language: "python",
    description: "The uncompromising Python code formatter",
    installed: false,
    command: "black",
    configFiles: ["pyproject.toml", ".black"],
    canFix: true,
  },
  async check(files, config) {
    const args = ["--check", "--diff", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "black", args);
    const needsFormat = result.exitCode !== 0;

    return files.map((file) => ({
      file,
      language: "python" as Language,
      issues: needsFormat ? [createReformatIssue("black/format")] : [],
      fixable: needsFormat ? 1 : 0,
    }));
  },
  async fix(files, config) {
    const args = [...files];
    if (config.configFile) args.push("--config", config.configFile);

    await execCommand(config.command || "black", args);
    return createFixedResults(files, "python");
  },
});

/**
 * Register Python/Flake8 linter
 */
linters.set("flake8", {
  info: {
    name: "flake8",
    language: "python",
    description: "Python code linter (pep8, pyflakes, mccabe)",
    installed: false,
    command: "flake8",
    configFiles: [".flake8", "setup.cfg", "tox.ini"],
    canFix: false,
  },
  async check(files, config) {
    const args = [...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "flake8", args);

    // Parse all issues once and group by source file
    const allIssues = parseFlake8Output(result.stdout);
    const byFile = new Map<string, LintIssue[]>();
    for (const { file, ...issue } of allIssues) {
      const list = byFile.get(file) ?? [];
      list.push(issue);
      byFile.set(file, list);
    }

    return files.map((file) => ({
      file,
      language: "python" as Language,
      issues: byFile.get(file) ?? [],
      fixable: 0,
    }));
  },
});

/**
 * Register ESLint
 */
linters.set("eslint", {
  info: {
    name: "eslint",
    language: "typescript",
    description: "Pluggable JavaScript/TypeScript linter",
    installed: false,
    command: "eslint",
    configFiles: [".eslintrc.js", ".eslintrc.json", ".eslintrc.yml", "eslint.config.js"],
    canFix: true,
  },
  async check(files, config) {
    const args = ["--format", "json", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "eslint", args);
    return parseESLintOutput(result.stdout);
  },
  async fix(files, config) {
    const args = ["--fix", "--format", "json", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "eslint", args);
    return parseESLintOutput(result.stdout);
  },
});

/**
 * Register Prettier
 */
linters.set("prettier", {
  info: {
    name: "prettier",
    language: "typescript",
    description: "Opinionated code formatter",
    installed: false,
    command: "prettier",
    configFiles: [".prettierrc", ".prettierrc.json", "prettier.config.js"],
    canFix: true,
  },
  async check(files, config) {
    const args = ["--check", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "prettier", args);

    // prettier --check writes all output to stderr; exit code non-zero means
    // at least one file needs formatting. We can't get per-file breakdown from
    // prettier's stderr reliably, so mark all files in the batch as needing
    // format when the exit code is non-zero (same pattern as black).
    const needsFormat = result.exitCode !== 0;

    return files.map((file) => ({
      file,
      language: "typescript" as Language,
      issues: needsFormat ? [createReformatIssue("prettier/format")] : [],
      fixable: needsFormat ? 1 : 0,
    }));
  },
  async fix(files, config) {
    const args = ["--write", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    await execCommand(config.command || "prettier", args);
    return createFixedResults(files, "typescript");
  },
});

/**
 * Register Shellcheck
 */
linters.set("shellcheck", {
  info: {
    name: "shellcheck",
    language: "bash",
    description: "Shell script static analysis tool",
    installed: false,
    command: "shellcheck",
    configFiles: [".shellcheckrc"],
    canFix: false,
  },
  async check(files, config) {
    const args = ["--format", "json", ...files];

    const result = await execCommand(config.command || "shellcheck", args);
    const issues = parseShellcheckOutput(result.stdout);

    return files.map((file) => ({
      file,
      language: "bash" as Language,
      issues,
      fixable: issues.filter((i) => i.fixable).length,
    }));
  },
});

/**
 * Register yamllint
 */
linters.set("yamllint", {
  info: {
    name: "yamllint",
    language: "yaml",
    description: "YAML linter",
    installed: false,
    command: "yamllint",
    configFiles: [".yamllint", ".yamllint.yaml", ".yamllint.yml"],
    canFix: false,
  },
  async check(files, config) {
    const args = ["-f", "parsable", ...files];
    if (config.configFile) args.push("-c", config.configFile);

    const result = await execCommand(config.command || "yamllint", args);
    const issues = parseYamllintOutput(result.stdout + result.stderr);

    return files.map((file) => ({
      file,
      language: "yaml" as Language,
      issues,
      fixable: 0,
    }));
  },
});

/**
 * Register markdownlint
 */
linters.set("markdownlint", {
  info: {
    name: "markdownlint",
    language: "markdown",
    description: "Markdown linter",
    installed: false,
    command: "markdownlint",
    configFiles: [".markdownlint.json", ".markdownlint.yaml", ".markdownlint.yml"],
    canFix: true,
  },
  async check(files, config) {
    const args = [...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "markdownlint", args);
    const issues = parseMarkdownlintOutput(result.stdout + result.stderr);

    return files.map((file) => ({
      file,
      language: "markdown" as Language,
      issues,
      fixable: issues.filter((i) => i.fixable).length,
    }));
  },
  async fix(files, config) {
    const args = ["--fix", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    await execCommand(config.command || "markdownlint", args);
    return createFixedResults(files, "markdown");
  },
});

/**
 * Register terraform fmt
 */
linters.set("terraform-fmt", {
  info: {
    name: "terraform-fmt",
    language: "terraform",
    description: "Terraform formatter",
    installed: false,
    command: "terraform",
    configFiles: [],
    canFix: true,
  },
  async check(files, config) {
    const results: LintResult[] = [];

    for (const file of files) {
      const args = ["fmt", "-check", "-diff", file];
      const result = await execCommand(config.command || "terraform", args);
      const needsFormat = result.exitCode !== 0;

      results.push({
        file,
        language: "terraform" as Language,
        issues: needsFormat ? [createReformatIssue("terraform/fmt")] : [],
        fixable: needsFormat ? 1 : 0,
      });
    }

    return results;
  },
  async fix(files, config) {
    for (const file of files) {
      await execCommand(config.command || "terraform", ["fmt", file]);
    }
    return createFixedResults(files, "terraform");
  },
});

/**
 * Register hadolint (Dockerfile linter)
 */
linters.set("hadolint", {
  info: {
    name: "hadolint",
    language: "dockerfile",
    description: "Dockerfile linter",
    installed: false,
    command: "hadolint",
    configFiles: [".hadolint.yaml", ".hadolint.yml"],
    canFix: false,
  },
  async check(files, config) {
    const args = ["--format", "json", ...files];
    if (config.configFile) args.push("--config", config.configFile);

    const result = await execCommand(config.command || "hadolint", args);

    try {
      const parsed = JSON.parse(result.stdout);
      return files.map((file) => ({
        file,
        language: "dockerfile" as Language,
        issues: parsed
          .filter((i: { file: string }) => i.file === file)
          .map(
            (i: {
              line: number;
              column: number;
              message: string;
              code: string;
              level: string;
            }) => ({
              line: i.line,
              column: i.column || 1,
              message: i.message,
              rule: i.code,
              severity:
                i.level === "error"
                  ? "error"
                  : i.level === "warning"
                    ? "warning"
                    : "info",
              fixable: false,
            })
          ),
        fixable: 0,
      }));
    } catch {
      return files.map((file) => ({
        file,
        language: "dockerfile" as Language,
        issues: [],
        fixable: 0,
      }));
    }
  },
});

/**
 * Get all registered linters
 */
export function getAllLinters(): Map<string, LinterRunner> {
  return linters;
}

/**
 * Get linter by name
 */
export function getLinter(name: string): LinterRunner | undefined {
  return linters.get(name);
}

/**
 * Get linters for a specific language
 */
export function getLintersByLanguage(language: Language): LinterRunner[] {
  return Array.from(linters.values()).filter(
    (linter) => linter.info.language === language
  );
}

/**
 * Check availability of all linters
 */
export async function checkLinterAvailability(): Promise<Map<string, LinterInfo>> {
  const results = new Map<string, LinterInfo>();

  for (const [name, runner] of linters) {
    const installed = await commandExists(runner.info.command);
    const version = installed
      ? await getVersion(runner.info.command)
      : undefined;

    results.set(name, {
      ...runner.info,
      installed,
      version,
    });
  }

  return results;
}

/**
 * Register a custom linter (for plugins)
 */
export function registerLinter(name: string, runner: LinterRunner): void {
  linters.set(name, runner);
}
