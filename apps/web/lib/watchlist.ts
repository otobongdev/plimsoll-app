const STORAGE_KEY = "plimsoll:watchlist";

export interface WatchEntry {
  sac: string;
  code: string;
  thresholdBps: number;
  addedAt: number;
}

function load(): WatchEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as WatchEntry[]) : [];
  } catch {
    return [];
  }
}

function save(entries: WatchEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // quota exceeded or SSR — silently ignore
  }
}

export function listWatched(): WatchEntry[] {
  return load();
}

export function isWatching(sac: string): boolean {
  return load().some((e) => e.sac === sac);
}

export function addWatch(entry: Omit<WatchEntry, "addedAt">): void {
  const entries = load().filter((e) => e.sac !== entry.sac);
  entries.push({ ...entry, addedAt: Date.now() });
  save(entries);
}

export function removeWatch(sac: string): void {
  save(load().filter((e) => e.sac !== sac));
}

export function notifyIfUnder(
  sac: string,
  code: string,
  bps: number,
  status: "covered" | "under" | "stale" | "unknown",
): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  if (status !== "under") return;
  const entry = load().find((e) => e.sac === sac);
  if (!entry) return;
  if (bps >= entry.thresholdBps) return;
  new Notification(`${code} reserve coverage dropped`, {
    body: `Coverage is now ${(bps / 100).toFixed(2)}%, below your ${(entry.thresholdBps / 100).toFixed(2)}% threshold.`,
    tag: `plimsoll:under:${sac}`,
  });
}

export function notificationPermission(): "granted" | "denied" | "default" | "unavailable" {
  if (typeof Notification === "undefined") return "unavailable";
  return Notification.permission;
}
