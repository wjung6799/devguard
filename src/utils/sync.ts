import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const CONFIG_DIR = join(
  process.env.HOME || process.env.USERPROFILE || "~",
  ".devguard"
);
const CONFIG_FILE = join(CONFIG_DIR, "config.json");
const RULES_CACHE_FILE = join(CONFIG_DIR, "rules-cache.json");

interface Config {
  apiKey: string;
  apiUrl: string;
  email: string;
  userId: string;
}

export function getConfig(): Config | null {
  if (!existsSync(CONFIG_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CONFIG_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export function isConfigured(): boolean {
  return getConfig() !== null;
}

interface SyncEntry {
  date: string;
  branch: string;
  commit: string;
  summary: string;
  content: string;
  source?: string;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
      }
    }
  }
  throw lastError;
}

export async function syncEntry(
  projectName: string,
  entry: SyncEntry
): Promise<{ ok: boolean; error?: string }> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Not configured" };

  try {
    const res = await withRetry(async () => {
      const r = await fetch(`${config.apiUrl}/api/sync/entries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({ projectName, entry }),
      });
      if (!r.ok) {
        const data = await r.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${r.status}`);
      }
      return r;
    });

    return { ok: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

export async function syncImport(
  projectName: string,
  entries: SyncEntry[]
): Promise<{ ok: boolean; imported?: number; skipped?: number; error?: string }> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Not configured" };

  try {
    const res = await fetch(`${config.apiUrl}/api/sync/import`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({ projectName, entries }),
    });

    if (!res.ok) {
      const data = await res.json();
      return { ok: false, error: data.error || `HTTP ${res.status}` };
    }

    const data = await res.json();
    return { ok: true, imported: data.imported, skipped: data.skipped };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}

type RuleItem = { id: string; title: string; content: string };

function cacheRules(rules: RuleItem[]): void {
  try {
    if (!existsSync(CONFIG_DIR)) mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(RULES_CACHE_FILE, JSON.stringify(rules), "utf-8");
  } catch {
    // best-effort cache
  }
}

function getCachedRules(): RuleItem[] | null {
  try {
    if (!existsSync(RULES_CACHE_FILE)) return null;
    return JSON.parse(readFileSync(RULES_CACHE_FILE, "utf-8"));
  } catch {
    return null;
  }
}

export async function fetchRules(): Promise<{ ok: boolean; rules?: RuleItem[]; error?: string; cached?: boolean }> {
  const config = getConfig();
  if (!config) return { ok: false, error: "Not configured" };

  try {
    const res = await fetch(`${config.apiUrl}/api/rules`, {
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    cacheRules(data.rules);
    return { ok: true, rules: data.rules };
  } catch (err: unknown) {
    // Fall back to cached rules
    const cached = getCachedRules();
    if (cached) {
      return { ok: true, rules: cached, cached: true };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: message };
  }
}
