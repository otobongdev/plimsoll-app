import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ErrorPage from "../app/error";
import NotFound from "../app/not-found";

describe("fallback pages", () => {
  it("gives an unknown route a heading and a dashboard link", () => {
    const html = renderToStaticMarkup(createElement(NotFound));
    expect(html).toContain("<h1");
    expect(html).toContain("Page not found");
    expect(html).toContain('href="/"');
    expect(html).not.toContain('href="/plimsoll-app/"');
  });

  it("gives a render error a heading, retry and dashboard link", () => {
    const html = renderToStaticMarkup(
      createElement(ErrorPage, { error: new Error("boom"), reset: () => undefined }),
    );
    expect(html).toContain("<h1");
    expect(html).toContain("This page could not be displayed");
    expect(html).toContain("Try again");
    expect(html).toContain('href="/"');
  });

  it("shows the error reference when the framework supplies one", () => {
    const error = Object.assign(new Error("boom"), { digest: "abc123" });
    const html = renderToStaticMarkup(createElement(ErrorPage, { error, reset: () => undefined }));
    expect(html).toContain("Reference: abc123");
    expect(html).not.toContain("boom");
  });
});
