/**
 * @module config/validate
 * @description Config schema validation — returns warnings, never throws
 * @version 1.0.0
 * @author Tyler Dukes
 */

import type { StyleGuideConfig, Language } from "../types.js";

const VALID_LANGUAGES = new Set<string>([
  "python",
  "typescript",
  "javascript",
  "bash",
  "powershell",
  "terraform",
  "hcl",
  "yaml",
  "json",
  "markdown",
  "dockerfile",
  "sql",
  "ansible",
  "kubernetes",
  "makefile",
  "groovy",
]);

/**
 * Validate a loaded config and return an array of warning strings.
 * Never throws — unknown linter names are allowed (plugins may register them later).
 */
export function validateConfig(config: StyleGuideConfig): string[] {
  const warnings: string[] = [];

  // Validate language keys
  for (const lang of Object.keys(config.languages)) {
    if (!VALID_LANGUAGES.has(lang)) {
      warnings.push(`Unknown language in config: '${lang}'. Valid languages are: ${[...VALID_LANGUAGES].join(", ")}.`);
    }
  }

  // Validate each language config
  for (const [lang, langConfig] of Object.entries(config.languages)) {
    if (!langConfig) continue;

    // Validate linter entries are strings (keys), not objects as values
    for (const [linterName, linterConfig] of Object.entries(langConfig.linters)) {
      if (typeof linterName !== "string" || linterName.trim() === "") {
        warnings.push(`Invalid linter name in language '${lang}': must be a non-empty string.`);
      }
      if (linterConfig === null || typeof linterConfig !== "object") {
        warnings.push(`Invalid linter config for '${linterName}' in language '${lang}': expected an object.`);
      }
    }
  }

  // Validate ignore
  if (config.ignore !== undefined) {
    if (!Array.isArray(config.ignore)) {
      warnings.push(`'ignore' must be an array of strings.`);
    } else {
      for (const entry of config.ignore) {
        if (typeof entry !== "string") {
          warnings.push(`Each entry in 'ignore' must be a string; found: ${JSON.stringify(entry)}.`);
        }
      }
    }
  }

  // Validate cache
  if (config.cache !== undefined && typeof config.cache !== "boolean") {
    warnings.push(`'cache' must be a boolean; found: ${JSON.stringify(config.cache)}.`);
  }

  // Validate plugins
  if (config.plugins !== undefined) {
    if (!Array.isArray(config.plugins)) {
      warnings.push(`'plugins' must be an array.`);
    }
  }

  return warnings;
}
