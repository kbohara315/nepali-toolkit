# Gate 1 spot-check 2026-08-22

Two independent tables (nepali-date-converter 2000-2090 vs nepali-date-library 1976-2100) share identical month-length rows for sampled years, indicating a common transcription lineage. No Patro page scans were available offline; verification is via cross-library majority, not original Patro.

Samples (miti data/generated/patro.json vs oracle @remotemerge where available):

| BS   | Miti months                                   | Miti Baisakh 1 -> AD | Notes  |
| ---- | --------------------------------------------- | -------------------- | ------ |
| 2000 | 30,32,31,32,31,30,30,30,29,30,29,31 total 365 | 1943-04-14           | anchor |
| 2026 | 31,32,31,32,31,30,30,30,29,29,30,31 total 366 | 1969-04-14           |        |
| 2050 | 31,32,31,32,31,30,30,30,29,30,29,31 total 366 | 1993-04-14           |        |
| 2080 | 31,32,31,32,31,30,30,30,29,29,30,30 total 365 | 2023-04-14           |        |
| 2090 | 31,31,32,31,31,31,30,29,30,29,30,30 total 365 | 2033-04-13           |        |

Exhaustive miti vs @remotemerge: 32750/33238 matched; 488 mismatches from 2087-05-01 are due to @remotemerge aliasing future years (a[2087]=a[1975]), not miti bug.

Gate 1 passed with caveat: true Patro page scans still to be archived per data/sources/manifest.json status transcribed-unverified.
