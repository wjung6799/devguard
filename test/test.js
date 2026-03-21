const test = require("node:test");
const assert = require("node:assert/strict");

const {
  mkdtempSync,
  readFileSync,
  rmSync,
} = require("node:fs");

const { tmpdir } = require("node:os");
const { join } = require("node:path");

const { registerGetContext } = require("../src/tools/get-context");
const { registerWriteEntry } = require("../src/tools/write-entry");

class FakeServer {
  handlers = new Map();

  tool(name, _description, _schema, handler) {
    this.handlers.set(name, handler);
  }
}

test("get_context returns a non-git helpful message", async () => {
  const server = new FakeServer();
  registerGetContext(server);

  const handler = server.handlers.get("get_context");
  assert.ok(handler);

  const tempPath = mkdtempSync(join(tmpdir(), "devdiary-get-context-"));

  try {
    const result = await handler({ project_path: tempPath });
    const text = result.content[0].text;

    assert.match(text, /is not a git repository/i);
  } finally {
    rmSync(tempPath, { recursive: true, force: true });
  }
});

test("write_entry creates a markdown diary entry with optional sections", async () => {
  const server = new FakeServer();
  registerWriteEntry(server);

  const handler = server.handlers.get("write_entry");
  assert.ok(handler);

  const tempPath = mkdtempSync(join(tmpdir(), "devdiary-write-entry-"));
  try {
    const result = await handler({
      project_path: tempPath,
      summary: "Implemented testable diary workflow",
      changes: "- Added tests for core tools",
      decisions: "- Use Node built-in test runner",
      issues: "- None",
      next_steps: "- Add integration tests",
    });

    const outputText = result.content[0].text;
    assert.match(outputText, /^Diary entry saved:/);

    const savedPath = outputText.replace("Diary entry saved: ", "").trim();
    const body = readFileSync(savedPath, "utf-8");

    assert.match(body, /# Implemented testable diary workflow/);
    assert.match(body, /## What Changed/);
    assert.match(body, /## Decisions/);
    assert.match(body, /## Issues/);
    assert.match(body, /## Next Steps/);
  } finally {
    rmSync(tempPath, { recursive: true, force: true });
  }
});