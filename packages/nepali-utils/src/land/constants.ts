// Canonical land-area constants — the ONE place these live.
//
// Provenance (per docs/land-contract.md): 1 Ropani = 5,476 sq ft = 508.72 m²
// and 1 Bigha = 72,900 sq ft = 6,772.63 m² are the standard published figures
// used by Nepal's land administration. All named units below divide these SI
// constants into whole square micrometres (µm²), so the canonical
// representation is exact with plain bigint arithmetic.

/** Square micrometres (µm²) per square metre. */
export const UM2_PER_SQ_M = 1_000_000_000_000n;

/** Square micrometres (µm²) per Ropani (508.72 m²). */
export const UM2_PER_ROPANI = 508_720_000_000_000n;

/** Square micrometres (µm²) per Bigha (6,772.63 m²). */
export const UM2_PER_BIGHA = 6_772_630_000_000_000n;

// Hill ladder: 1 Ropani = 16 Aana; 1 Aana = 4 Paisa; 1 Paisa = 4 Daam.
export const AANA_PER_ROPANI = 16;
export const PAISA_PER_AANA = 4;
export const DAAM_PER_PAISA = 4;

/** Square micrometres (µm²) per Aana (1/16 Ropani). */
export const UM2_PER_AANA = UM2_PER_ROPANI / 16n;

/** Square micrometres (µm²) per Paisa (1/64 Ropani). */
export const UM2_PER_PAISA = UM2_PER_ROPANI / 64n;

/** Square micrometres (µm²) per Daam (1/256 Ropani). */
export const UM2_PER_DAAM = UM2_PER_ROPANI / 256n;

// Terai ladder: 1 Bigha = 20 Kattha; 1 Kattha = 20 Dhur.
export const KATTHA_PER_BIGHA = 20;
export const DHUR_PER_KATTHA = 20;

/** Square micrometres (µm²) per Kattha (1/20 Bigha). */
export const UM2_PER_KATTHA = UM2_PER_BIGHA / 20n;

/** Square micrometres (µm²) per Dhur (1/400 Bigha). */
export const UM2_PER_DHUR = UM2_PER_BIGHA / 400n;

// Published square-foot equivalents (exact definitional relations per system).
/** Square feet per Ropani (hill system published figure). */
export const SQFT_PER_ROPANI = 5_476n;

/** Square feet per Bigha (Terai system published figure). */
export const SQFT_PER_BIGHA = 72_900n;
