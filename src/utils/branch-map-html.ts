import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { CommitNode } from "./git.js";
import { DiaryEntry } from "./storage.js";

export interface BranchData {
  name: string;
  isCurrent: boolean;
  isMain: boolean;
  summary: string;
  ahead: number;
  behind: number;
  commits: CommitNode[];
  filesChanged: number;
  diaryEntries: DiaryEntry[];
}

export interface GitEvent {
  type: "fork" | "merge" | "new";
  label: string;
  branch: string;
}

export function generateAndOpenBranchMap(
  projectPath: string,
  branches: BranchData[],
  events: GitEvent[]
): string {
  const projectName = projectPath.split("/").pop() || "project";
  const html = buildHtml(branches, events, projectName);
  const dir = join(projectPath, ".devguard");
  mkdirSync(dir, { recursive: true });
  const filePath = join(dir, "branch-map.html");
  writeFileSync(filePath, html, "utf-8");

  try {
    const platform = process.platform;
    if (platform === "darwin") {
      execSync(`open "${filePath}"`, { timeout: 5000 });
    } else if (platform === "linux") {
      execSync(`xdg-open "${filePath}"`, { timeout: 5000 });
    } else if (platform === "win32") {
      execSync(`start "" "${filePath}"`, { timeout: 5000 });
    }
  } catch {
    // Silently fail — file is still written
  }

  return filePath;
}

