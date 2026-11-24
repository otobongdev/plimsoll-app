import { TESTNET, sacAddress } from "@plimsoll/sdk";
import { describe, expect, it } from "vitest";
import { assetFromSearch } from "../lib/asset-query";

const pusd = TESTNET.assets.PUSD;
if (!pusd) throw new Error("Missing test fixture");

const passphrase = TESTNET.networkPassphrase;

describe("assetFromSearch", () => {
  it("accepts the existing sac query form", () => {
    expect(assetFromSearch(`?sac=${pusd.sac}`, passphrase)).toEqual({ ok: true, sac: pusd.sac });
  });

  it("derives the same SAC from CODE:ISSUER", () => {
    const result = assetFromSearch(`?asset=${pusd.code}:${pusd.issuer}`, passphrase);
    expect(result).toEqual({ ok: true, sac: pusd.sac });
    expect(pusd.sac).toBe(sacAddress(pusd.code, pusd.issuer, passphrase));
  });

  it("accepts surrounding whitespace and URL-encoded separators", () => {
    const encoded = new URLSearchParams({ asset: ` ${pusd.code}:${pusd.issuer} ` });
    expect(assetFromSearch(`?${encoded}`, passphrase)).toEqual({ ok: true, sac: pusd.sac });
  });

  it("prefers sac when both forms are present", () => {
    expect(assetFromSearch(`?sac=${pusd.sac}&asset=BAD:x`, passphrase)).toEqual({
      ok: true,
      sac: pusd.sac,
    });
  });

  it("explains malformed links without calling a contract", () => {
    const bad = (value: string) => assetFromSearch(`?${value}`, passphrase);
    expect(bad("asset=PUSD")).toMatchObject({
      ok: false,
      error: expect.stringContaining("CODE:ISSUER"),
    });
    expect(bad(`asset=TOO-LONG-CODE:${pusd.issuer}`)).toMatchObject({
      ok: false,
      error: expect.stringContaining("1 to 12"),
    });
    expect(bad("asset=PUSD:nope")).toMatchObject({
      ok: false,
      error: expect.stringContaining("valid Stellar account"),
    });
    expect(bad("sac=nope")).toMatchObject({
      ok: false,
      error: expect.stringContaining("contract address"),
    });
    expect(bad("asset=PUSD:G1:G2")).toMatchObject({
      ok: false,
      error: expect.stringContaining("CODE:ISSUER"),
    });
  });

  it("treats an empty query as a missing selection", () => {
    expect(assetFromSearch("", passphrase)).toMatchObject({ ok: false, missing: true });
  });
});
