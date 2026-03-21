import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { writeEntry, readEntries } from "../src/utils/storage";

test("writeEntry creates a daily file and appends sessions", () => {
  const projectPath = mkdtempSync(join(tmpdir(), "devdiary-storage-"));

  try {
    const first = `---
date: 2026-03-20T10:00:00.000Z
branch: main
summary: "Initial entry"
---

# Initial entry

## What Changed
- Added baseline feature
`;

    const second = `---
date: 2026-03-20T10:30:00.000Z
branch: main
summary: "Second entry"
---

# Second entry

## What Changed
- Improved tests
`;

    const filePath = writeEntry(projectPath, first);
    writeEntry(projectPath, second);

    const entriesDir = join(projectPath, ".devdiary", "entries");
    const files = readdirSync(entriesDir);

    assert.equal(files.length, 1);
    assert.match(files[0], /^\d{4}-\d{2}-\d{2}\.md$/);
    assert.equal(filePath, join(entriesDir, files[0]));

    const content = readFileSync(filePath, "utf-8");
    assert.match(content, /# Initial entry/);
    assert.match(content, /# Second entry/);
    assert.match(content, /<!-- session: \d{2}:\d{2} -->/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});

test("readEntries returns latest files first and respects count", () => {
  const projectPath = mkdtempSync(join(tmpdir(), "devdiary-read-"));
  const entriesDir = join(projectPath, ".devdiary", "entries");

  try {
    // Seed fake entry files in date order.
    mkdirSync(entriesDir, { recursive: true });
    writeFileSync(join(entriesDir, "2026-03-18.md"), "# Oldest", "utf-8");
    writeFileSync(join(entriesDir, "2026-03-19.md"), "# Middle", "utf-8");
    writeFileSync(join(entriesDir, "2026-03-20.md"), "# Latest", "utf-8");

    const entries = readEntries(projectPath, 2);
    assert.equal(entries.length, 2);
    assert.match(entries[0], /# Latest/);
    assert.match(entries[1], /# Middle/);
  } finally {
    rmSync(projectPath, { recursive: true, force: true });
  }
});
