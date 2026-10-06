import { getCollection } from 'astro:content';
import type { LlmDoc } from './llms';

/** Collection metadata and original MDX, without rendered Starlight chrome. */
const sources = import.meta.glob<string>('../content/docs/**/*.mdx', {
  query: '?raw', import: 'default', eager: true,
});

export async function loadLlmDocs(): Promise<LlmDoc[]> {
  const docs = await getCollection('docs', (doc) => doc.id !== '404');
  return docs.map((doc) => {
    const path = `../content/docs/${doc.id === 'docs' ? 'docs/index' : doc.id}.mdx`;
    const body = sources[path];
    if (body === undefined) throw new Error(`Missing AI docs source: ${doc.id}`);
    return { id: doc.id, title: doc.data.title, description: doc.data.description ?? '', body };
  });
}
