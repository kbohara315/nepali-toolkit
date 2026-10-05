import type { APIRoute } from 'astro';
import { siteUrl } from '../lib/site-urls';
export const GET: APIRoute = ({ site }) => new Response(`User-agent: *\nAllow: /\nSitemap: ${siteUrl('sitemap-index.xml', site!, import.meta.env.BASE_URL)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
