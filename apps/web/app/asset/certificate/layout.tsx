import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coverage Certificate",
  description:
    "Printable reserve-coverage certificate for a Stellar-issued asset, sourced from on-chain Plimsoll data.",
  openGraph: {
    title: "Reserve Coverage Certificate · Plimsoll",
    description:
      "On-chain reserve coverage certificate: ratio, tier, auditor signature hash, and as-of date.",
    type: "article",
  },
  twitter: {
    card: "summary",
    title: "Reserve Coverage Certificate · Plimsoll",
    description: "On-chain reserve coverage: ratio, tier, and auditor signature hash.",
  },
};

export default function CertificateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
