import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { CopyButton, copyAnnouncement, copyToClipboard } from "../components/ui";

const FULL_HASH = "d1f4a1c7b3e9a5d2f8c6b0e4a7d9f1c3b5e7a9d2f4c6b8e0a1d3f5c7b9e2d4a6";

describe("copyToClipboard", () => {
  it("writes the full value, not a shortened display form", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    await expect(copyToClipboard(FULL_HASH, { writeText })).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledExactlyOnceWith(FULL_HASH);
  });

  it("reports failure when the clipboard rejects", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    await expect(copyToClipboard(FULL_HASH, { writeText })).resolves.toBe(false);
  });

  it("reports failure when there is no clipboard", async () => {
    await expect(copyToClipboard(FULL_HASH, undefined)).resolves.toBe(false);
  });
});

describe("copyAnnouncement", () => {
  it("announces success and failure plainly", () => {
    expect(copyAnnouncement(true)).toBe("Copied");
    expect(copyAnnouncement(false)).toBe("Could not copy");
  });
});

describe("CopyButton", () => {
  it("is a keyboard-operable button with a live region", () => {
    const html = renderToStaticMarkup(
      createElement(CopyButton, { value: FULL_HASH, label: "document hash" }),
    );
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Copy document hash"');
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Copy</button>");
  });

  it("can be disabled when there is nothing to copy", () => {
    const html = renderToStaticMarkup(
      createElement(CopyButton, { value: "", label: "document hash", disabled: true }),
    );
    expect(html).toContain('disabled=""');
  });
});
