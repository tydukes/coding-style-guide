/**
 * @module commands/fix
 * @description Fix command implementation
 * @version 1.0.0
 * @author Tyler Dukes
 */

import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../config/loader.js";
import { findFiles, runLinters } from "../linters/orchestrator.js";
import { formatOutput } from "../output/formatter.js";
import type { FixOptions } from "../types.js";

/**
 * Fix command - auto-fixes style violations
 */
export async function fixCommand(
  files: string[],
  options: FixOptions
): Promise<void> {
  const spinner = ora("Loading configuration...").start();

  try {
    // Load configuration
    const parentOpts = options as unknown as { parent?: { config?: string } };
    const config = await loadConfig(parentOpts.parent?.config);
    spinner.text = "Finding files...";

    // Find files to fix
    const filesToFix = await findFiles(files, config);

    if (filesToFix.length === 0) {
      spinner.warn("No files found to fix");
      return;
    }

    if (options.dryRun) {
      spinner.text = `Checking ${filesToFix.length} files (dry run)...`;

      // Run in check mode to show what would be fixed
      const output = await runLinters(filesToFix, config, {
        fix: false,
        language: options.language,
      });

      spinner.stop();

      console.log(chalk.yellow("\n[Dry Run] The following issues would be fixed:\n"));

      const formatted = formatOutput(output, options.format);
      console.log(formatted);

      // Count fixable issues
      const fixableCount = output.results.reduce(
        (sum, r) => sum + r.fixable,
        0
      );

      if (fixableCount > 0) {
        console.log(
          chalk.yellow(
            `\nRun without --dry-run to fix ${fixableCount} issue${fixableCount !== 1 ? "s" : ""}`
          )
        );
      }
    } else {
      spinner.text = `Fixing ${filesToFix.length} files...`;

      // Run with fix enabled
      const output = await runLinters(filesToFix, config, {
        fix: true,
        language: options.language,
      });

      spinner.stop();

      const formatted = formatOutput(output, options.format);
      console.log(formatted);

      // Summary of fixed issues
      const fixedCount = output.summary.fixed || 0;
      if (fixedCount > 0) {
        console.log(
          chalk.green(
            `\n✔ Fixed ${fixedCount} issue${fixedCount !== 1 ? "s" : ""}`
          )
        );
      }

      // Check if there are remaining issues
      if (output.summary.errors > 0 || output.summary.warnings > 0) {
        console.log(
          chalk.yellow(
            "\nSome issues could not be auto-fixed and require manual attention."
          )
        );
        process.exit(1);
      }
    }
  } catch (error) {
    spinner.fail(
      `Fix failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}
