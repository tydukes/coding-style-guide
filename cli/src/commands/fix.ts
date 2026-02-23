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
import { loadPlugins } from "../plugins/loader.js";
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
    const parentOpts = options as unknown as { parent?: { config?: string; color?: boolean } };
    const noColor = parentOpts.parent?.color === false;
    const config = await loadConfig(parentOpts.parent?.config);
    spinner.text = "Finding files...";

    // Load plugins if configured
    if (config.plugins?.length) {
      await loadPlugins(config.plugins);
    }

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

      const noColorChalk = noColor ? chalk.level : undefined;
      if (noColor) chalk.level = 0;
      console.log(chalk.yellow("\n[Dry Run] The following issues would be fixed:\n"));
      if (noColorChalk !== undefined) chalk.level = noColorChalk;

      const formatted = formatOutput(output, options.format, { noColor });
      console.log(formatted);

      // Count fixable issues
      const fixableCount = output.results.reduce(
        (sum, r) => sum + r.fixable,
        0
      );

      if (fixableCount > 0) {
        const prevLevel = chalk.level;
        if (noColor) chalk.level = 0;
        console.log(
          chalk.yellow(
            `\nRun without --dry-run to fix ${fixableCount} issue${fixableCount !== 1 ? "s" : ""}`
          )
        );
        chalk.level = prevLevel;
      }
    } else {
      spinner.text = `Fixing ${filesToFix.length} files...`;

      // Run with fix enabled
      const output = await runLinters(filesToFix, config, {
        fix: true,
        language: options.language,
      });

      spinner.stop();

      const formatted = formatOutput(output, options.format, { noColor });
      console.log(formatted);

      // Summary of fixed issues
      const prevLevel = chalk.level;
      if (noColor) chalk.level = 0;
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
        chalk.level = prevLevel;
        process.exit(1);
      }
      chalk.level = prevLevel;
    }
  } catch (error) {
    spinner.fail(
      `Fix failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    process.exit(1);
  }
}
