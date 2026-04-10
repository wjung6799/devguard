# DevGuard Product Roadmap

## Vision

DevGuard starts as a free, local-first MCP tool that solves context loss for individual developers. It evolves into an **LLM-powered personal knowledge base for dev work** — inspired by Andrej Karpathy's knowledge base architecture and prompt-as-code principles — where raw diary entries are compiled into a searchable, self-improving wiki that the LLM reads directly (no RAG needed).

The premium tiers extend this into cloud-synced personal history and team-wide context sharing — turning DevGuard from a personal memory tool into a collaboration layer.

---

## Architecture — The Knowledge Pipeline

Inspired by Karpathy's LLM-powered knowledge base system:

```
STAGE 1              STAGE 2              STAGE 3             STAGE 4            STAGE 5
DATA INGEST  →    LLM COMPILATION  →    THE WIKI     →    Q&A / QUERYING  →  OUTPUT FORMATS
                                                                    
diary entries        reads,            compiled             ask_diary           .md (handoff)
git commits          summarizes,       knowledge base       catch_me_up         PR descriptions
branch context       compiles          ~topics, decisions   search_entries      branch_map HTML
manual notes                           ~patterns, issues                       daily_view HTML
                                                                    
                         ┌──── self-improving loop ────┐
                         │                             │
                    STAGE 6                        STAGE 3
                    LINTING                        THE WIKI
                    • find inconsistencies         (updated)
                    • fill gaps
                    • find connections
                    • suggest topics
```

### Key Insight: No RAG Required

Like Karpathy's system, DevGuard doesn't need vector search at the local level. The LLM **reads its own compiled index** — a structured wiki generated from raw diary entries. This keeps the architecture simple:

- **Raw entries** = `.devguard/entries/` and `.devguard/branches/` (what exists today)
- **Compiled wiki** = `.devguard/wiki/` (new — LLM-generated summaries, topic pages, decision logs)
- **The LLM reads the wiki index** to answer questions, not embeddings

Vector search only becomes necessary at cross-project or team scale (Premium).

---

## Context Loading — The 3-Tier System

Inspired by the "Prompt Diet" approach (프롬프트 다이어트) — treating prompts as code with DRY principles and lazy loading:

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
| `compile_wiki` — LLM compiles entries into wiki pages | Planned |
| `lint_diary` — find gaps, inconsistencies, suggest connections | Planned |
| `ask_diary` — Q&A over compiled wiki (no RAG) | Planned |

**Storage:** `.devguard/` directory, gitignored, markdown files.

**Target user:** Solo dev who vibe codes and forgets what they did yesterday.

---

### Premium — Individual ($X/mo)

Cloud-synced diary with cross-project intelligence. Still works offline — syncs when connected.

#### Features

- **Cloud sync** — entries + wiki replicate to cloud, accessible from any machine
- **Cross-project search** — "when have I solved this before?" across all your projects
- **Cross-project wiki** — compiled knowledge base that spans multiple repos
- **`generate_handoff`** — produce a shareable context summary for a branch, PR, or project
- **PR description generation** — auto-generate PR body from branch diary entries
- **Export** — markdown, JSON, or PDF export of diary history
- **Retention** — unlimited history (free tier is local-only, so limited by machine)

#### What This Requires

- User accounts + auth
- Cloud storage backend (entries + wiki sync from local `.devguard/`)
- Vector database for cross-project semantic search (scale justifies it here)
- API service for cross-project queries

---

### Premium — Team ($X/user/mo)

Shared context across a team. Every team member's diary entries feed into a collective knowledge base.

#### Features

