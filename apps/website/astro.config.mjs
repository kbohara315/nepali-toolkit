import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

const base = process.env.SITE_BASE ?? '/';

export default defineConfig({
  site: new URL(process.env.SITE_URL ?? 'https://kbohara315.github.io').origin,
  base,
  output: 'static',
  integrations: [
    starlight({
      title: 'Nepali Toolkit',
      description: 'TypeScript utilities for building applications for Nepal.',
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/kbohara315/nepali-toolkit' }],
      customCss: ['./src/styles/docs.css'],
      components: {
        SiteTitle: './src/components/overrides/SiteTitle.astro',
        MobileMenuToggle: './src/components/overrides/MobileMenuToggle.astro',
        PageTitle: './src/components/overrides/PageTitle.astro',
      },
      sidebar: [
        { label: 'Playground', link: '/playground/' },
        { label: 'Start here', items: ['docs', 'docs/getting-started'] },
        { label: 'Task guides', items: [
          { label: 'Dates and calendars', slug: 'docs/guides/dates-and-calendars' },
          { label: 'Exact money and words', slug: 'docs/guides/exact-money-and-words' },
          { label: 'Phone form validation', slug: 'docs/guides/phone-validation' },
          { label: 'Land conversions', slug: 'docs/guides/land-conversions' },
          { label: 'Nepali sorting and search', slug: 'docs/guides/nepali-sorting-and-search' },
          { label: 'Administrative address selectors', slug: 'docs/guides/administrative-data' },
          { label: 'Errors and external input', slug: 'docs/guides/errors-and-input' },
          { label: 'Imports and bundling', slug: 'docs/guides/imports-and-bundling' },
        ] },
        { label: 'API reference', items: [{ label: 'BS/AD dates', slug: 'docs/reference/date' }, { label: 'Numbers and digits', slug: 'docs/reference/number' }, { label: 'NPR currency', slug: 'docs/reference/currency' }, { label: 'Land area', slug: 'docs/reference/land' }, { label: 'Number and amount words', slug: 'docs/reference/words' }, { label: 'Sorting, search, and text', slug: 'docs/reference/collation' }, { label: 'Nepal phone numbers', slug: 'docs/reference/phone' }, { label: 'Admin and postal codes', slug: 'docs/reference/admin' }] },
        { label: 'Project', items: [{ label: 'Compatibility', slug: 'docs/project/compatibility' }, { label: 'Data sources', slug: 'docs/project/data-sources' }, { label: 'Releases', slug: 'docs/project/releases' }] }
      ]
    }),
    {
      name: 'react-grab',
      hooks: {
        'astro:config:setup'({ injectScript }) {
          injectScript(
            'page',
            `if (import.meta.env.DEV) { import('react-grab'); }`,
          );
        },
      },
    },
  ]
});
