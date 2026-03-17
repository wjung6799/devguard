# dev-mark

MCP server that auto-generates dev diary entries from your git activity. What changed, what decisions were made, what broke, what's next — so you can pick up where you left off.

## Why

You vibe code for 3 hours, close your laptop, and come back the next day with no idea what you were doing. Dev-mark fixes that. It reads your git state and writes a diary entry automatically.

## Install

Add to Claude Code:

```bash
claude mcp add devdiary -- npx devdiary
```

## Tools

| Tool | What it does |
|------|-------------|
| `get_context` | Reads git branch, status, recent commits, and diffs |
| `write_entry` | Saves a diary entry to `.devdiary/entries/` |
| `read_entries` | Reads recent entries to catch you up |

Entries are markdown files stored locally in your project under `.devdiary/`.
