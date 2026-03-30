# devguard

MCP server that keeps a dev diary for you — what changed, what decisions were made, what broke, what's next. Picks up where you left off so you never lose context between sessions.

## Why

You vibe code for 3 hours, close your laptop, and come back the next day with no idea what you were doing. Devguard fixes that. It reads your git state, tracks your branches, and writes diary entries automatically.

## Install

Add to Claude Code:

```bash
claude mcp add devguard -- npx devguard
```

That's it. On first run, devguard automatically:
- Adds `.devguard/` to your `.gitignore`
- Adds an auto-logging instruction to your `CLAUDE.md` (or `.cursorrules` if that exists)

From then on, your AI writes diary entries on its own — after finishing a feature, after a big commit, before context gets lost. You never think about it. The diary just fills itself.

## Tools

| Tool | What it does |
|------|-------------|
| `get_context` | Reads git branch, status, recent commits, and diffs |
| `write_entry` | Saves a diary entry with what changed, decisions, issues, and next steps |
| `read_entries` | Reads recent entries to catch you up |
| `catch_me_up` | Morning briefing — diary entries + git state + branch map in one shot |
| `branch_map` | Opens a visual branch map in your browser |
| `daily_view` | Opens a calendar dashboard showing diary entries by date |
| `setup` | Re-run setup manually if needed |

## Branch Map

Run `branch_map` to open an interactive HTML visualization of your repo in the browser. It shows:

- **All branches** with status (ahead/behind main), files changed, and latest commit
- **Collapsible diary summaries** per branch — what changed, decisions made, issues hit, next steps
- **Commit navigator** — click any branch to explore its commits on a visual timeline
- **Per-commit detail** — files changed, insertions/deletions, and diary entries linked to each commit
- **Auto-generated summaries** for commits without diary entries — categorized by type (Feature, Fix, Refactor, etc.) with affected areas and change scale

Designed for people who don't want to think about git.

## Daily View

Run `daily_view` to open a calendar dashboard in your browser. It pulls diary entries from all branches and displays them on a monthly grid:

- **Entry badges** on each day showing how many entries were logged
- **Click any day** to expand and see full details — what changed, decisions, issues, next steps
- **Keyboard navigation** — arrow keys to switch months, Escape to close the detail panel

A quick way to see your work history at a glance.

## Branch-Aware Diary

Entries are automatically routed by branch:
- **main/master** → `.devguard/entries/` (daily files)
- **feature branches** → `.devguard/branches/<branch-name>.md` (one file per branch)

This means `catch_me_up` shows you the current branch's full story first, then the main stem, then other active branches — so you always know what's happening everywhere.

## How It Works

Entries are markdown files stored locally in your project under `.devguard/`. Each entry captures:
- **Summary** — one-line description of what happened
- **What Changed** — files modified, features added, bugs fixed
- **Decisions** — key choices made and why
- **Issues** — what broke, what's stuck
- **Next Steps** — what to do next session
- **Commit hash** — links the entry to a specific commit for traceability

Multiple sessions and agents all append to the same file. The diary builds up over time, making summaries richer and the branch map more useful with every session.

## Contact

Join the Discord for questions, feedback, or feature requests: https://discord.gg/BrzRHHzjFQ