function esc(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRANCH_COLORS = [
  "#4A90D9", // blue (main)
  "#8e44ad", // purple
  "#27ae60", // green
  "#c0392b", // red
  "#e67e22", // orange
  "#1abc9c", // teal
  "#e74c3c", // bright red
  "#2ecc71", // emerald
  "#9b59b6", // amethyst
  "#f39c12", // sunflower
];

function buildHtml(
  branches: BranchData[],
  events: GitEvent[],
  projectName: string
): string {
  const branchesJson = JSON.stringify(branches);
  const eventsJson = JSON.stringify(events);
  const now = new Date().toLocaleString();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Multiverse Git Navigator — ${esc(projectName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

  :root {
    --bg: #f5f1eb;
    --sidebar-bg: #ede8e0;
    --surface: #ffffff;
    --header-bg: #2d4a3e;
    --header-text: #ffffff;
    --text: #2c3e50;
    --text-muted: #7f8c8d;
    --text-light: #95a5a6;
    --border: #d5cfc5;
    --border-light: #e8e3db;
    --accent: #1abc9c;
    --blue: #4A90D9;
    --green: #27ae60;
    --red: #c0392b;
    --purple: #8e44ad;
    --orange: #e67e22;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg);
    color: var(--text);
    overflow: hidden;
    height: 100vh;
  }

  /* ─── Header ─── */
  .topbar {
    background: var(--header-bg);
    color: var(--header-text);
    height: 48px;
    display: flex;
    align-items: center;
    padding: 0 20px;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    z-index: 100;
    position: relative;
  }
  .topbar-left { display: flex; align-items: center; gap: 14px; }
  .topbar-menu { font-size: 20px; opacity: 0.7; cursor: pointer; }
  .topbar-title {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 2px;
    text-transform: uppercase;
  }
  .topbar-actions { display: flex; gap: 16px; align-items: center; }
  .topbar-icon {
    width: 18px; height: 18px;
    opacity: 0.6;
    cursor: pointer;
    transition: opacity 0.2s;
  }
  .topbar-icon:hover { opacity: 1; }
  .topbar-search {
    background: rgba(255,255,255,0.1);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 6px;
    padding: 5px 12px;
    color: white;
    font-size: 12px;
    width: 180px;
    outline: none;
  }
  .topbar-search::placeholder { color: rgba(255,255,255,0.4); }

  /* ─── Layout ─── */
  .layout {
    display: flex;
    height: calc(100vh - 48px - 90px);
  }

  /* ─── Sidebar ─── */
  .sidebar {
    width: 280px;
    background: var(--sidebar-bg);
    border-right: 1px solid var(--border);
    overflow-y: auto;
    padding: 16px;
    flex-shrink: 0;
  }
  .panel { margin-bottom: 24px; }
  .panel-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid var(--border);
  }

  /* Minimap */
  .minimap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    height: 80px;
    overflow: hidden;
    position: relative;
  }
  .minimap svg { width: 100%; height: 100%; }

  /* My Position */
  .position-branch {
    font-weight: 700;
    font-size: 14px;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .position-branch .dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    display: inline-block;
  }
  .position-commit {
    font-size: 12px;
    color: var(--text-muted);
    margin-top: 6px;
    font-family: 'JetBrains Mono', monospace;
  }

  /* Active Universes */
  .universe-list { list-style: none; }
  .universe-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 7px 10px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    transition: background 0.15s;
  }
  .universe-item:hover { background: rgba(0,0,0,0.05); }
  .universe-item.active { background: rgba(0,0,0,0.08); font-weight: 600; }
  .universe-dot {
    width: 10px; height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid transparent;
  }
  .universe-expand {
    margin-left: auto;
    font-size: 14px;
    color: var(--text-light);
    font-weight: 400;
  }

  /* Events */
  .event-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 5px 0;
    font-size: 12px;
    color: var(--text-muted);
  }
  .event-icon { font-size: 14px; flex-shrink: 0; margin-top: 1px; }

  /* ─── Canvas ─── */
  .canvas-area {
    flex: 1;
    position: relative;
    overflow: auto;
    background: var(--bg);
  }
  .canvas-area svg {
    width: 100%;
    min-width: 900px;
    height: 100%;
  }

  /* SVG styles */
  .branch-line {
    fill: none;
    stroke-width: 3;
    stroke-linecap: round;
  }
  .branch-arrow { stroke: none; }
  .commit-node {
    cursor: pointer;
    transition: r 0.15s;
  }
  .commit-node:hover { r: 10; }
  .event-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
  }
  .branch-label-text {
    font-size: 12px;
    font-weight: 600;
    fill: var(--text-muted);
  }

  /* Commit tooltip */
  .commit-tooltip {
    position: fixed;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 10px;
    padding: 12px 16px;
    font-size: 12px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    pointer-events: none;
    z-index: 200;
    display: none;
    max-width: 320px;
    line-height: 1.5;
  }
  .tooltip-hash {
    font-family: 'JetBrains Mono', monospace;
    color: var(--blue);
    font-weight: 600;
    font-size: 11px;
  }
  .tooltip-msg { margin-top: 4px; font-weight: 500; }
  .tooltip-author { color: var(--text-muted); margin-top: 2px; font-size: 11px; }

  /* ─── Detail Panel ─── */
  .detail-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 14px;
    padding: 0;
    width: 340px;
    max-height: calc(100% - 40px);
    overflow-y: auto;
    box-shadow: 0 12px 40px rgba(0,0,0,0.12);
    z-index: 50;
    display: none;
  }
  .detail-header {
    padding: 18px 20px 14px;
    border-bottom: 1px solid var(--border-light);
    position: sticky;
    top: 0;
    background: var(--surface);
    border-radius: 14px 14px 0 0;
  }
  .detail-close {
    position: absolute;
    top: 14px;
    right: 16px;
    cursor: pointer;
    font-size: 18px;
    color: var(--text-muted);
    background: none;
    border: none;
    padding: 4px;
    line-height: 1;
  }
  .detail-close:hover { color: var(--text); }
  .detail-name {
    font-size: 16px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .detail-name .dot {
    width: 12px; height: 12px;
    border-radius: 50%;
    display: inline-block;
  }
  .detail-status {
    font-size: 12px;
    margin-top: 6px;
    color: var(--text-muted);
  }
  .detail-status .ahead { color: var(--green); font-weight: 700; }
  .detail-status .behind { color: var(--red); font-weight: 700; }

  .detail-stats {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 4px 16px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--border-light);
    font-size: 13px;
  }
  .detail-stat-label { color: var(--text-muted); }
  .detail-stat-value { font-weight: 700; text-align: right; }

  .detail-chart {
    margin: 14px 20px;
    height: 50px;
    background: var(--bg);
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  .detail-chart svg { width: 100%; height: 100%; }

  /* Diary entries in detail panel */
  .detail-diary {
    padding: 0 20px 16px;
  }
  .diary-entry {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border-light);
  }
  .diary-entry:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .diary-entry-title {
    font-size: 13px;
    font-weight: 700;
    margin-bottom: 6px;
    line-height: 1.4;
  }
  .diary-entry-date {
    font-size: 10px;
    color: var(--text-light);
    margin-bottom: 8px;
    font-family: 'JetBrains Mono', monospace;
  }
  .diary-section {
    margin-top: 8px;
  }
  .diary-section-title {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.8px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }
  .diary-section-title.changes { color: var(--blue); }
  .diary-section-title.decisions { color: var(--purple); }
  .diary-section-title.issues { color: var(--red); }
  .diary-section-title.next-steps { color: var(--green); }
  .diary-section ul {
    list-style: none;
    padding: 0;
  }
  .diary-section li {
    font-size: 12px;
    color: var(--text-muted);
    padding: 2px 0 2px 12px;
    position: relative;
    line-height: 1.5;
  }
  .diary-section li::before {
    content: '';
    position: absolute;
    left: 0;
    top: 9px;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: var(--border);
  }

  /* ─── Scrubber ─── */
  .scrubber {
    height: 90px;
    background: var(--sidebar-bg);
    border-top: 1px solid var(--border);
    padding: 12px 40px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }
  .scrubber-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .scrubber-track {
    width: 70%;
    position: relative;
    height: 24px;
    margin: 4px 0;
  }
  .scrubber-bar {
    position: absolute;
    top: 50%;
    left: 0; right: 0;
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    transform: translateY(-50%);
  }
  .scrubber-highlight {
    position: absolute;
    top: 50%;
    height: 6px;
    background: var(--accent);
    border-radius: 3px;
    transform: translateY(-50%);
    left: 10%;
    right: 10%;
  }
  .scrubber-handle {
    position: absolute;
    top: 50%;
    width: 14px; height: 14px;
    background: var(--accent);
    border: 2px solid white;
    border-radius: 50%;
    transform: translate(-50%, -50%);
    cursor: grab;
    box-shadow: 0 2px 6px rgba(0,0,0,0.15);
    z-index: 2;
  }
  .scrubber-dates {
    display: flex;
    justify-content: space-between;
    width: 70%;
    font-size: 11px;
    color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }
  .scrubber-range-badge {
    background: var(--accent);
    color: white;
    padding: 3px 14px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
  }

  /* Scrollbar */
  ::-webkit-scrollbar { width: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-light); }