- **Shared project diaries** — team members see each other's entries for shared repos
- **Team wiki** — compiled from all team members' entries, auto-maintained
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
├── entries/          # Raw daily entries (Stage 1 — data ingest)
│   ├── 2026-03-17.md
│   └── 2026-03-30.md
├── branches/         # Raw branch entries
│   ├── daily-view.md
│   └── feature-auth.md
├── wiki/             # LLM-compiled knowledge base (Stage 3 — the wiki)
│   ├── index.md      # Topic index with one-line summaries (Tier 1 context)
│   ├── decisions.md  # Compiled decision log
│   ├── issues.md     # Recurring issues + resolutions
│   ├── patterns.md   # Observed patterns + conventions
│   └── topics/       # Per-topic deep pages
│       ├── auth.md
│       ├── npm-publish.md
│       └── branch-storage.md
├── branch-map.html   # Generated visualization
└── daily-view.html   # Generated calendar
```

### Cloud (Premium)

```
Local (.devguard/)  →  Sync Agent  →  Cloud API  →  Storage + Vector DB
                                            ↓
                                     Web Dashboard
                                     Team Queries
                                     Cross-Project Search
```

### Key Components

| Component | Purpose | Candidates |
|-----------|---------|------------|
| Wiki compiler | LLM summarizes entries → wiki pages | Built into MCP tool |
| Linter | LLM reviews wiki for gaps/connections | Built into MCP tool |
| Auth | User accounts, API keys (Premium) | Clerk, Auth0, custom JWT |
| Cloud storage | Entry + wiki persistence (Premium) | PostgreSQL + S3 |
| Vector DB | Cross-project semantic search (Premium) | pgvector, Pinecone |
| Sync agent | Local ↔ cloud replication (Premium) | Background process in MCP server |
| API | Query, search, handoff endpoints (Premium) | Node / Hono |
| Billing | Subscription management (Premium) | Stripe |
| Web dashboard | Team activity, search UI (Premium) | React / Next.js |

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
├── entries[]
└── wiki_pages[]

Entry
├── id, project_id, author_id
├── date, branch, commit_hash
├── summary, content (full markdown)
├── embedding (vector) — Premium only
├── visibility (private | project | org)
└── tags[]

WikiPage
├── id, project_id
├── topic, content
├── source_entries[] (which entries compiled into this)
├── last_compiled, stale (boolean)
└── embedding (vector) — Premium only
```

---

## Sequencing

### Phase 1 — Complete the Free Tier + Wiki Foundation
- Wire up `search_entries` in index.ts
- Build `compile_wiki` — LLM reads all entries, generates topic pages + index
- Implement tiered context loading in `catch_me_up` (Tier 1 always, Tier 2 contextual)
- Ship to npm as v0.4.0
- Validate adoption and gather feedback

### Phase 2 — Self-Improving Loop + Local Intelligence
- Build `lint_diary` — find gaps, inconsistencies, suggest connections
- Build `ask_diary` — Q&A over compiled wiki (LLM reads its own index)
- Build `generate_handoff` — shareable context summaries
- PR description generation from branch diary
- Self-improving loop: linter findings feed back into wiki compilation
- Ship as v0.5.0

### Phase 3 — Individual Premium
- Build auth + cloud sync (entries + wiki)
- Cross-project wiki + search (vector DB justified at this scale)
- Export formats (markdown, JSON, PDF)
- Launch individual tier

### Phase 4 — Team Premium
- Org/team model + permissions
- Team wiki (compiled from all members' entries)
- Handoff workflows + notifications
- Team dashboard (web app)
- Launch team tier

### Phase 5 — Expansion
- IDE plugins (VS Code panel showing wiki context)
- GitHub App (auto-comment diary context on PRs)
- Slack integration (morning briefing in channel)
- Analytics (coding patterns, productivity insights)
- Future: synthetic data + fine-tuning → project knowledge baked into model weights

---

## Open Questions

- **Wiki compilation trigger:** On every `write_entry`? Periodic? Manual `compile_wiki` command? Incremental (only re-compile when new entries exist)?
- **Tier 2 relevance:** How to determine which wiki pages are "related to files being touched"? File path matching? Topic keywords from git diff?
- **Pricing:** What's the right price point? $5/mo individual, $10/user/mo team?
- **Offline-first:** How aggressive should cloud sync be? Real-time vs. periodic vs. manual?
- **Privacy:** Some entries may contain sensitive decisions/issues — how to handle visibility defaults?
- **Self-improving loop frequency:** How often should the linter run? Every session start? Weekly?
- **Design the team model first?** Building org/team/permissions from day one avoids a rewrite later, but adds upfront complexity. Individual-as-team-of-one is cleaner long-term.
