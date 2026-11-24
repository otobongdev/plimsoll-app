# ADR 0003: SDK-first vs. inline contract calls

**Status:** Accepted  
**Date:** 2026-09-01

## Context

The web app needs to call Soroban contracts (coverage ledger, reporter
registry, covered vault) and the indexer REST API. Two approaches were
considered:

1. **Inline calls**: Import `@stellar/stellar-sdk` directly in each page
   component and wire up contracts ad hoc.
2. **SDK-first**: Extract all contract and indexer wiring into a separate
   `@plimsoll/sdk` package that the web app imports as a dependency.

The Plimsoll protocol is meant for third-party developers to integrate (vaults,
lending protocols, DEX aggregators). Those integrators need a supported,
versioned library rather than copy-pasting code from the app's internals.

## Decision

We maintain a **dedicated `packages/sdk` package** (`@plimsoll/sdk`) that
exports:

- `PlimsollContracts` — typed wrappers around the Soroban contracts.
- `IndexerClient` — typed HTTP client for the plimsoll-indexer REST API.
- Error enums (`LedgerError`, `RegistryError`, `VaultError`) and helpers
  (`describeError`, `parseContractErrorCode`).
- Utility functions (`tierLabel`, `bpsToPercent`, `formatUnits`, `ago`, …).

The web app (`@plimsoll/web`) imports only from `@plimsoll/sdk` and its own
local modules; it does not import `@stellar/stellar-sdk` directly.

The SDK is built to ESM (`dist/`) before the web app build, and the two
packages are linked via npm workspaces.

## Consequences

- Third parties can `npm install @plimsoll/sdk` once it is published and get
  the same typed helpers the app uses.
- The SDK has its own test suite (`packages/sdk/test/`), TypeScript config, and
  build step.
- Changes to contract ABIs must be reflected in the SDK before the web app can
  use them; this adds a small coordination overhead.
- The web app build in CI always rebuilds the SDK first (`npm run build -w
  @plimsoll/sdk`), so the app always sees the latest types.
