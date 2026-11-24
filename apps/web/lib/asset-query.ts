import { sacAddress } from "@plimsoll/sdk";
import { StrKey } from "@stellar/stellar-sdk";
import { validateAsset } from "./watch";

export type AssetQuery = { ok: true; sac: string } | { ok: false; error: string; missing: boolean };

/**
 * Reads either /asset/?sac=C... or /asset/?asset=CODE:ISSUER. Validation
 * happens here so a bad link never reaches a contract call.
 */
export function assetFromSearch(search: string, networkPassphrase: string): AssetQuery {
  const params = new URLSearchParams(search);
  const sac = params.get("sac")?.trim() ?? "";
  if (sac) {
    if (!StrKey.isValidContract(sac)) {
      return {
        ok: false,
        error: "The sac parameter must be a valid Stellar contract address (starts with C).",
        missing: false,
      };
    }
    return { ok: true, sac };
  }

  const asset = params.get("asset")?.trim() ?? "";
  if (!asset) {
    return {
      ok: false,
      error: "No asset selected. Choose one from the dashboard.",
      missing: true,
    };
  }
  const separator = asset.indexOf(":");
  if (separator < 0 || asset.indexOf(":", separator + 1) >= 0) {
    return {
      ok: false,
      error: "The asset parameter must be CODE:ISSUER, for example PUSD:G....",
      missing: false,
    };
  }
  const code = asset.slice(0, separator);
  const issuer = asset.slice(separator + 1);
  const checked = validateAsset(code, issuer);
  if (!checked.ok) {
    return { ok: false, error: checked.error, missing: false };
  }
  return { ok: true, sac: sacAddress(code, issuer, networkPassphrase) };
}
