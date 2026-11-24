import { describe, expect, it, vi } from "vitest";
import { IndexerAbortError, IndexerClient } from "../src/index";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** A fetch that never answers but honours the abort signal. */
const hanging: typeof fetch = (_url, init) =>
  new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () =>
      reject(new DOMException("aborted", "AbortError")),
    );
  });

describe("IndexerClient options", () => {
  it("health() calls /healthz", async () => {
    const f = vi.fn(async () => json({ status: "ok" }));
    const c = new IndexerClient("http://x/", f as unknown as typeof fetch);
    await expect(c.health()).resolves.toEqual({ status: "ok" });
    expect((f.mock.calls[0] as unknown[])[0]).toBe("http://x/healthz");
  });

  it("sets no signal by default", async () => {
    const f = vi.fn(async () => json({ reporters: [] }));
    const c = new IndexerClient("http://x", f as unknown as typeof fetch);
    await c.reporters();
    expect((f.mock.calls[0] as unknown as [unknown, RequestInit?])[1]?.signal).toBeUndefined();
  });

  it("rejects with IndexerAbortError when aborted", async () => {
    const c = new IndexerClient("http://x", hanging);
    const ctl = new AbortController();
    const p = c.network({ signal: ctl.signal });
    ctl.abort();
    const err = await p.catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IndexerAbortError);
    expect((err as IndexerAbortError).reason).toBe("aborted");
  });

  it("rejects when already aborted", async () => {
    const c = new IndexerClient("http://x", hanging);
    const err = await c.health({ signal: AbortSignal.abort() }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(IndexerAbortError);
  });

  it("per-request timeout", async () => {
    const c = new IndexerClient("http://x", hanging);
    const err = await c.listAssets(1, { timeoutMs: 10 }).catch((e: unknown) => e);
    expect((err as IndexerAbortError).reason).toBe("timeout");
  });

  it("constructor default timeout, overridable per request", async () => {
    const c = new IndexerClient("http://x", hanging, 10);
    const err = await c.getAsset("C1").catch((e: unknown) => e);
    expect((err as IndexerAbortError).reason).toBe("timeout");
    const f = vi.fn(async () => json({ status: "ok" }));
    const c2 = new IndexerClient("http://x", f as unknown as typeof fetch, 10);
    await expect(c2.health({ timeoutMs: 1000 })).resolves.toEqual({ status: "ok" });
  });

  it("leaves other errors unchanged", async () => {
    const f = async () => json({ error: "nope" }, 404);
    const c = new IndexerClient("http://x", f as unknown as typeof fetch, 1000);
    await expect(c.network()).rejects.toMatchObject({ name: "IndexerError", status: 404 });
  });
});

describe("IndexerClient webhook methods", () => {
  const WEBHOOK = {
    id: "wh1",
    url: "https://example.com/hook",
    threshold_bps: 10000,
    sac: null,
    created_at: "2026-01-01T00:00:00Z",
  };

  it("registerWebhook POSTs to /v1/webhooks and returns the webhook", async () => {
    const f = vi.fn(async () => json(WEBHOOK));
    const c = new IndexerClient("http://x", f as unknown as typeof fetch);
    const result = await c.registerWebhook({
      url: "https://example.com/hook",
      threshold_bps: 10000,
    });
    expect(result).toEqual(WEBHOOK);
    const call = f.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe("http://x/v1/webhooks");
    expect(call[1]?.method).toBe("POST");
    expect(JSON.parse(call[1]?.body as string)).toMatchObject({
      url: "https://example.com/hook",
      threshold_bps: 10000,
    });
  });

  it("listWebhooks GETs /v1/webhooks and returns the array", async () => {
    const f = vi.fn(async () => json({ webhooks: [WEBHOOK] }));
    const c = new IndexerClient("http://x", f as unknown as typeof fetch);
    const result = await c.listWebhooks();
    expect(result).toEqual([WEBHOOK]);
    expect((f.mock.calls[0] as [string])[0]).toBe("http://x/v1/webhooks");
  });

  it("deleteWebhook DELETEs /v1/webhooks/:id", async () => {
    const f = vi.fn(async () => new Response(null, { status: 204 }));
    const c = new IndexerClient("http://x", f as unknown as typeof fetch);
    await c.deleteWebhook("wh1");
    const call = f.mock.calls[0] as [string, RequestInit];
    expect(call[0]).toBe("http://x/v1/webhooks/wh1");
    expect(call[1]?.method).toBe("DELETE");
  });

  it("deleteWebhook throws IndexerError on non-ok response", async () => {
    const f = async () => json({ error: "not found" }, 404);
    const c = new IndexerClient("http://x", f as unknown as typeof fetch);
    await expect(c.deleteWebhook("bad")).rejects.toMatchObject({
      name: "IndexerError",
      status: 404,
    });
  });
});
