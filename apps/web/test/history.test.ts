import { describe, expect, it } from "vitest";
import { buildCsv, filterByRange, parseDateRange, toHistoryRows, toISODate } from "../lib/history";
import type { IndexerReport } from "@plimsoll/sdk";

const makeReport = (overrides: Partial<IndexerReport> = {}): IndexerReport => ({
  tier: "transcribed",
  amount: "10000",
  as_of: "2026-06-01T00:00:00Z",
  posted_at: "2026-06-01T00:00:00Z",
  reporter: "GREPORTER1234567890123456789012345678901234567",
  doc_hash: "deadbeef",
  doc_uri: "https://example.com/doc.pdf",
  tx_hash: "txhash",
  ...overrides,
});

describe("parseDateRange", () => {
  it("returns default range on empty params", () => {
    const p = new URLSearchParams();
    const r = parseDateRange(p);
    expect(r.from < r.to).toBe(true);
    // roughly 90 days
    const days = (r.to.getTime() - r.from.getTime()) / 86400_000;
    expect(days).toBeGreaterThanOrEqual(89);
    expect(days).toBeLessThanOrEqual(91);
  });

  it("parses valid from/to params", () => {
    const p = new URLSearchParams("from=2026-01-01&to=2026-03-31");
    const r = parseDateRange(p);
    expect(toISODate(r.from)).toBe("2026-01-01");
    expect(toISODate(r.to)).toBe("2026-03-31");
  });

  it("falls back to default on invalid date strings", () => {
    const p1 = new URLSearchParams("from=not-a-date&to=2026-03-31");
    const r1 = parseDateRange(p1);
    expect(toISODate(r1.to)).not.toBe("2026-03-31");

    const p2 = new URLSearchParams("from=2026-03-31&to=2026-01-01");
    const r2 = parseDateRange(p2);
    // from > to should fall back
    expect(r2.from < r2.to).toBe(true);
  });

  it("falls back when only one param is present", () => {
    const p = new URLSearchParams("from=2026-01-01");
    const r = parseDateRange(p);
    // falls back; default range
    const days = (r.to.getTime() - r.from.getTime()) / 86400_000;
    expect(days).toBeGreaterThanOrEqual(89);
  });
});

describe("toHistoryRows", () => {
  it("computes bps from supply", () => {
    const rows = toHistoryRows([makeReport({ amount: "5000" })], 10_000n);
    expect(rows[0]?.bps).toBe(5000);
  });

  it("returns null bps when supply is null", () => {
    const rows = toHistoryRows([makeReport()], null);
    expect(rows[0]?.bps).toBeNull();
  });

  it("returns null bps when supply is zero", () => {
    const rows = toHistoryRows([makeReport()], 0n);
    expect(rows[0]?.bps).toBeNull();
  });

  it("maps timestamp from as_of", () => {
    const rows = toHistoryRows([makeReport({ as_of: "2026-06-15T12:00:00Z" })], null);
    expect(rows[0]?.timestamp).toBe(Math.floor(new Date("2026-06-15T12:00:00Z").getTime() / 1000));
  });
});

describe("filterByRange", () => {
  const rows = [
    { timestamp: 1_700_000_000, bps: 10000, tier: "transcribed", reporter: "G1", docUri: "" },
    { timestamp: 1_750_000_000, bps: 9000, tier: "transcribed", reporter: "G2", docUri: "" },
    { timestamp: 1_800_000_000, bps: 8000, tier: "transcribed", reporter: "G3", docUri: "" },
  ];

  it("keeps rows within range", () => {
    const range = {
      from: new Date(1_700_000_000 * 1000),
      to: new Date(1_750_000_000 * 1000),
    };
    expect(filterByRange(rows, range)).toHaveLength(2);
  });

  it("returns empty when range excludes all rows", () => {
    const range = {
      from: new Date(1_900_000_000 * 1000),
      to: new Date(2_000_000_000 * 1000),
    };
    expect(filterByRange(rows, range)).toHaveLength(0);
  });
});

describe("buildCsv", () => {
  it("produces correct header and rows", () => {
    const rows = [
      {
        timestamp: Math.floor(new Date("2026-06-01T00:00:00Z").getTime() / 1000),
        bps: 10000,
        tier: "transcribed",
        reporter: "GREPORTER",
        docUri: "https://x.com/d.pdf",
      },
    ];
    const csv = buildCsv(rows);
    expect(csv).toContain("timestamp,bps,tier,reporter,doc_uri");
    expect(csv).toContain("10000");
    expect(csv).toContain("transcribed");
    expect(csv).toContain("GREPORTER");
    expect(csv).toContain("https://x.com/d.pdf");
  });

  it("produces empty-string bps for null", () => {
    const rows = [
      {
        timestamp: 1_000_000,
        bps: null,
        tier: "transcribed",
        reporter: "G",
        docUri: "",
      },
    ];
    const csv = buildCsv(rows);
    const dataLine = csv.split("\n")[1] ?? "";
    // second field should be empty
    expect(dataLine.split(",")[1]).toBe("");
  });

  it("escapes fields containing commas", () => {
    const rows = [
      {
        timestamp: 1_000_000,
        bps: 100,
        tier: "transcribed",
        reporter: "G",
        docUri: "https://x.com/a,b",
      },
    ];
    const csv = buildCsv(rows);
    expect(csv).toContain('"https://x.com/a,b"');
  });
});
