# ADR 0001: Indexer vs. pure-RPC data layer

**Status:** Accepted  
**Date:** 2026-09-01

## Context

The Plimsoll app needs to display reserve-coverage data for Stellar-issued
assets. Two approaches were considered:

1. **Pure-RPC**: Read every data point directly from the Soroban contracts over
   the Stellar RPC endpoint at page-load time.
2. **Indexer**: Run a separate `plimsoll-indexer` service that follows the
   ledger, decodes contract events, and exposes a REST API over indexed data.

Pure-RPC is simpler operationally — there is no extra service to run — but it
has significant drawbacks:

- Supply history and report history require replaying ledger events, which the
  Stellar RPC only retains for a rolling window (currently 7 days on testnet).
- Each page load issues several RPC calls in serial; latency is proportional to
  the number of queries.
- Off-chain metadata (issuer TOML, reporter names) is not on-chain at all.

## Decision

We use the **indexer** as the primary data source, with a **chain fallback**
for the current coverage reading when the indexer is unavailable or returns no
data.

The SDK's `IndexerClient` talks to the indexer API. `PlimsollContracts` talks
to the Soroban RPC. `loadAsset` in `apps/web/lib/data.ts` tries the indexer
first; if that times out or returns null it falls back to `loadFromChain`.

## Consequences

- Full supply and report history is available indefinitely (not capped by the
  RPC event window).
- Average page-load data latency is lower because the indexer returns
  pre-aggregated JSON in a single HTTP call.
- An additional infrastructure component must be deployed and kept in sync. The
  indexer has its own repository (`plimsoll-indexer`) and release cycle.
- The chain fallback ensures the app keeps working during indexer downtime,
  although history pages will be empty.
