/**
 * @module cache/manager
 * @description File-level SHA-256 cache for incremental lint runs
 * @version 1.0.0
 * @author Tyler Dukes
 */

import { createHash } from "crypto";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  rmSync,
} from "fs";
import { join, dirname } from "path";
import type { LintResult } from "../types.js";

/**
 * Compute SHA-256 hash of a file's contents
 */
export function hashFile(filePath: string): string {
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex");
}

/**
 * Build the cache file path for a given linter + file hash
 */
function cacheFilePath(cacheDir: string, linter: string, fileHash: string): string {
  return join(cacheDir, linter, `${fileHash}.json`);
}

/**
 * Retrieve a cached LintResult, or null if not present
 */
export function getCached(
  cacheDir: string,
  linter: string,
  fileHash: string
): LintResult | null {
  const path = cacheFilePath(cacheDir, linter, fileHash);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, "utf-8");
    return JSON.parse(raw) as LintResult;
  } catch {
    return null;
  }
}

/**
 * Store a LintResult in the cache
 */
export function setCached(
  cacheDir: string,
  linter: string,
  fileHash: string,
  result: LintResult
): void {
  const path = cacheFilePath(cacheDir, linter, fileHash);
  const dir = dirname(path);
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(path, JSON.stringify(result), "utf-8");
  } catch {
    // Cache write failures are non-fatal
  }
}

/**
 * Remove the entire cache directory
 */
export function clearCache(cacheDir: string): void {
  rmSync(cacheDir, { recursive: true, force: true });
}
