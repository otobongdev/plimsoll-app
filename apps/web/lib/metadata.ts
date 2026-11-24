import type { Metadata } from "next";
import { SITE_DESCRIPTION, SITE_TITLE, publicUrl } from "./site";

export function siteMetadata(): Metadata {
  const socialImage = {
    url: publicUrl("og.png"),
    width: 1200,
    height: 630,
    alt: SITE_TITLE,
  };
  return {
    metadataBase: new URL(publicUrl("/")),
    title: { default: SITE_TITLE, template: "%s · Plimsoll" },
    description: SITE_DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: "Plimsoll",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      url: publicUrl("/"),
      locale: "en_GB",
      images: [socialImage],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
      images: [socialImage.url],
    },
  };
}
