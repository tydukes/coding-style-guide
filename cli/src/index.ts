/**
 * @module devops-style-cli
 * @description Main CLI entry point for DevOps Engineering Style Guide
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { Command, Option } from "commander";
import chalk from "chalk";
import { checkCommand } from "./commands/check.js";
import { fixCommand } from "./commands/fix.js";
import { initCommand } from "./commands/init.js";
import { listCommand } from "./commands/list.js";
import { VERSION } from "./version.js";
import { setDebug } from "./utils/debug.js";
import { clearCache } from "./cache/manager.js";

// Handle --clear-cache before Commander parses (it's a global flag, not a subcommand)
if (process.argv.includes("--clear-cache")) {
  const cacheDir = ".dukestyle-cache";
  clearCache(cacheDir);
  console.log(chalk.green(`✔ Cache cleared: ${cacheDir}`));
  process.exit(0);
}

const program = new Command();

program
  .name("devops-style")
  .description(
    "CLI tool for enforcing DevOps Engineering Style Guide standards"
  )
  .version(VERSION, "-v, --version", "Output the current version")
  .option("-c, --config <path>", "Path to configuration file")
  .option("--no-color", "Disable colored output")
  .option("--debug", "Enable debug output")
  .option("--clear-cache", "Clear the lint cache and exit");

// Enable debug logging before any command action runs
program.hook("preAction", () => {
  setDebug(!!program.opts().debug);
});

program
  .command("check [files...]")
  .description("Check files for style violations")
  .addOption(new Option("-f, --format <type>", "Output format").choices(["text", "json", "sarif"]).default("text"))
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
  .addOption(new Option("-f, --format <type>", "Output format").choices(["text", "json"]).default("text"))
  .action(fixCommand);

program
  .command("init")
  .description("Initialize configuration in current project")
  .option("--force", "Overwrite existing configuration")
  .addOption(new Option("-t, --template <name>", "Template to use").choices(["minimal", "standard", "strict"]).default("standard"))
  .action(initCommand);

program
  .command("list")
  .description("List available linters and their status")
  .option("-l, --language <lang>", "Filter by language")
  .addOption(new Option("-f, --format <type>", "Output format").choices(["text", "json"]).default("text"))
  .action(listCommand);

// Add global error handling
program.exitOverride();

async function main(): Promise<void> {
  try {
    await program.parseAsync(process.argv);
  } catch (err) {
    if (err instanceof Error) {
      // Commander throws CommanderError with a code property (e.g. "commander.version",
      // "commander.helpDisplayed") — these are normal exits, not failures.
      const code = (err as { code?: string }).code;
      if (code?.startsWith("commander.")) {
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
