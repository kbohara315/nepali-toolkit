// Package root intentionally exposes no utility domains.
//
// Import through stable subpaths instead:
//
//   import { toBS } from 'nepali-toolkit/date';
//   import { toDevanagari } from 'nepali-toolkit/number/digits';
//
// Subpaths are the size-sensitive contract: importing one domain must not
// retain unrelated domains. A small ergonomic root may be added later, but
// only with measured bundle evidence per the blueprint.

export {};
