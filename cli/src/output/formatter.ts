/**
 * @module output/formatter
 * @description Output formatters for lint results
 * @version 1.0.0
 * @author Tyler Dukes
 */

import chalk from "chalk";
import { relative } from "path";
import type { LintOutput, LintResult, OutputFormat, LinterInfo } from "../types.js";
import { VERSION } from "../version.js";

/**
 * Format lint output based on specified format
 */
export function formatOutput(
  output: LintOutput,
  format: OutputFormat,
  options: { quiet?: boolean; noColor?: boolean } = {}
): string {
  const prevLevel = chalk.level;
  if (options.noColor) chalk.level = 0;
  try {
    switch (format) {
      case "json":
        return formatJson(output);
      case "sarif":
        return formatSarif(output);
      case "text":
      default:
        return formatText(output, options);
    }
  } finally {
    chalk.level = prevLevel;
  }
}

/**
 * Format output as human-readable text
 */
function formatText(output: LintOutput, options: { quiet?: boolean }): string {
  const lines: string[] = [];
  const cwd = process.cwd();

  // Group results by file
  for (const result of output.results) {
    const issues = options.quiet
      ? result.issues.filter((i) => i.severity === "error")
      : result.issues;

    if (issues.length === 0) continue;

    const relativePath = relative(cwd, result.file);
    lines.push("");
    lines.push(chalk.underline(relativePath));

    for (const issue of issues) {
      const location = chalk.dim(`${issue.line}:${issue.column}`);
      const severity =
        issue.severity === "error"
          ? chalk.red("error")
          : issue.severity === "warning"
            ? chalk.yellow("warning")
            : chalk.blue("info");
      const rule = chalk.dim(`(${issue.rule})`);
      const fixable = issue.fixable ? chalk.green(" [fixable]") : "";

      lines.push(`  ${location}  ${severity}  ${issue.message} ${rule}${fixable}`);
    }
  }

  // Summary
  lines.push("");
  lines.push(formatSummary(output.summary));

  return lines.join("\n");
}

/**
 * Format summary line
 */
function formatSummary(summary: {
  files: number;
  errors: number;
  warnings: number;
  fixable: number;
  fixed?: number;
  duration: number;
}): string {
  const parts: string[] = [];

  const errorText =
    summary.errors > 0
      ? chalk.red(`${summary.errors} error${summary.errors !== 1 ? "s" : ""}`)
      : chalk.dim("0 errors");

  const warningText =
    summary.warnings > 0
      ? chalk.yellow(
          `${summary.warnings} warning${summary.warnings !== 1 ? "s" : ""}`
        )
      : chalk.dim("0 warnings");

  parts.push(`${summary.files} file${summary.files !== 1 ? "s" : ""} checked`);
  parts.push(errorText);
  parts.push(warningText);

  if (summary.fixable > 0) {
    parts.push(
      chalk.green(
        `${summary.fixable} fixable with --fix`
      )
    );
  }

  if (summary.fixed !== undefined && summary.fixed > 0) {
    parts.push(chalk.green(`${summary.fixed} fixed`));
  }

  parts.push(chalk.dim(`(${summary.duration}ms)`));

  // Overall status
  const status =
    summary.errors > 0
      ? chalk.red.bold("✖")
      : summary.warnings > 0
        ? chalk.yellow.bold("⚠")
        : chalk.green.bold("✔");

  return `${status} ${parts.join(", ")}`;
}

/**
 * Format output as JSON
 */
function formatJson(output: LintOutput): string {
  return JSON.stringify(output, null, 2);
}

/**
 * Format output as SARIF (Static Analysis Results Interchange Format)
 */
