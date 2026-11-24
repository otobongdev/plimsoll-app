import { tierFromName, type IndexerReport } from "@plimsoll/sdk";

export interface DateRange {
  from: Date;
  to: Date;
}

/** How many days of history to show by default. */
const DEFAULT_DAYS = 90;

/**
 * Parses ?from=YYYY-MM-DD and ?to=YYYY-MM-DD from a URLSearchParams.
 * Falls back to the last DEFAULT_DAYS days on any parse error.
 */
export function parseDateRange(params: URLSearchParams): DateRange {
  const now = new Date();
  const defaultTo = new Date(now);
  const defaultFrom = new Date(now);
  defaultFrom.setDate(defaultFrom.getDate() - DEFAULT_DAYS);

  const ISO = /^\d{4}-\d{2}-\d{2}$/;
  const rawFrom = params.get("from");
  const rawTo = params.get("to");

  if (!rawFrom || !rawTo || !ISO.test(rawFrom) || !ISO.test(rawTo)) {
    return { from: defaultFrom, to: defaultTo };
  }

  const from = new Date(rawFrom + "T00:00:00Z");
  const to = new Date(rawTo + "T23:59:59Z");

  if (isNaN(from.getTime()) || isNaN(to.getTime()) || from > to) {
    return { from: defaultFrom, to: defaultTo };
  }

  return { from, to };
}

/** Formats a Date as YYYY-MM-DD in UTC. */
export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export interface HistoryRow {
  timestamp: number;
  bps: number | null;
  tier: string;
  reporter: string;
  docUri: string;
}

/** Converts IndexerReport list to HistoryRow list, computing bps from supply when available. */
export function toHistoryRows(
  reports: IndexerReport[],
  supply: bigint | null | undefined,
): HistoryRow[] {
  return reports.map((r) => {
    const amount = BigInt(r.amount);
    const bps = supply && supply > 0n ? Number((amount * 10_000n) / supply) : null;
    return {
      timestamp: Math.floor(new Date(r.as_of).getTime() / 1000),
      bps,
      tier: tierFromName(r.tier) !== undefined ? r.tier : r.tier,
      reporter: r.reporter,
      docUri: r.doc_uri,
    };
  });
}

/** Filters HistoryRows to only those whose timestamp falls within the range. */
export function filterByRange(rows: HistoryRow[], range: DateRange): HistoryRow[] {
  const fromSec = range.from.getTime() / 1000;
  const toSec = range.to.getTime() / 1000;
  return rows.filter((r) => r.timestamp >= fromSec && r.timestamp <= toSec);
}

/**
 * Builds a CSV string from HistoryRows.
 * Columns: timestamp,bps,tier,reporter,doc_uri
 */
export function buildCsv(rows: HistoryRow[]): string {
  const header = "timestamp,bps,tier,reporter,doc_uri";
  const lines = rows.map((r) => {
    const ts = new Date(r.timestamp * 1000).toISOString();
    const bps = r.bps !== null ? String(r.bps) : "";
    return [ts, bps, r.tier, r.reporter, r.docUri]
      .map((v) => (v.includes(",") || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v))
      .join(",");
  });
  return [header, ...lines].join("\n");
}

/** Triggers a browser file download for the given CSV text. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
