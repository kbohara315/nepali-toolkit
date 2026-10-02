import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const base = process.env.SITE_BASE ?? '/';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://kbohara315.github.io',
  base,
  output: 'static',
  integrations: [
    starlight({
      title: 'Nepali Toolkit',
      description: 'TypeScript utilities for building applications for Nepal.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/kbohara315/nepali-toolkit' }],
      customCss: ['./src/styles/docs.css'],
      sidebar: [
        { label: 'Start here', items: ['docs', 'docs/getting-started'] },
        { label: 'Guides', items: [{ label: 'Imports and bundling', slug: 'docs/guides/imports-and-bundling' }, { label: 'Dates and calendars', slug: 'docs/guides/dates-and-calendars' }, { label: 'Administrative data', slug: 'docs/guides/administrative-data' }] },
        { label: 'Reference', items: [{ label: 'Date', slug: 'docs/reference/date' }, { label: 'Number', slug: 'docs/reference/number' }, { label: 'Currency', slug: 'docs/reference/currency' }, { label: 'Land', slug: 'docs/reference/land' }, { label: 'Words', slug: 'docs/reference/words' }, { label: 'Collation', slug: 'docs/reference/collation' }, { label: 'Phone', slug: 'docs/reference/phone' }, { label: 'Admin', slug: 'docs/reference/admin' }] },
        { label: 'Project', items: [{ label: 'Compatibility', slug: 'docs/project/compatibility' }, { label: 'Data sources', slug: 'docs/project/data-sources' }, { label: 'Releases', slug: 'docs/project/releases' }] }
      ]
    })
  ]
});