function formatSarif(output: LintOutput): string {
  const sarif = {
    $schema:
      "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
    version: "2.1.0",
    runs: [
      {
        tool: {
          driver: {
            name: "devops-style",
            version: VERSION,
            informationUri: "https://tydukes.github.io/coding-style-guide/",
            rules: extractRules(output.results),
          },
        },
        results: output.results.flatMap((result) =>
          result.issues.map((issue) => ({
            ruleId: issue.rule,
            level:
              issue.severity === "error"
                ? "error"
                : issue.severity === "warning"
                  ? "warning"
                  : "note",
            message: {
              text: issue.message,
            },
            locations: [
              {
                physicalLocation: {
                  artifactLocation: {
                    uri: result.file,
                  },
                  region: {
                    startLine: issue.line,
                    startColumn: issue.column,
                    endLine: issue.endLine || issue.line,
                    endColumn: issue.endColumn || issue.column,
                  },
                },
              },
            ],
            properties: {
              fixable: issue.fixable,
            },
          }))
        ),
      },
    ],
  };

  return JSON.stringify(sarif, null, 2);
}

/**
 * Extract unique rules from results
 */
function extractRules(
  results: LintResult[]
): Array<{ id: string; shortDescription: { text: string } }> {
  const rules = new Map<string, string>();

  for (const result of results) {
    for (const issue of result.issues) {
      if (!rules.has(issue.rule)) {
        rules.set(issue.rule, issue.message);
      }
    }
  }

  return Array.from(rules.entries()).map(([id, desc]) => ({
    id,
    shortDescription: { text: desc },
  }));
}

/**
 * Group linters by language
 */
function groupByLanguage(
  linters: Map<string, LinterInfo>
): Map<string, Array<[string, LinterInfo]>> {
  const byLanguage = new Map<string, Array<[string, LinterInfo]>>();
  for (const [name, info] of linters) {
    const existing = byLanguage.get(info.language) || [];
    existing.push([name, info]);
    byLanguage.set(info.language, existing);
  }
  return byLanguage;
}

/**
 * Format a single linter entry as two display lines
 */
function formatLinterEntry(name: string, info: LinterInfo): string[] {
  const status = info.installed ? chalk.green("✔") : chalk.red("✖");
  const version = info.version ? chalk.dim(` (${info.version})`) : "";
  const canFix = info.canFix ? chalk.blue(" [can fix]") : "";
  const pluginBadge = info.command === "plugin" ? chalk.magenta(" [plugin]") : "";
  return [
    `    ${status} ${name}${version}${canFix}${pluginBadge}`,
    chalk.dim(`      ${info.description}`),
  ];
}

/**
 * Format linter list for display
 */
export function formatLinterList(
  linters: Map<string, LinterInfo>,
  format: OutputFormat,
  options: { noColor?: boolean } = {}
): string {
  const prevLevel = chalk.level;
  if (options.noColor) chalk.level = 0;
  try {
    if (format === "json") {
      return JSON.stringify(Object.fromEntries(linters.entries()), null, 2);
    }

    const lines: string[] = ["", chalk.bold("Available Linters:"), ""];

    for (const [language, entries] of groupByLanguage(linters)) {
      lines.push(chalk.cyan.bold(`  ${language.toUpperCase()}`));
      for (const [name, info] of entries) {
        lines.push(...formatLinterEntry(name, info));
      }
      lines.push("");
    }

    return lines.join("\n");
  } finally {
    chalk.level = prevLevel;
  }
}

/**
 * Format initialization success message
 */
export function formatInitSuccess(configPath: string, template: string, options: { noColor?: boolean } = {}): string {
  const prevLevel = chalk.level;
  if (options.noColor) chalk.level = 0;
  const lines: string[] = [];

  lines.push("");
  try {
    lines.push(chalk.green.bold("✔ Configuration initialized successfully!"));
    lines.push("");
    lines.push(`  Template: ${chalk.cyan(template)}`);
    lines.push(`  Config:   ${chalk.cyan(configPath)}`);
    lines.push("");
    lines.push(chalk.dim("Next steps:"));
    lines.push(chalk.dim("  1. Review and customize the configuration"));
    lines.push(chalk.dim("  2. Run 'devops-style check' to validate your code"));
    lines.push(chalk.dim("  3. Run 'devops-style fix' to auto-fix issues"));
    lines.push("");

    return lines.join("\n");
  } finally {
    chalk.level = prevLevel;
  }
}
