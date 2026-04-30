export const verifiedToolIds = ["base64", "diff", "json", "sanitizer"] as const;

const verifiedToolIdSet = new Set<string>(verifiedToolIds);

export function isToolVerified(toolId: string): boolean {
  return verifiedToolIdSet.has(toolId);
}

export function isToolHrefVerified(href: string): boolean {
  const normalizedHref = href.replace(/\/+$/, "");
  const match = normalizedHref.match(/^\/tools\/([^/?#]+)/);
  if (!match) {
    return false;
  }

  return isToolVerified(match[1]);
}
