"""Regenerate src/admin/data/raw/*.json from the GoN upstream bytes in
upstream/ (no network). Requires: python3 + xlrd (pip install xlrd).

  python3 tools/extract-upstream.py

Steps:
  1. nso-geocodes-local-unit.xls -> raw/nso-districts.json + raw/nso-palikas.json
  2. census-portal JS chunks -> raw/portal-districts.json + raw/portal-wards.json
  3. mofaga-pages/*.html -> raw/mofaga.json
Counts are asserted (77 / 753 / 753 / 77 / 753). Spelling is transcribed
faithfully; normalization happens in scripts/generate-admin.mjs.
"""
import io
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
UP = os.path.join(os.path.dirname(HERE), 'upstream')
RAW = os.path.dirname(HERE)

import xlrd  # noqa: E402  (pip install xlrd)


def dump(name, obj):
    with io.open(os.path.join(RAW, name), 'w', encoding='utf-8') as f:
        f.write(json.dumps(obj, ensure_ascii=False, indent=1) + '\n')
    print(name, len(obj))


# --- 1. NSO workbook ---
wb = xlrd.open_workbook(os.path.join(UP, 'nso-geocodes-local-unit.xls'))
sh = wb.sheet_by_name('district_code')
districts = [
    {'sn': r - 2, 'en': sh.cell_value(r, 2),
     'ne_preeti': sh.cell_value(r, 3), 'code': int(sh.cell_value(r, 4))}
    for r in range(3, sh.nrows)
]
sh2 = wb.sheet_by_name('localunit_code')
palikas = [
    {'dist': sh2.cell_value(r, 1), 'en': sh2.cell_value(r, 2),
     'ne': sh2.cell_value(r, 3), 'code': int(sh2.cell_value(r, 4))}
    for r in range(3, sh2.nrows)
]
assert len(districts) == 77, len(districts)
assert len(palikas) == 753, len(palikas)
assert len({d['code'] for d in districts}) == 77
assert len({p['code'] for p in palikas}) == 753
dump('nso-districts.json', districts)
dump('nso-palikas.json', palikas)

# --- 2. census portal chunks ---
js = ''
for name in ('census-portal-ward-1724.js', 'census-portal-ward-8539.js'):
    with io.open(os.path.join(UP, name), encoding='utf-8',
                 errors='replace') as f:
        js += f.read()
wards = [[int(a), int(b), c, int(d)] for a, b, c, d in
         (m.groups() for m in re.finditer(
             r'\{district:"(\d+)",value:"(\d+)",label:"([^"]+)",'
             r'no_of_wards:(\d+)\}', js))]
dist = [{'label': a, 'value': int(b), 'province': int(c)} for a, b, c in
        (m.groups() for m in re.finditer(
            r'\{label:"([a-z_ ()]+)",value:"(\d+)",province:"(\d+)"\}', js))]
assert len(wards) == 753, len(wards)
assert len(dist) == 77, len(dist)
assert sum(w[3] for w in wards) == 6743, sum(w[3] for w in wards)
dump('portal-wards.json', wards)
dump('portal-districts.json', dist)

# --- 3. MoFAGA pages ---
rows = []
for page in range(1, 52):
    with io.open(os.path.join(UP, 'mofaga-pages', '%02d.html' % page),
                 encoding='utf-8', errors='replace') as f:
        html = f.read()
    cells = re.findall(r'<td[^>]*>(.*?)</td>', html, flags=re.S)
    assert len(cells) % 8 == 0, (page, len(cells))
    tag = lambda s: re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s)).strip()
    for i in range(0, len(cells), 8):
        rows.append({'province': tag(cells[i + 1]), 'palika': tag(cells[i + 2]),
                     'district': tag(cells[i + 3])})
assert len(rows) == 753, len(rows)
dump('mofaga.json', rows)

# --- 4. GPO postal-code table (S5) ---
with io.open(os.path.join(UP, 'gpo-postal.html'), encoding='utf-8',
             errors='replace') as f:
    gpo_html = f.read()
DEV = {'०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
       '५': '5', '६': '6', '७': '7', '८': '8', '९': '9'}


def cell(td):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', td)).strip()


def digits(t):
    return ''.join(DEV.get(c, c) for c in t)


postal = []
for tr in re.findall(r'<tr[^>]*>(.*?)</tr>', gpo_html, flags=re.S):
    cells = [cell(c) for c in re.findall(r'<td[^>]*>(.*?)</td>', tr, flags=re.S)]
    if len(cells) == 8 and re.fullmatch(r'\d+', cells[0]):
        postal.append({'sn': int(cells[0]), 'province': cells[1],
                       'district': cells[2], 'palika': cells[3],
                       'wards': digits(cells[4]), 'office': cells[5],
                       'code5': digits(cells[6]), 'code7': cells[7]})
assert len(postal) == 753, len(postal)
assert [p['sn'] for p in postal] == list(range(1, 754))
assert len({p['code5'] for p in postal}) == 753
for p in postal:
    assert re.fullmatch(r'\d{5}', p['code5']), p
    assert re.fullmatch(r'\d{7} देखि \d{2}', p['code7']), p
dump('gpo-postal.json', postal)

print('extract-upstream: OK')
