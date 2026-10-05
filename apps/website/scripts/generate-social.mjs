// Uses Astro's existing image dependency; no additional runtime dependency.
import { createRequire } from 'node:module';
const require = createRequire(import.meta.resolve('astro'));
const sharp = require('sharp');
await sharp(new URL('../public/social/switchboard.svg', import.meta.url).pathname)
  .png()
  .toFile(new URL('../public/social/switchboard.png', import.meta.url).pathname);
