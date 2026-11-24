"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ago, bpsToPercent, tierLabel } from "@plimsoll/sdk";
import type { AssetView } from "@/lib/data";
import { Skeleton } from "@/components/ui";
import { loadAsset } from "@/lib/data";

export default function BadgePage() {
  return (
    <Suspense fallback={<Skeleton height={80} width="100%" />}>
      <BadgeDetail />
    </Suspense>
  );
}

function BadgeDetail() {
  const sac = useSearchParams().get("sac") ?? "";
  const [asset, setAsset] = useState<AssetView | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    if (!sac) return;
    loadAsset(sac)
      .then((a) => {
        setAsset(a);
        setNow(Math.floor(Date.now() / 1000));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : String(e)));
  }, [sac]);

  if (!sac) {
    return <p className="notice notice-info">No asset selected.</p>;
  }
  if (error) {
    return (
      <p className="notice notice-bad" role="alert">
        Could not load this asset: {error}
      </p>
    );
  }
  if (asset === undefined) {
    return <Skeleton height={80} width="100%" />;
  }
  if (asset === null) {
    return <p className="notice notice-info">This asset is not listed.</p>;
  }

  const c = asset.coverage;
  const ratio = c ? (bpsToPercent(c.bps) ?? "No supply") : "—";
  const tier = c ? tierLabel(c.tier) : "—";
  const age = c ? ago(now - c.reportAsOf) : "no report";

  return (
    <Link
      href={`/asset/?sac=${sac}`}
      className="badge-card"
      aria-label={`${asset.code} reserve coverage`}
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
    >
      <div
        className="card"
        style={{
          display: "grid",
          gap: 6,
          padding: 12,
          maxWidth: 260,
        }}
      >
        <div className="spread">
          <strong style={{ fontSize: "1.1rem" }}>{asset.code}</strong>
          <span className="pill pill-covered" style={{ fontSize: "0.72rem" }}>
            {ratio}
          </span>
        </div>
        <div className="sub" style={{ fontSize: "0.8rem" }}>
          {tier} · {age}
        </div>
        <div className="sub" style={{ fontSize: "0.72rem" }}>
          Plimsoll reserve coverage
        </div>
      </div>
    </Link>
  );
}
