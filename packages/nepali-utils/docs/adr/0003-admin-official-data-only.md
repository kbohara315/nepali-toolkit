# Admin data is transcribed from GoN sources, never hand-written

The `admin` domain (provinces, districts, palikas, wards) ships official
snapshots only: NSO geographical codes for codes and palika names, the NSO
census portal bundle for ward counts, MoFAGA for Nepali district/province
names. `scripts/generate-admin.mjs` re-derives every join with assertions,
and `src/admin/data/PROVENANCE.md` records vintages, canonical rules, and
known inter-source variants. Spelling corrections arrive as newer official
snapshots, never as hand edits — otherwise review cannot distinguish a fix
from a guess.
