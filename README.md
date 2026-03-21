# dev-mark

MCP server that auto-generates dev diary entries from your git activity. What changed, what decisions were made, what broke, what's next — so you can pick up where you left off.

## Why

You vibe code for 3 hours, close your laptop, and come back the next day with no idea what you were doing. Dev-mark fixes that. It reads your git state and writes a diary entry automatically.

## Install

### Cursor

1. Register the MCP server — either **Cursor Settings → MCP → Add server**, or a project file **`.cursor/mcp.json`** at the repo root:

```json
{
  "mcpServers": {
    "devdiary": {
      "command": "npx",
      "args": ["-y", "devdiary"]
    }
  }
}
```

While you’re developing this package locally, point `command` / `args` at your built server instead (for example `node` and the absolute path to `dist/index.js` after `npm run build`).

2. Restart Cursor so MCP changes load.

That’s it. On first run, devdiary automatically:
- Adds `.devdiary/` to your `.gitignore`
- Adds an auto-logging instruction to your `CLAUDE.md` (or `.cursorrules` if that exists)

From then on, Cursor (or your AI) can write diary entries on its own — after finishing a feature, after a big commit, before context gets lost. You never think about it. The diary just fills itself.

### Claude Code (optional)

```bash
claude mcp add devdiary -- npx devdiary
```

## Tools

| Tool | What it does |
|------|-------------|
| `get_context` | Reads git branch, status, recent commits, and diffs |
| `write_entry` | Saves a diary entry to `.devdiary/entries/` |
| `read_entries` | Reads recent entries to catch you up |
| `catch_me_up` | Morning briefing — diary entries + git state in one shot |
| `setup` | Re-run setup manually if needed |

Entries are markdown files stored locally in your project under `.devdiary/`, one file per day. Multiple sessions and agents all append to the same daily file.
