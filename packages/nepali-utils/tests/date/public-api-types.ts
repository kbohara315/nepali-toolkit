import { NepaliDate, ad, bs, toAD, toBS } from '../../src/date/index.js';
import type { ADDate, BSDate } from '../../src/date/index.js';

const bsDate: BSDate = bs(2082, 4, 7);
const adDate: ADDate = ad(2025, 7, 23);

toAD(bsDate);
toBS(adDate);
NepaliDate.fromBS(bsDate);
NepaliDate.fromAD(adDate);

// @ts-expect-error AD values must not cross the BS conversion seam.
toAD(adDate);
// @ts-expect-error BS values must not cross the AD conversion seam.
toBS(bsDate);
// @ts-expect-error NepaliDate.fromBS accepts only branded BS values.
NepaliDate.fromBS(adDate);
// @ts-expect-error NepaliDate.fromAD accepts only branded AD values.
NepaliDate.fromAD(bsDate);
