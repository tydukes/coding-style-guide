/**
 * @module linters/orchestrator
 * @description Orchestrates multiple linters for file checking
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { glob } from "glob";
import { extname, basename, resolve } from "path";
import type {
  StyleGuideConfig,
  Language,
  LintResult,
  LintOutput,
  LintSummary,
} from "../types.js";
import { getAllLinters, getLinter } from "./registry.js";

/**
 * Map file extension to language
 */
function getLanguageForFile(
  file: string,
  config: StyleGuideConfig
): Language | null {
  const ext = extname(file).toLowerCase();
  const name = basename(file).toLowerCase();

  // Check special filenames first
  if (name === "dockerfile" || name.startsWith("dockerfile.")) {
    return "dockerfile";
  }
  if (name === "makefile" || name === "gnumakefile") {
    return "makefile";
  }

  // Check by extension
  for (const [lang, langConfig] of Object.entries(config.languages)) {
    if (langConfig?.enabled && langConfig.extensions) {
      for (const langExt of langConfig.extensions) {
        if (langExt.toLowerCase() === ext || langExt.toLowerCase() === name) {
          return lang as Language;
        }
      }
    }
  }

  return null;
}

/**
 * Group files by language
 */
function groupFilesByLanguage(
  files: string[],
  config: StyleGuideConfig
): Map<Language, string[]> {
  const grouped = new Map<Language, string[]>();

  for (const file of files) {
    const lang = getLanguageForFile(file, config);
    if (lang) {
      const existing = grouped.get(lang) || [];
      existing.push(file);
      grouped.set(lang, existing);
    }
  }

  return grouped;
}

/**
 * Expand glob patterns and find files to lint
 */
export async function findFiles(
  patterns: string[],
  config: StyleGuideConfig
): Promise<string[]> {
  if (patterns.length === 0) {
    // No patterns provided, find all files based on language extensions
    const extensions: string[] = [];
    for (const langConfig of Object.values(config.languages)) {
      if (langConfig?.enabled && langConfig.extensions) {
        extensions.push(...langConfig.extensions);
      }
    }

    const uniqueExts = [...new Set(extensions)].filter((e) => e.startsWith("."));
    patterns = uniqueExts.map((ext) => `**/*${ext}`);
  }

  const allFiles: Set<string> = new Set();

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      ignore: config.ignore || [],
      nodir: true,
      absolute: true,
    });
    matches.forEach((f) => allFiles.add(f));
  }

  return Array.from(allFiles).map((f) => resolve(f));
}

/**
 * Run all applicable linters on the given files
 */
export async function runLinters(
  files: string[],
  config: StyleGuideConfig,
  options: {
    fix?: boolean;
    language?: string;
  } = {}
): Promise<LintOutput> {
  const startTime = Date.now();
  const results: LintResult[] = [];

  // Filter by language if specified
  let filesToCheck = files;
  if (options.language) {
    const lang = options.language as Language;
    filesToCheck = files.filter(
      (f) => getLanguageForFile(f, config) === lang
    );
  }

  // Group files by language
  const grouped = groupFilesByLanguage(filesToCheck, config);

  // Run linters for each language
  for (const [lang, langFiles] of grouped) {
    const langConfig = config.languages[lang];
    if (!langConfig?.enabled) continue;

    for (const [linterName, linterConfig] of Object.entries(langConfig.linters)) {
      if (!linterConfig.enabled) continue;

      const linter = getLinter(linterName);
      if (!linter) continue;

      try {
        let lintResults: LintResult[];

        if (options.fix && linter.fix) {
          lintResults = await linter.fix(langFiles, linterConfig);
        } else {
          lintResults = await linter.check(langFiles, linterConfig);
        }

        results.push(...lintResults);
      } catch (error) {
        // Linter failed, add error result
        results.push(
          ...langFiles.map((file) => ({
            file,
            language: lang,
            issues: [
              {
                line: 0,
                column: 0,
                message: `Linter ${linterName} failed: ${error instanceof Error ? error.message : "Unknown error"}`,
                rule: "internal-error",
                severity: "error" as const,
                fixable: false,
              },
            ],
            fixable: 0,
          }))
        );
      }
    }
  }

  // Deduplicate results by file (keep all issues)
  const fileResults = new Map<string, LintResult>();
  for (const result of results) {
    const existing = fileResults.get(result.file);
    if (existing) {
      existing.issues.push(...result.issues);
      existing.fixable += result.fixable;
      if (result.fixed) {
        existing.fixed = (existing.fixed || 0) + result.fixed;
      }
    } else {
      fileResults.set(result.file, { ...result });
    }
  }

  const finalResults = Array.from(fileResults.values());

  // Calculate summary
  const summary: LintSummary = {
    files: finalResults.length,
    errors: finalResults.reduce(
      (sum, r) => sum + r.issues.filter((i) => i.severity === "error").length,
      0
    ),
    warnings: finalResults.reduce(
      (sum, r) => sum + r.issues.filter((i) => i.severity === "warning").length,
      0
    ),
    fixable: finalResults.reduce((sum, r) => sum + r.fixable, 0),
    fixed: options.fix
      ? finalResults.reduce((sum, r) => sum + (r.fixed || 0), 0)
      : undefined,
    duration: Date.now() - startTime,
  };

  return { results: finalResults, summary };
}

/**
 * Get list of enabled linters for the configuration
 */
export function getEnabledLinters(config: StyleGuideConfig): string[] {
  const enabled: string[] = [];

  for (const [, langConfig] of Object.entries(config.languages)) {
    if (langConfig?.enabled) {
      for (const [linterName, linterConfig] of Object.entries(
        langConfig.linters
      )) {
        if (linterConfig.enabled && !enabled.includes(linterName)) {
          enabled.push(linterName);
        }
      }
    }
  }

  return enabled;
}
