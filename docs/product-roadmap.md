# DevGuard Product Roadmap

## Vision

DevGuard is a free, local-first MCP tool that solves context loss for individual developers. It captures what you did, why, and what's next — then serves that context back intelligently so the LLM always knows where you left off.

The premium tiers extend this into cloud-synced personal history and team-wide context sharing — turning DevGuard from a personal memory tool into a collaboration layer.

---

## Architecture — 3-Tier Context Loading

Treating prompts as code with DRY principles and lazy loading — the LLM gets exactly the context it needs, nothing more:

### Tier 1 — Always Loaded (~minimal tokens)
- Project identity (name, branch, last commit)
- Wiki index (topic list + one-line summaries)
- Active next steps

### Tier 2 — Auto-Loaded (contextual)
- Current branch diary entries
- Wiki pages related to files being touched
- Recent decisions that affect current work

### Tier 3 — Explicit (on demand)
- Full diary history
- Other branch logs
- Deep topic dives via `ask_diary` or `search_entries`

**Result:** `catch_me_up` becomes smart — it loads Tier 1 + relevant Tier 2, not everything. The LLM gets the context it needs without token bloat.

---

## Tier Breakdown

### Free — Local, Zero-Config

Everything runs locally. No account, no network, no cost.

| Feature | Status |
|---------|--------|
| `write_entry` — structured diary logging | Shipped |
| `read_entries` — recent entry retrieval | Shipped |
| `catch_me_up` — morning briefing | Shipped |
| `get_context` — git state snapshot | Shipped |
| `branch_map` — interactive branch visualization | Shipped |
| `daily_view` — calendar dashboard | Shipped |
| `search_entries` — keyword + date range search | Built, not wired up |
| `setup` — auto-config for CLAUDE.md / .cursorrules | Shipped |

**Storage:** `.devguard/` directory, gitignored, markdown files.

**Target user:** Solo dev who vibe codes and forgets what they did yesterday.

---

### Premium — Individual ($X/mo)

Cloud-synced diary with cross-project intelligence. Still works offline — syncs when connected.

#### Features

- **Cloud sync** — entries + wiki replicate to cloud, accessible from any machine
- **Cross-project search** — "when have I solved this before?" across all your projects
- **`generate_handoff`** — produce a shareable context summary for a branch, PR, or project
- **PR description generation** — auto-generate PR body from branch diary entries
- **Export** — markdown, JSON, or PDF export of diary history
- **Retention** — unlimited history (free tier is local-only, so limited by machine)

#### What This Requires

- User accounts + auth
- Cloud storage backend (entries + wiki sync from local `.devguard/`)
- Vector database for cross-project semantic search
- API service for cross-project queries

---

### Premium — Team ($X/user/mo)

Shared context across a team. Every team member's diary entries feed into a collective knowledge base.

#### Features

- **Shared project diaries** — team members see each other's entries for shared repos
- **Handoff workflows** — assign context to a teammate picking up your branch
- **Team-wide search** — "has anyone on the team dealt with this?"
- **Activity dashboard** — who's working on what, across branches and projects
- **Role-based visibility** — control which entries are visible to whom
- **Onboarding context** — new team members can search the full project history to ramp up
- **Conflict awareness** — surface when two people are working on overlapping files/features

#### What This Requires

- Everything from Individual tier
- Organization/team model with membership + roles
- Permissions layer (entry-level and project-level visibility)
- Team dashboard UI (web app)
- Notification system for handoffs and conflict alerts

---

## Technical Architecture

### Local (Free Tier)

```
.devguard/
├── entries/          # Raw daily entries
│   ├── 2026-03-17.md
│   └── 2026-03-30.md
├── branches/         # Raw branch entries
│   ├── daily-view.md
│   └── feature-auth.md
├── branch-map.html   # Generated visualization
└── daily-view.html   # Generated calendar
```

### Cloud (Premium)

```
Local (.devguard/)  →  Sync Agent  →  Cloud API  →  Storage + Vector DB
                                            ↓
                                     Web Dashboard (platform/)
                                     Cross-Project Search
```

### Key Components

| Component | Purpose | Candidates |
|-----------|---------|------------|
| Auth | User accounts, API keys (Premium) | Custom session auth (built) |
| Cloud storage | Entry persistence (Premium) | PostgreSQL + S3 |
| Vector DB | Cross-project semantic search (Premium) | pgvector, Pinecone |
| Sync agent | Local ↔ cloud replication (Premium) | Background process in MCP server |
| API | Query, search, handoff endpoints (Premium) | Node / Hono |
| Billing | Subscription management (Premium) | Stripe |
| Web dashboard | Team activity, search UI (Premium) | Next.js (scaffold built in `platform/`) |

### Data Model (Premium)

```
User
├── id, email, name
├── plan (free | individual | team)
└── orgs[]

Organization
├── id, name
├── members[] (user_id, role)
└── projects[]

Project
├── id, name, git_remote_url
├── org_id (nullable — personal projects have no org)
└── entries[]

Entry
├── id, project_id, author_id
├── date, branch, commit_hash
├── summary, content (full markdown)
├── embedding (vector) — Premium only
├── visibility (private | project | org)
└── tags[]
```

---

## Sequencing

### Phase 1 — Complete the Free Tier
- Wire up `search_entries` in index.ts
- Implement 3-tier context loading in `catch_me_up` (Tier 1 always, Tier 2 contextual)
- Ship to npm as v0.4.0
- Validate adoption and gather feedback

### Phase 2 — Handoff + PR Tools
- Build `generate_handoff` — shareable context summaries
- PR description generation from branch diary entries
- Ship as v0.5.0

### Phase 3 — Individual Premium
- Cloud sync (entries replicate from local `.devguard/`)
- Cross-project search (vector DB)
- Export formats (markdown, JSON, PDF)
- Wire MCP server to sync diary data into platform
- Launch individual tier

### Phase 4 — Team Premium
- Org/team model + permissions (extend existing platform schema)
- Handoff workflows + notifications
- Team dashboard
- Launch team tier

### Phase 5 — Expansion
- IDE plugins (VS Code panel showing diary context)
- GitHub App (auto-comment diary context on PRs)
- Slack integration (morning briefing in channel)
- Analytics (coding patterns, productivity insights)

---

## Open Questions

- **Tier 2 relevance:** How to determine which entries are contextually relevant? File path matching from git diff? Branch name? Recency?
- **Pricing:** What's the right price point? $5/mo individual, $12/user/mo team?
- **Offline-first:** How aggressive should cloud sync be? Real-time vs. periodic vs. manual?
- **Privacy:** Some entries may contain sensitive decisions/issues — how to handle visibility defaults?
- **Team model timing:** Adding Organization model to the platform schema now (even unused) avoids a rewrite later. Team-of-one pattern keeps it clean.