</style>
</head>
<body>

<!-- Header -->
<div class="topbar">
  <div class="topbar-left">
    <span class="topbar-menu">&#9776;</span>
    <span class="topbar-title">Multiverse Git Navigator</span>
  </div>
  <div class="topbar-actions">
    <input class="topbar-search" placeholder="Search branches..." id="searchInput">
    <svg class="topbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <svg class="topbar-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>
  </div>
</div>

<div class="layout">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="panel">
      <div class="panel-title">Timeline Overview</div>
      <div class="minimap" id="minimap"></div>
    </div>

    <div class="panel">
      <div class="panel-title">My Position</div>
      <div id="myPosition"></div>
    </div>

    <div class="panel">
      <div class="panel-title">Active Universes</div>
      <ul class="universe-list" id="universeList"></ul>
    </div>

    <div class="panel">
      <div class="panel-title">Events</div>
      <div id="eventList"></div>
    </div>
  </aside>

  <!-- Main Canvas -->
  <div class="canvas-area" id="canvasArea">
    <svg id="branchCanvas"></svg>
    <div class="detail-panel" id="detailPanel"></div>
    <div class="commit-tooltip" id="commitTooltip"></div>
  </div>
</div>

<!-- Temporal Scrubber -->
<div class="scrubber">
  <div class="scrubber-label">Temporal Scrubber</div>
  <div id="scrubberRangeBadge" class="scrubber-range-badge"></div>
  <div class="scrubber-track" id="scrubberTrack">
    <div class="scrubber-bar"></div>
    <div class="scrubber-highlight" id="scrubberHighlight"></div>
    <div class="scrubber-handle" id="scrubberLeft" style="left: 10%"></div>
    <div class="scrubber-handle" id="scrubberRight" style="left: 90%"></div>
  </div>
  <div class="scrubber-dates" id="scrubberDates"></div>
