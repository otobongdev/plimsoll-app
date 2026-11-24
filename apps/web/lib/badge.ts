/** Origin and base path are optional so the helpers stay pure and testable. */

const DEFAULT_WIDTH = 280;
const DEFAULT_HEIGHT = 96;

export interface BadgeUrlOptions {
  origin?: string;
  basePath?: string;
}

export interface EmbedOptions extends BadgeUrlOptions {
  width?: number;
  height?: number;
  title?: string;
}

function normalizeUrlArgs(
  originOrOptions?: string | BadgeUrlOptions,
  basePath?: string,
): { origin: string; basePath: string } {
  if (typeof originOrOptions === "string") {
    return { origin: originOrOptions, basePath: basePath ?? "" };
  }
  return {
    origin: originOrOptions?.origin ?? "",
    basePath: originOrOptions?.basePath ?? basePath ?? "",
  };
}

export function badgeUrl(
  sac: string,
  originOrOptions?: string | BadgeUrlOptions,
  basePath?: string,
): string {
  const { origin, basePath: base } = normalizeUrlArgs(originOrOptions, basePath);
  const trimmedBase = base.replace(/\/+$/, "");
  return `${origin}${trimmedBase}/badge/?sac=${encodeURIComponent(sac)}`;
}

export function buildBadgeUrl(...args: Parameters<typeof badgeUrl>): string {
  return badgeUrl(...args);
}

export function getBadgeUrl(...args: Parameters<typeof badgeUrl>): string {
  return badgeUrl(...args);
}

function normalizeEmbedArgs(
  originOrOptions?: string | EmbedOptions,
  basePath?: string,
  extra?: Partial<EmbedOptions>,
): EmbedOptions {
  if (typeof originOrOptions === "string") {
    return {
      origin: originOrOptions,
      basePath: basePath ?? extra?.basePath ?? "",
      width: extra?.width,
      height: extra?.height,
      title: extra?.title,
    };
  }
  return {
    origin: originOrOptions?.origin ?? extra?.origin,
    basePath: originOrOptions?.basePath ?? basePath ?? extra?.basePath,
    width: originOrOptions?.width ?? extra?.width,
    height: originOrOptions?.height ?? extra?.height,
    title: originOrOptions?.title ?? extra?.title,
  };
}

export function embedCode(
  sac: string,
  originOrOptions?: string | EmbedOptions,
  basePath?: string,
  extra?: Partial<EmbedOptions>,
): string {
  const opts = normalizeEmbedArgs(originOrOptions, basePath, extra);
  const src = badgeUrl(sac, opts);
  const width = opts.width ?? DEFAULT_WIDTH;
  const height = opts.height ?? DEFAULT_HEIGHT;
  const title = opts.title ?? "Plimsoll reserve coverage";
  return `<iframe src="${src}" width="${width}" height="${height}" title="${title}" loading="lazy" style="border:0"></iframe>`;
}

export function embedSnippet(...args: Parameters<typeof embedCode>): string {
  return embedCode(...args);
}

export function badgeSnippet(...args: Parameters<typeof embedCode>): string {
  return embedCode(...args);
}

export function badgeEmbed(...args: Parameters<typeof embedCode>): string {
  return embedCode(...args);
}

export function iframeSnippet(...args: Parameters<typeof embedCode>): string {
  return embedCode(...args);
}

export function badgeIframe(...args: Parameters<typeof embedCode>): string {
  return embedCode(...args);
}

export function badgeUrlWith(sac: string, origin = "", basePath = ""): string {
  return badgeUrl(sac, { origin, basePath });
}

export function embedCodeWith(sac: string, origin = "", basePath = ""): string {
  return embedCode(sac, { origin, basePath });
}
