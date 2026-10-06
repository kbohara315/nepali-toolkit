import { siteUrl } from './site-urls.ts';

/** Navigation order only: titles, descriptions, and API text come from the docs. */
export const docGroups = [
  { title: 'Start here', ids: ['docs', 'docs/getting-started'] },
  { title: 'Task guides', ids: [
    'docs/guides/dates-and-calendars', 'docs/guides/exact-money-and-words',
    'docs/guides/phone-validation', 'docs/guides/land-conversions',
    'docs/guides/nepali-sorting-and-search', 'docs/guides/administrative-data',
    'docs/guides/errors-and-input', 'docs/guides/imports-and-bundling',
  ] },
  { title: 'API reference', ids: [
    'docs/reference/date', 'docs/reference/number', 'docs/reference/currency',
    'docs/reference/land', 'docs/reference/words', 'docs/reference/collation',
    'docs/reference/phone', 'docs/reference/admin',
  ] },
  { title: 'Project', ids: [
    'docs/project/compatibility', 'docs/project/data-sources', 'docs/project/releases',
  ] },
] as const;

export interface LlmDoc {
  id: string;
  title: string;
  description: string;
  body: string;
}

export function orderedDocs(docs: LlmDoc[]): LlmDoc[] {
  const published = docs.filter((doc) => doc.id !== '404');
  const ids: string[] = docGroups.flatMap((group) => [...group.ids]);
  if (new Set(published.map((doc) => doc.id)).size !== published.length ||
      published.length !== ids.length || published.some((doc) => !ids.includes(doc.id))) {
    throw new Error('AI docs inventory must match all published documentation pages');
  }
  return ids.map((id) => {
    const doc = published.find((entry) => entry.id === id);
    if (!doc?.title || !doc.description) throw new Error(`Missing AI docs metadata: ${id}`);
    return doc;
  });
}

/** Resolve against the published trailing-slash route, never the MDX file path. */
export function markdownForDoc(source: string, id: string, site: URL | string, base: string): string {
  const body = source
    .replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '')
    .replace(/^[ \t]*import HairlineFigure from '[^']+';[ \t]*$/gm, '')
    .replace(/<HairlineFigure\b([\s\S]*?)\/>/g, (_match, rawAttributes: string) => {
      const attributes = Object.fromEntries(
        [...rawAttributes.matchAll(/([\w]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]),
      );
      const links = [
        ['guideHref', 'guideLabel'],
        ['referenceHref', 'referenceLabel'],
      ]
        .filter(([href, label]) => attributes[href] && attributes[label])
        .map(([href, label]) => `[${attributes[label]}](${attributes[href]})`);
      const title = attributes.title ? `**${attributes.title}.** ` : '**Interactive figure.** ';
      const description = attributes.description ?? '';
      return `${title}${description}${links.length ? ` ${links.join(' · ')}` : ''}`;
    })
    .trim();
  const page = siteUrl(`${id}/`, site, base);
  const absolute = (href: string) => {
    if (/^[a-z][a-z\d+.-]*:/i.test(href) || href.startsWith('//')) return href;
    if (href.startsWith('/')) return siteUrl(href, site, base);
    return new URL(href, page).href;
  };
  let fence: { char: string; length: number } | undefined;
  return body.split('\n').map((line) => {
    if (/^import \{ Tabs, TabItem \} from '@astrojs\/starlight\/components';$/.test(line)) return '';
    const marker = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
      return line;
    }
    if (marker) {
      fence = { char: marker[1][0], length: marker[1].length };
      return line;
    }
    const trimmed = line.trim();
    if (trimmed === '<Tabs syncKey="package-manager">' || trimmed === '</Tabs>' || trimmed === '</TabItem>') return '';
    const tab = trimmed.match(/^<TabItem label="([^"]+)">$/);
    if (tab) return `### ${tab[1]}`;
    if (/^(?:import\s+(?:\{|\*|[\w]+\s+from|['"])|export\s+(?:const|function|default|\{))/.test(line)) {
      throw new Error(`Non-Markdown content in AI docs source: ${id}: ${line}`);
    }
    // Keep code literals (including HTML-like types and Markdown examples) intact.
    return line.split(/(`+[^`]*`+)/g).map((part, index) => {
      if (index % 2) return part;
      if (/<\/?[A-Za-z][^>]*>|<!--/.test(part)) {
        throw new Error(`Non-Markdown content in AI docs source: ${id}: ${part}`);
      }
      return part
        .replace(/(\]\(\s*)(<[^>]+>|[^\s)]+)([^)]*\))/g, (_match, before, href, after) =>
          `${before}${href.startsWith('<') ? `<${absolute(href.slice(1, -1))}>` : absolute(href)}${after}`)
        .replace(/^(\s*\[[^\]]+\]:\s*)(<[^>]+>|\S+)(.*)$/, (_match, before, href, after) =>
          `${before}${href.startsWith('<') ? `<${absolute(href.slice(1, -1))}>` : absolute(href)}${after}`);
    }).join('');
  }).join('\n');
}

export function llmsText(docs: LlmDoc[], site: URL | string, base: string): string {
  const ordered = orderedDocs(docs);
  const docLink = (id: string) => {
    const doc = ordered.find((entry) => entry.id === id)!;
    return `[${doc.title}](${siteUrl(`${id}/`, site, base)})`;
  };
  const sections = docGroups.map((group) => `## ${group.title}\n\n${group.ids.map((id) => {
    const doc = ordered.find((entry) => entry.id === id)!;
    return `- ${docLink(id)}: ${doc.description}`;
  }).join('\n')}`);
  return [
    '# Nepali Toolkit',
    '> JavaScript and TypeScript utilities for Nepal-focused applications: BS/AD dates, numbers, NPR currency, land units, number words, Nepali sorting and search, phones, and administrative data.',
    'The `nepali-toolkit` package has no runtime dependencies. Import documented subpaths; the package root exports no utilities.',
    `Read ${docLink('docs/reference/date')} for date functions and supported ranges, ${docLink('docs/project/compatibility')} for runtime requirements, and ${docLink('docs/project/data-sources')} for data sources and known gaps. The guides below show how to use these functions in an application.`,
    ...sections,
    `## Optional\n\n- [Full documentation](${siteUrl('llms-full.txt', site, base)}): All published docs in source Markdown.\n- [Playground](${siteUrl('playground/', site, base)}): Interactive examples.\n- [Source](https://github.com/kbohara315/nepali-toolkit): Repository and issue tracker.\n- [npm](https://www.npmjs.com/package/nepali-toolkit): Published package versions.`,
  ].join('\n\n') + '\n';
}

export function llmsFullText(docs: LlmDoc[], site: URL | string, base: string): string {
  return '# Nepali Toolkit — full documentation\n\n' + orderedDocs(docs).map((doc) =>
    `# ${doc.title}\n\nSource: ${siteUrl(`${doc.id}/`, site, base)}\n\n${markdownForDoc(doc.body, doc.id, site, base)}`,
  ).join('\n\n---\n\n') + '\n';
}
