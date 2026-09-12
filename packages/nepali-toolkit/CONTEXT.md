# Nepali Utils — Date Domain

Tree-shakable TS-first utilities for BS and AD calendar dates. The date domain models civil dates without time or timezone. Import through subpaths (`nepali-toolkit/date`, `nepali-toolkit/number/digits`); the package root exposes nothing.

## Language

**BS (Bikram Sambat)**:
Nepal's solar civil calendar. The difference between BS and AD year numbers is date-dependent and must not be used for conversion. Month lengths come from cited, year-specific Patro publications rather than an arithmetic leap-year rule.
_Avoid_: Nepali date, Bikram, VS, approximate year offsets

**AD (Anno Domini)**:
A date in the proleptic Gregorian calendar, represented as a timezone-free year/month/day triple. A JavaScript `Date` is an instant and requires an explicit timezone interpretation before it can become an AD date.
_Avoid_: English date, CE, JavaScript Date

**Patro**:
A published calendar artifact used as evidence for a specific BS year's month boundaries. The generated month-length dataset (`src/date/data/`) is Patro-derived; it is not itself a Patro. Current revision is a working transcription — see `src/date/data/PROVENANCE.md`.
_Avoid_: generated data, BS table

**Date value (NepaliDate)**:
One supported civil day, addressable through either a BS or AD year/month/day projection. It contains no time or timezone. Functional conversion (`toAD`/`toBS`) is the primary seam; the class delegates to it.
_Avoid_: date object, timestamp, instant, Miti

**Day count (epoch days)**:
Integer civil days where `1970-01-01 AD` is day count `0`. Leap seconds, times, and timezones do not participate; BS conversion uses a separately cited BS/AD reference pair. Owned solely by `src/date/internal/conversion.ts`.
_Avoid_: Julian day, timestamp

**Fiscal year (Nepali)**:
Shrawan 1 → Ashadh end, not Jan-Dec.
_Avoid_: financial year
