import type { MetadataRoute } from "next";
import { PUBLIC_ROUTES, publicUrl } from "@/lib/site";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return PUBLIC_ROUTES.map((route) => ({
    url: publicUrl(route),
    changeFrequency: "weekly",
    priority: route === "/" ? 1 : 0.6,
  }));
}
