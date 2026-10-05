/** site may already contain the Pages prefix; use its origin exactly once. */
export function siteUrl(path: string, site: URL | string, base: string): string {
  const prefix = `/${base.replace(/^\/+|\/+$/g, '')}`.replace(/\/$/, '');
  const clean = `/${path.replace(/^\/+/, '')}`;
  const pathname = prefix && (clean === prefix || clean.startsWith(`${prefix}/`)) ? clean : `${prefix}${clean}`;
  return new URL(pathname, new URL(site).origin).href;
}
