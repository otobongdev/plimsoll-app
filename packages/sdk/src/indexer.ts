/** Typed client for the plimsoll-indexer HTTP API. */

/**
 * Where a figure came from. "event" means it was decoded from a contract
 * event, and tx_hash names the transaction that produced it. "chain" means the
 * indexer read it back from contract state to repair a gap in event ingestion,
 * and tx_hash is empty because the originating transaction is not recoverable.
 * Absent on an indexer older than this field; treat that as "event".
 */
export type IndexerSource = "event" | "chain";

export interface IndexerSupply {
  amount: string;
  ledger: number;
  posted_at: string;
  breakdown_hash: string;
  poster: string;
  tx_hash: string;
  source?: IndexerSource;
}

export interface IndexerReport {
  tier: "transcribed" | "issuer_signed" | "auditor_signed";
  amount: string;
  as_of: string;
  posted_at: string;
  reporter: string;
  doc_hash: string;
  doc_uri: string;
  tx_hash: string;
  source?: IndexerSource;
}

export interface IndexerCoverage {
  bps: number | null;
  ratio: string | null;
  tier: IndexerReport["tier"];
  supply: string;
  reserves: string;
  supply_ledger: number;
  supply_posted_at: string;
  report_as_of: string;
  report_age_seconds: number;
  supply_age_seconds: number;
  reporter: string;
  doc_uri: string;
}

export interface IndexerToml {
  home_domain: string;
  org_name?: string;
  org_url?: string;
  currency?: {
    code: string;
    issuer: string;
    name?: string;
    is_asset_anchored: boolean;
    anchor_asset?: string;
    attestation_of_reserve?: string;
    redemption_instructions?: string;
  };
}

export interface IndexerAsset {
  sac: string;
  code: string;
  issuer: string;
  listed_ledger: number;
  listed_at: string;
  toml: IndexerToml | null;
  toml_checked_at?: string;
  toml_error?: string;
  supply: IndexerSupply | null;
  reports: Partial<Record<IndexerReport["tier"], IndexerReport>>;
  coverage: IndexerCoverage | null;
}

export interface IndexerReporter {
  address: string;
  role: "auditor" | "transcriber" | "supply_poster";
  name: string;
  updated_at: string;
  /** XLM stake in stroops (optional; absent on older indexer versions). */
  stake?: string;
  /** Total reports submitted (optional). */
  reports?: number;
  /** Number of accepted disputes against this reporter (optional). */
  disputes?: number;
  /** Reputation score 0–100 (optional). */
  reputation?: number;
}

export interface IndexerNetwork {
  network_passphrase: string;
  rpc_url: string;
  horizon_url: string;
  coverage_ledger_id: string;
  reporter_registry_id: string;
}

export class IndexerError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "IndexerError";
  }
}

/** Per-request options. */
export interface RequestOptions {
  /** Cancels the request; the call rejects with an IndexerAbortError. */
  signal?: AbortSignal;
  /** Rejects with an IndexerAbortError after this many milliseconds. */
  timeoutMs?: number;
}

export interface IndexerHealth {
  status: string;
  [key: string]: unknown;
}

/** Thrown when a request is aborted by the caller or by a timeout. */
export class IndexerAbortError extends Error {
  constructor(
    readonly reason: "aborted" | "timeout",
    message: string,
  ) {
    super(message);
    this.name = "IndexerAbortError";
  }
}

export class IndexerClient {
  private readonly base: string;

  constructor(
    baseUrl: string,
    private readonly fetchImpl: typeof fetch = (...args) => fetch(...args),
    private readonly defaultTimeoutMs?: number,
  ) {
    this.base = baseUrl.replace(/\/+$/, "");
  }

  async listAssets(minTier = 1, opts?: RequestOptions): Promise<IndexerAsset[]> {
    const body = await this.get<{ assets: IndexerAsset[] }>(`/v1/assets?min_tier=${minTier}`, opts);
    return body.assets;
  }

  getAsset(sac: string, minTier = 1, opts?: RequestOptions): Promise<IndexerAsset> {
    return this.get(`/v1/assets/${encodeURIComponent(sac)}?min_tier=${minTier}`, opts);
  }

  async supplyHistory(sac: string, limit = 100, opts?: RequestOptions): Promise<IndexerSupply[]> {
    const body = await this.get<{ supply: IndexerSupply[] }>(
      `/v1/assets/${encodeURIComponent(sac)}/supply?limit=${limit}`,
      opts,
    );
    return body.supply;
  }

  async reportHistory(sac: string, limit = 100, opts?: RequestOptions): Promise<IndexerReport[]> {
    const body = await this.get<{ reports: IndexerReport[] }>(
      `/v1/assets/${encodeURIComponent(sac)}/reports?limit=${limit}`,
      opts,
    );
    return body.reports;
  }

  async reporters(opts?: RequestOptions): Promise<IndexerReporter[]> {
    const body = await this.get<{ reporters: IndexerReporter[] }>(`/v1/reporters`, opts);
    return body.reporters;
  }

  network(opts?: RequestOptions): Promise<IndexerNetwork> {
    return this.get(`/v1/network`, opts);
  }

  /** GET /healthz. */
  health(opts?: RequestOptions): Promise<IndexerHealth> {
    return this.get(`/healthz`, opts);
  }

  /** Raw breakdown bytes, exactly as hashed on-chain. */
  async breakdown(hash: string, opts?: RequestOptions): Promise<Uint8Array> {
    return this.request(opts, async (init) => {
      const res = await this.fetchImpl(
        `${this.base}/v1/breakdowns/${encodeURIComponent(hash)}`,
        init,
      );
      if (!res.ok) throw new IndexerError(res.status, `breakdown ${hash}: ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    });
  }

  private get<T>(path: string, opts?: RequestOptions): Promise<T> {
    return this.request(opts, async (init) => {
      const res = await this.fetchImpl(`${this.base}${path}`, {
        ...init,
        headers: { Accept: "application/json" },
      });
      if (!res.ok) {
        let message = `${res.status}`;
        try {
          const body = (await res.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // keep status as the message
        }
        throw new IndexerError(res.status, message);
      }
      return (await res.json()) as T;
    });
  }

  /** Runs one request under the caller signal and timeout; no timeout unless set. */
  private async request<T>(
    opts: RequestOptions | undefined,
    run: (init: RequestInit) => Promise<T>,
  ): Promise<T> {
    const timeoutMs = opts?.timeoutMs ?? this.defaultTimeoutMs;
    const external = opts?.signal;
    if (timeoutMs === undefined && !external) return run({});
    const ctl = new AbortController();
    let reason = "aborted" as "aborted" | "timeout";
    const onAbort = () => ctl.abort();
    if (external?.aborted) ctl.abort();
    external?.addEventListener("abort", onAbort);
    const timer =
      timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            reason = "timeout";
            ctl.abort();
          }, timeoutMs);
    try {
      if (ctl.signal.aborted) throw new IndexerAbortError("aborted", "request aborted");
      return await run({ signal: ctl.signal });
    } catch (err) {
      if (ctl.signal.aborted) {
        throw new IndexerAbortError(
          reason,
          reason === "timeout" ? `request timed out after ${timeoutMs}ms` : "request aborted",
        );
      }
      throw err;
    } finally {
      if (timer !== undefined) clearTimeout(timer);
      external?.removeEventListener("abort", onAbort);
    }
  }
}
