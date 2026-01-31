/**
 * @module commands/check
 * @description Check command implementation
 * @version 1.0.0
 * @author Tyler Dukes
 */

import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../config/loader.js";
import { findFiles, runLinters } from "../linters/orchestrator.js";
import { formatOutput } from "../output/formatter.js";
import type { CheckOptions } from "../types.js";

/**
 * Check command - validates files against style guide
 */
export async function checkCommand(
  files: string[],
  options: CheckOptions
): Promise<void> {
  const spinner = ora("Loading configuration...").start();

  try {
    // Load configuration
    const parentOpts = options as unknown as { parent?: { config?: string } };
    const config = await loadConfig(parentOpts.parent?.config);
    spinner.text = "Finding files...";

    // Find files to check
    const filesToCheck = await findFiles(files, config);

    if (filesToCheck.length === 0) {
      spinner.warn("No files found to check");
      return;
    }

    spinner.text = `Checking ${filesToCheck.length} files...`;

    // Run linters
    const output = await runLinters(filesToCheck, config, {
      fix: options.fix,
      language: options.language,
    });

    spinner.stop();

    // Format and output results
    const formatted = formatOutput(output, options.format, {
      quiet: options.quiet,
    });
    console.log(formatted);

    // Exit with error code if issues found
    if (output.summary.errors > 0) {
      process.exit(1);
    }

    if (options.strict && output.summary.warnings > 0) {
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(
      `Check failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}
