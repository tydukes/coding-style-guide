/**
 * Unit tests for the cache manager.
 */

import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { writeFileSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { hashFile, getCached, setCached } from "./manager.js";

const testDir = join(tmpdir(), `devops-style-cache-test-${process.pid}`);

const STUB_RESULT = {
  file: "/some/file.sh",
  language: "bash" as const,
  issues: [],
  fixable: 0,
};

describe("cache/manager", () => {
  before(() => {
    mkdirSync(testDir, { recursive: true });
  });

  after(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it("hashFile is deterministic for same content", () => {
    const file = join(testDir, "hash-test.txt");
    writeFileSync(file, "hello world");
    assert.equal(hashFile(file), hashFile(file));
  });

  it("hashFile differs for different content", () => {
    const file1 = join(testDir, "a.txt");
    const file2 = join(testDir, "b.txt");
    writeFileSync(file1, "hello");
    writeFileSync(file2, "world");
    assert.notEqual(hashFile(file1), hashFile(file2));
  });

  it("getCached returns null on cache miss", () => {
    const result = getCached(testDir, "shellcheck", "nonexistent-hash");
    assert.equal(result, null);
  });

  it("setCached and getCached round-trip returns stored result", () => {
    const cacheDir = join(testDir, "cache-roundtrip");
    setCached(cacheDir, "shellcheck", "abc123", STUB_RESULT);
    const retrieved = getCached(cacheDir, "shellcheck", "abc123");
    assert.ok(retrieved !== null);
    assert.equal(retrieved.file, STUB_RESULT.file);
    assert.equal(retrieved.language, STUB_RESULT.language);
    assert.deepEqual(retrieved.issues, STUB_RESULT.issues);
  });

  it("getCached returns null on corrupt cache entry", () => {
    const cacheDir = join(testDir, "corrupt-cache");
    mkdirSync(join(cacheDir, "shellcheck"), { recursive: true });
    writeFileSync(join(cacheDir, "shellcheck", "badhash.json"), "not valid json{{{");
    const result = getCached(cacheDir, "shellcheck", "badhash");
    assert.equal(result, null);
  });
});