</div>

<script>
const BRANCHES = ${branchesJson};
const EVENTS = ${eventsJson};
const PROJECT = ${JSON.stringify(esc(projectName))};
const COLORS = ${JSON.stringify(BRANCH_COLORS)};

// Assign colors
const colorMap = {};
BRANCHES.forEach((b, i) => {
  colorMap[b.name] = b.isMain ? COLORS[0] : COLORS[(i % (COLORS.length - 1)) + 1];
});

// ─── Sidebar: My Position ───
(function renderPosition() {
  const current = BRANCHES.find(b => b.isCurrent) || BRANCHES[0];
  if (!current) return;
  const lastCommit = current.commits[0];
  const el = document.getElementById('myPosition');
  el.innerHTML = \`
    <div class="position-branch">
      <span class="dot" style="background:\${colorMap[current.name]}"></span>
      \${current.name}
    </div>
    <div class="position-commit">\${lastCommit ? lastCommit.shortHash + ' ' + lastCommit.message.slice(0, 40) : 'No commits'}</div>
  \`;
})();

// ─── Sidebar: Active Universes ───
(function renderUniverses() {
  const list = document.getElementById('universeList');
  BRANCHES.forEach(b => {
    const li = document.createElement('li');
    li.className = 'universe-item' + (b.isCurrent ? ' active' : '');
    li.innerHTML = \`
      <span class="universe-dot" style="background:\${colorMap[b.name]}"></span>
      <span>\${b.name.toUpperCase()}</span>
      <span class="universe-expand">+</span>
    \`;
    li.addEventListener('click', () => showDetail(b.name));
    list.appendChild(li);
  });
})();

// ─── Sidebar: Events ───
(function renderEvents() {
  const el = document.getElementById('eventList');
  if (EVENTS.length === 0) {
    el.innerHTML = '<div class="event-item"><span class="event-icon">&#9679;</span> No events</div>';
    return;
  }
  EVENTS.forEach(ev => {
    const icons = { fork: '&#10138;', merge: '&#8644;', 'new': '&#9733;' };
    const div = document.createElement('div');
    div.className = 'event-item';
    div.innerHTML = \`<span class="event-icon">\${icons[ev.type] || '&#9679;'}</span> \${ev.label}\`;
    el.appendChild(div);
  });
})();

// ─── Main SVG Canvas ───
(function renderCanvas() {
  const svg = document.getElementById('branchCanvas');
  const area = document.getElementById('canvasArea');

  const mainBranch = BRANCHES.find(b => b.isMain);
  const features = BRANCHES.filter(b => !b.isMain);
  const PADDING = { top: 60, bottom: 60, left: 220, right: 60 };
  const LANE_H = 150;
  const NODE_SPACING = 120; // even spacing between commits

  // Compute canvas width based on max commits
  const maxCommits = Math.max(...BRANCHES.map(b => b.commits.length), 2);
  const W = Math.max(area.clientWidth, PADDING.left + maxCommits * NODE_SPACING + PADDING.right, 900);
  const totalH = PADDING.top + (features.length + 1) * LANE_H + PADDING.bottom;

  svg.setAttribute('viewBox', \`0 0 \${W} \${totalH}\`);
  svg.style.height = Math.max(totalH, area.clientHeight) + 'px';
  svg.style.width = W + 'px';
  svg.style.minHeight = '100%';

  // Lane y-positions: main at top, features below
  const laneY = {};
  const MAIN_Y = PADDING.top + 40;
  if (mainBranch) laneY[mainBranch.name] = MAIN_Y;
  features.forEach((b, i) => {
    laneY[b.name] = MAIN_Y + (i + 1) * LANE_H;
  });

  // Helper: create SVG element
  function svgEl(tag, attrs) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    return el;
  }

  // Even spacing for commits on a branch (index-based, not timestamp)
  function commitX(index, total) {
    if (total <= 1) return PADDING.left + NODE_SPACING;
    return PADDING.left + index * ((W - PADDING.left - PADDING.right - 50) / (total - 1));
  }

  // Draw a branch
  function drawBranch(branch) {
    const y = laneY[branch.name];
    const color = colorMap[branch.name];
    const commits = [...branch.commits].reverse(); // oldest first
    if (commits.length === 0) return;

    const positions = commits.map((c, i) => ({
      x: commitX(i, commits.length), y, commit: c, index: i
    }));

    // Draw line through all commits + arrow
    const firstX = positions[0].x;
    const lastX = positions[positions.length - 1].x;
    const arrowX = lastX + 40;

    let d = \`M \${firstX} \${y}\`;
    for (let i = 1; i < positions.length; i++) {
      d += \` L \${positions[i].x} \${y}\`;
    }
    d += \` L \${arrowX} \${y}\`;
    svg.appendChild(svgEl('path', { d, class: 'branch-line', stroke: color }));
    svg.appendChild(svgEl('polygon', {
      points: \`\${arrowX},\${y - 6} \${arrowX + 14},\${y} \${arrowX},\${y + 6}\`,
      fill: color, class: 'branch-arrow'
    }));

    // Fork curve from main (for feature branches)
    if (!branch.isMain && mainBranch) {
      const mainY = laneY[mainBranch.name];
      const forkStartX = firstX - 30;
      const midY = (mainY + y) / 2;
      svg.appendChild(svgEl('path', {
        d: \`M \${forkStartX} \${mainY} C \${forkStartX} \${midY} \${firstX} \${midY} \${firstX} \${y}\`,
        class: 'branch-line', stroke: color, opacity: '0.4'
      }));

      // Fork label — positioned along the curve, offset to the right to avoid branch name
      const labelX = forkStartX + 20;
      const labelY = midY - 2;
      svg.appendChild(svgEl('rect', {
        x: String(labelX - 35), y: String(labelY - 10),
        width: '70', height: '18', rx: '9',
        fill: color, opacity: '0.12'
      }));
      const forkLabel = svgEl('text', {
        x: String(labelX), y: String(labelY + 4),
        'text-anchor': 'middle', fill: color, class: 'event-label'
      });
      forkLabel.textContent = 'FORKED';
      svg.appendChild(forkLabel);
    }

    // Branch label (left side, with enough room)
    const labelEl = svgEl('text', {
      x: String(PADDING.left - 16), y: String(y + 5),
      'text-anchor': 'end', class: 'branch-label-text',
      fill: color, 'font-weight': '600', 'font-size': '13', cursor: 'pointer'
    });
    labelEl.textContent = branch.name;
    labelEl.addEventListener('click', () => showDetail(branch.name));
    svg.appendChild(labelEl);

    // Commit nodes — only show labels on first, last, and every Nth to prevent overlap
    const labelEvery = commits.length <= 5 ? 1 : Math.ceil(commits.length / 5);
    positions.forEach((p, idx) => {
      const g = svgEl('g', { class: 'commit-group' });
      const showLabel = idx === 0 || idx === positions.length - 1 || idx % labelEvery === 0;

      // Outer circle
      g.appendChild(svgEl('circle', {
        cx: String(p.x), cy: String(y), r: '8',
        fill: 'white', stroke: color, 'stroke-width': '2.5',
        class: 'commit-node', cursor: 'pointer'
      }));
      // Inner dot
      g.appendChild(svgEl('circle', {
        cx: String(p.x), cy: String(y), r: '3.5',
        fill: color, 'pointer-events': 'none'
      }));

      // Labels — only on selected nodes
      if (showLabel) {
        const hashEl = svgEl('text', {
          x: String(p.x), y: String(y + 24),
          'text-anchor': 'middle', 'font-size': '10',
          'font-family': "'JetBrains Mono', monospace",
          fill: color, opacity: '0.8'
        });
        hashEl.textContent = 'Hash: ' + p.commit.shortHash;
        g.appendChild(hashEl);

        const msgEl = svgEl('text', {
          x: String(p.x), y: String(y + 38),
          'text-anchor': 'middle', 'font-size': '10',
          'font-family': "'Inter', sans-serif", fill: '#7f8c8d'
        });
        const maxLen = Math.min(Math.floor(NODE_SPACING / 7), 30);
        msgEl.textContent = p.commit.message.length > maxLen
          ? p.commit.message.slice(0, maxLen - 2) + '...'
          : p.commit.message;
        g.appendChild(msgEl);

        const authEl = svgEl('text', {
          x: String(p.x), y: String(y + 50),
          'text-anchor': 'middle', 'font-size': '9',
          'font-family': "'Inter', sans-serif", fill: '#95a5a6'
        });
        authEl.textContent = '@' + p.commit.author;
        g.appendChild(authEl);
      }

      // Hover tooltip (always works, even on unlabeled nodes)
      g.querySelector('.commit-node').addEventListener('mouseenter', (e) => {
        const tooltip = document.getElementById('commitTooltip');
        tooltip.style.display = 'block';
        tooltip.style.left = e.clientX + 14 + 'px';
        tooltip.style.top = e.clientY - 10 + 'px';
        tooltip.innerHTML = \`
          <div class="tooltip-hash">\${p.commit.shortHash}</div>
          <div class="tooltip-msg">\${p.commit.message}</div>
          <div class="tooltip-author">\${p.commit.author} &middot; \${p.commit.date}</div>
        \`;
      });
      g.querySelector('.commit-node').addEventListener('mouseleave', () => {
        document.getElementById('commitTooltip').style.display = 'none';
      });
      g.querySelector('.commit-node').addEventListener('click', () => showDetail(branch.name));

      svg.appendChild(g);
    });
  }

  // Draw main first (background), then features on top
  if (mainBranch) drawBranch(mainBranch);
  features.forEach(b => drawBranch(b));

  // ─── Minimap ───
  const miniSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  miniSvg.setAttribute('viewBox', \`0 0 \${W} \${totalH}\`);
  miniSvg.setAttribute('preserveAspectRatio', 'none');
  BRANCHES.forEach(b => {
    const commits = [...b.commits].reverse();
    const y = laneY[b.name];
    if (commits.length < 1) return;
    let d = '';
    commits.forEach((c, i) => {
      const x = commitX(i, commits.length);
      d += (i === 0 ? 'M' : 'L') + \` \${x} \${y}\`;
    });
    miniSvg.appendChild(svgEl('path', {
      d, fill: 'none', stroke: colorMap[b.name], 'stroke-width': '3', opacity: '0.6'
    }));
  });
  document.getElementById('minimap').appendChild(miniSvg);
})();

// ─── Detail Panel ───
function showDetail(branchName) {
  const branch = BRANCHES.find(b => b.name === branchName);
  if (!branch) return;
  const panel = document.getElementById('detailPanel');
  const color = colorMap[branchName];

  let diaryHtml = '';
  if (branch.diaryEntries && branch.diaryEntries.length > 0) {
    diaryHtml = '<div class="detail-diary">';
    // Show most recent entries (up to 5)
    const entries = branch.diaryEntries.slice(0, 5);
    entries.forEach(entry => {
      diaryHtml += '<div class="diary-entry">';
      diaryHtml += \`<div class="diary-entry-title">\${entry.title}</div>\`;
      if (entry.date) diaryHtml += \`<div class="diary-entry-date">\${entry.date}</div>\`;

      if (entry.whatChanged.length > 0) {
        diaryHtml += '<div class="diary-section"><div class="diary-section-title changes">What Changed</div><ul>';
        entry.whatChanged.forEach(item => { diaryHtml += \`<li>\${item}</li>\`; });
        diaryHtml += '</ul></div>';
      }
      if (entry.decisions.length > 0) {
        diaryHtml += '<div class="diary-section"><div class="diary-section-title decisions">Decisions</div><ul>';
        entry.decisions.forEach(item => { diaryHtml += \`<li>\${item}</li>\`; });
        diaryHtml += '</ul></div>';
      }
      if (entry.issues.length > 0) {
        diaryHtml += '<div class="diary-section"><div class="diary-section-title issues">Issues</div><ul>';
        entry.issues.forEach(item => { diaryHtml += \`<li>\${item}</li>\`; });
        diaryHtml += '</ul></div>';
      }
      if (entry.nextSteps.length > 0) {
        diaryHtml += '<div class="diary-section"><div class="diary-section-title next-steps">Next Steps</div><ul>';
        entry.nextSteps.forEach(item => { diaryHtml += \`<li>\${item}</li>\`; });
        diaryHtml += '</ul></div>';
      }
      diaryHtml += '</div>';
    });
    diaryHtml += '</div>';
  } else {
    diaryHtml = '<div class="detail-diary" style="color:var(--text-light);font-size:12px;padding:0 20px 16px;">No diary entries for this branch.</div>';
  }

  // Activity sparkline
  const sparkData = branch.commits.map((c, i) => i).reverse();
  const sparkW = 300;
  const sparkH = 40;
  let sparkPath = '';
  if (sparkData.length > 1) {
    sparkData.forEach((_, i) => {
      const x = (i / (sparkData.length - 1)) * sparkW;
      const y = sparkH - (Math.random() * 0.6 + 0.2) * sparkH;
      sparkPath += (i === 0 ? 'M' : 'L') + \` \${x} \${y}\`;
    });
  }

  panel.innerHTML = \`
    <div class="detail-header">
      <button class="detail-close" onclick="document.getElementById('detailPanel').style.display='none'">&times;</button>
      <div class="detail-name">
        <span class="dot" style="background:\${color}"></span>
        \${branch.name.toUpperCase()}
      </div>
      <div class="detail-status">
        Universe Status: <span class="ahead">\${branch.ahead} Ahead</span>, <span class="behind">\${branch.behind} Behind</span> MAIN
      </div>
    </div>
    <div class="detail-stats">
      <span class="detail-stat-label">Commits</span>
      <span class="detail-stat-value">\${branch.commits.length}</span>
      <span class="detail-stat-label">Files Changed</span>
      <span class="detail-stat-value">\${branch.filesChanged}</span>
    </div>
    <div class="detail-chart">
      <svg viewBox="0 0 \${sparkW} \${sparkH}" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="\${color}" stop-opacity="0.3"/>
            <stop offset="100%" stop-color="\${color}" stop-opacity="0.02"/>
          </linearGradient>
        </defs>
        \${sparkPath ? \`
          <path d="\${sparkPath} L \${sparkW} \${sparkH} L 0 \${sparkH} Z" fill="url(#sparkGrad)"/>
          <path d="\${sparkPath}" fill="none" stroke="\${color}" stroke-width="2"/>
        \` : ''}
      </svg>
    </div>
    \${diaryHtml}
  \`;
  panel.style.display = 'block';
}

// ─── Temporal Scrubber ───
(function initScrubber() {
  const allTs = BRANCHES.flatMap(b => b.commits.map(c => c.timestamp)).filter(Boolean);
  if (allTs.length === 0) return;
  const minTs = Math.min(...allTs);
  const maxTs = Math.max(...allTs);

  function formatTs(ts) {
    const d = new Date(ts * 1000);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  document.getElementById('scrubberDates').innerHTML = \`
    <span>\${formatTs(minTs)}</span>
    <span>\${formatTs(maxTs)}</span>
  \`;
  document.getElementById('scrubberRangeBadge').textContent =
    formatTs(minTs) + ' - ' + formatTs(maxTs);
})();

// ─── Search ───
document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  document.querySelectorAll('.universe-item').forEach((el, i) => {
    const name = BRANCHES[i]?.name.toLowerCase() || '';
    el.style.display = name.includes(q) ? '' : 'none';
  });
});
</script>
</body>
</html>`;
}
