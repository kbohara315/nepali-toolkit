import type { APIRoute } from 'astro';
import { loadLlmDocs } from '../lib/llms-docs';
import { llmsFullText } from '../lib/llms';

export const prerender = true;
export const GET: APIRoute = async ({ site }) => new Response(
  llmsFullText(await loadLlmDocs(), site!, import.meta.env.BASE_URL),
  { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
);
