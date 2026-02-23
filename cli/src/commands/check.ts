/**
 * @module commands/check
 * @description Check command implementation
 * @version 1.0.0
 * @author Tyler Dukes
 */

import ora from "ora";
import { loadConfig } from "../config/loader.js";
import { findFiles, runLinters } from "../linters/orchestrator.js";
import { formatOutput } from "../output/formatter.js";
import { loadPlugins } from "../plugins/loader.js";
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
    const parentOpts = options as unknown as { parent?: { config?: string; color?: boolean } };
    const noColor = parentOpts.parent?.color === false;
    const config = await loadConfig(parentOpts.parent?.config);
    spinner.text = "Finding files...";

    // Load plugins if configured
    if (config.plugins?.length) {
      await loadPlugins(config.plugins);
    }

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
      cache: options.cache,
      cacheDir: config.cacheLocation,
    });

    spinner.stop();

    // Format and output results
    const formatted = formatOutput(output, options.format, {
      quiet: options.quiet,
      noColor,
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
