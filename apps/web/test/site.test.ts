import { afterEach, describe, expect, it, vi } from "vitest";
import robots from "../app/robots";
import sitemap from "../app/sitemap";
import { config } from "../lib/config";
import { siteMetadata } from "../lib/metadata";
import { PUBLIC_ROUTES, SITE_DESCRIPTION, SITE_TITLE, publicUrl, siteOrigin } from "../lib/site";

const BASE = config.basePath;

afterEach(() => {
  config.basePath = BASE;
  vi.unstubAllEnvs();
});

describe("publicUrl", () => {
  it("uses the documented Pages mirror by default", () => {
    expect(siteOrigin()).toBe("https://plimsoll-protocol.github.io");
    expect(publicUrl("/")).toBe("https://plimsoll-protocol.github.io/");
  });

  it("adds the base path to routes and static assets", () => {
    config.basePath = "/plimsoll-app";
    expect(publicUrl("/")).toBe("https://plimsoll-protocol.github.io/plimsoll-app/");
    expect(publicUrl("/integrate/")).toBe(
      "https://plimsoll-protocol.github.io/plimsoll-app/integrate/",
    );
    expect(publicUrl("og.png")).toBe("https://plimsoll-protocol.github.io/plimsoll-app/og.png");
  });

  it("honours a custom site URL without doubling slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://plimsoll.example/");
    expect(siteOrigin()).toBe("https://plimsoll.example");
    config.basePath = "/plimsoll-app/";
    expect(publicUrl("/about/")).toBe("https://plimsoll.example/plimsoll-app/about/");
  });
});

describe("site metadata", () => {
  it("keeps the title template and shares title, description and image with social cards", () => {
    config.basePath = "/plimsoll-app";
    const meta = siteMetadata();
    expect(meta.title).toEqual({ default: SITE_TITLE, template: "%s · Plimsoll" });
    expect(meta.openGraph).toMatchObject({
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    });
    expect(meta.twitter).toMatchObject({
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    });
    const image = "https://plimsoll-protocol.github.io/plimsoll-app/og.png";
    expect(meta.openGraph).toMatchObject({ images: [{ url: image, width: 1200, height: 630 }] });
    expect(meta.twitter?.images).toEqual([image]);
  });
});

describe("metadata routes", () => {
  it("points robots at a sitemap inside the base path", () => {
    config.basePath = "/plimsoll-app";
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/" },
      sitemap: "https://plimsoll-protocol.github.io/plimsoll-app/sitemap.xml",
    });
  });

  it("lists every static route as an absolute URL", () => {
    config.basePath = "/plimsoll-app";
    const entries = sitemap();
    expect(entries.map((entry) => entry.url)).toEqual(
      PUBLIC_ROUTES.map((route) => `https://plimsoll-protocol.github.io/plimsoll-app${route}`),
    );
    expect(entries[0]?.priority).toBe(1);
  });
});
