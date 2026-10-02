# Nepali Toolkit website

Astro + Starlight documentation and showcase site for `nepali-toolkit`.

## Design plans

- [Switchboard homepage plan](./SWITCHBOARD_PLAN.md): selected next design;
  detailed visual, interaction, animation, accessibility, and SEO specification.
  Planning only; the switchboard is not implemented yet.
- [Original implementation plan](./IMPLEMENTATION_PLAN.md): overall website
  architecture and documentation requirements. Its octopus homepage direction
  is superseded by the switchboard plan.

## Local development

From the repository root:

```bash
pnpm --filter @nepali-toolkit/website dev
pnpm --filter @nepali-toolkit/website typecheck
pnpm --filter @nepali-toolkit/website run doctor
pnpm --filter @nepali-toolkit/website build
pnpm --filter @nepali-toolkit/website test
```

The website builds the workspace toolkit first when using the deployment workflow. The playground imports real public subpaths lazily in the browser.

## GitHub Pages

The workflow builds this package with `SITE_BASE` and `SITE_URL`. For this repository's project Pages URL, use `SITE_BASE=/<repository-name>/`; for an owner Pages repository, use `/`. Configure the repository's Pages source as **GitHub Actions**. No custom domain is assumed.
