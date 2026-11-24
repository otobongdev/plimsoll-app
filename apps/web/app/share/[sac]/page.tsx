import type { Metadata } from "next";
import { ShareContent } from "./ShareContent";

interface Props {
  params: Promise<{ sac: string }>;
}

// Static export requires generateStaticParams. We cannot enumerate all SACs at
// build time, so we export an empty array and rely on the client to load data.
// The page is rendered as a shell and hydrated in the browser.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { sac } = await params;
  const decoded = decodeURIComponent(sac);
  // Code is the part before the colon in a Stellar asset SAC like "USDC:G..."
  // For contract SACs the code is not known at build time; fall back to a truncation.
  const colonIdx = decoded.indexOf(":");
  const code = colonIdx > 0 ? decoded.slice(0, colonIdx) : decoded.slice(0, 8);

  return {
    title: `${code} coverage snapshot`,
    description: `Live Plimsoll reserve coverage snapshot for ${code} on Stellar. See the reserves-to-supply ratio, the report tier, and when the data was last updated.`,
    openGraph: {
      title: `${code} · Plimsoll coverage`,
      description: `Check ${code}'s reserve coverage on Stellar — reserves vs. circulating supply, verified on-chain.`,
      type: "website",
    },
    twitter: {
      card: "summary",
      title: `${code} · Plimsoll coverage`,
      description: `Check ${code}'s reserve coverage on Stellar.`,
    },
    alternates: {
      canonical: `/share/${sac}/`,
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { sac } = await params;
  return <ShareContent sac={decodeURIComponent(sac)} />;
}
