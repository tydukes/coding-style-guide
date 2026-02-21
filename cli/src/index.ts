/**
 * @module devops-style-cli
 * @description Main CLI entry point for DevOps Engineering Style Guide
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { Command } from "commander";
import chalk from "chalk";
import { checkCommand } from "./commands/check.js";
import { fixCommand } from "./commands/fix.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { VERSION } from "./version.js";

const program = new Command();

program
  .name("devops-style")
  .description(
    "CLI tool for enforcing DevOps Engineering Style Guide standards"
  )
  .version(VERSION, "-v, --version", "Output the current version")
  .option("-c, --config <path>", "Path to configuration file")
  .option("--no-color", "Disable colored output")
  .option("--debug", "Enable debug output");

program
  .command("check [files...]")
  .description("Check files for style violations")
  .option("-f, --format <type>", "Output format: text, json, sarif", "text")
  .option("-l, --language <lang>", "Filter by language")
  .option("--strict", "Treat warnings as errors")
  .option("--fix", "Auto-fix issues where possible (alias for fix command)")
  .option("--no-cache", "Disable caching")
  .option("-q, --quiet", "Only show errors, no warnings")
  .action(checkCommand);

program
  .command("fix [files...]")
  .description("Auto-fix style violations where possible")
  .option("-l, --language <lang>", "Filter by language")
  .option("--dry-run", "Show what would be changed without making changes")
  .option("-f, --format <type>", "Output format: text, json", "text")
  .action(fixCommand);

program
  .command("init")
  .description("Initialize configuration in current project")
  .option("--force", "Overwrite existing configuration")
  .option("-t, --template <name>", "Template to use: minimal, standard, strict", "standard")
  .action(initCommand);

program
  .command("list")
  .description("List available linters and their status")
  .option("-l, --language <lang>", "Filter by language")
  .option("-f, --format <type>", "Output format: text, json", "text")
  .action(listCommand);

// Add global error handling
program.exitOverride();

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error) {
      if (err.message.includes("commander.")) {
        // Commander.js errors (help, version, etc.)
        process.exit(0);
      }
      console.error(chalk.red(`Error: ${err.message}`));
      if (program.opts().debug) {
        console.error(err.stack);
      }
    }
    process.exit(1);
  }
}

main();
