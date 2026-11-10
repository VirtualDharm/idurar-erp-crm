#!/usr/bin/env python3
"""Turn the team's "Lead Pipeline.xlsx" into customers JSON for import-customers.js.

    python3 scripts/lead-pipeline-to-json.py "Lead Pipeline.xlsx" > /tmp/customers.json

Standard library only (an .xlsx is a zip of XML files). Every tab is read; a
person who appears in several tabs (same 10-digit phone) becomes one customer —
the later tab wins for stage/sales person, and all their notes are kept.
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

M = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
R = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'

# Excel status text → CRM stage (New, Contacted, Survey Scheduled, Quote Sent, Negotiation, Won, Lost)
STAGE = {
    '': 'New', 'intake': 'New', 'pending call': 'New', 'not answered': 'New',
    'qualified': 'Contacted', 'delayed': 'Contacted', 'dicey': 'Contacted',
    'meet fixed': 'Contacted', 'meet in november': 'Contacted', 'provide referral': 'Contacted',
    'meeting for commercial sites': 'Contacted',
    'site visit': 'Survey Scheduled', 'site survey': 'Survey Scheduled',
    'shared quotation': 'Quote Sent',
    'converted': 'Won',
    'lost': 'Lost', 'wasted': 'Lost', 'wasted lead': 'Lost', 'not qualified': 'Lost',
    'otl': 'Lost',  # out of location — outside the service area
    'wrong number': 'Lost',
}


def stage_for(status):
    s = re.sub(r'[.\s]+$', '', status.strip().lower())
    if s in STAGE:
        return STAGE[s]
    if s.startswith(('transfer to', 'call fixed')):
        return 'Contacted'
    if s.startswith('visit fixed'):
        return 'Survey Scheduled'
    return 'New'


def phone10(raw):
    raw = (raw or '').strip()
    if re.fullmatch(r'\d+(\.\d+)?E\d+', raw):  # Excel stored the number as 7.307661395E9
        raw = str(int(float(raw)))
    digits = re.sub(r'\D', '', raw)
    return digits[-10:] if len(digits) >= 10 else ''


def read_tabs(path):
    z = zipfile.ZipFile(path)
    shared = []
    if 'xl/sharedStrings.xml' in z.namelist():
        for si in ET.fromstring(z.read('xl/sharedStrings.xml')).findall(M + 'si'):
            shared.append(''.join(t.text or '' for t in si.iter(M + 't')))
    rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    for sheet in ET.fromstring(z.read('xl/workbook.xml')).find(M + 'sheets'):
        target = rels[sheet.get(R)].lstrip('/')
        root = ET.fromstring(z.read(target if target.startswith('xl/') else 'xl/' + target))
        rows = []
        for r in root.iter(M + 'row'):
            cells = {}
            for c in r.findall(M + 'c'):
                v = c.find(M + 'v')
                x = v.text if v is not None else ''.join(c.itertext())
                if c.get('t') == 's' and x:
                    x = shared[int(x)]
                if x and x.strip():
                    cells[re.match(r'[A-Z]+', c.get('r')).group()] = x.strip()
            rows.append(cells)
        yield sheet.get('name').strip(), rows


def main(path):
    people = {}  # key → customer
    for tab, rows in read_tabs(path):
        if not rows:
            continue
        header = {k: v.strip().lower() for k, v in rows[0].items()}
        col = lambda *words: next((k for k, h in header.items() if any(w in h for w in words)), None)
        c_name, c_phone, c_loc = col('name'), col('phone'), col('location')
        c_status, c_source = col('status'), col('source')
        c_sales = col('assigned', 'project manager')
        for r in rows[1:]:
            name, phone = r.get(c_name, ''), phone10(r.get(c_phone, ''))
            if not name and not phone:
                continue
            status = r.get(c_status, '') if c_status else ''
            # everything else on the row becomes a note line ("Follow Up 1: …")
            skip = {c_name, c_phone, c_loc, c_status, c_source, c_sales}
            extra = [f"{rows[0][k].strip()}: {v}" for k, v in r.items() if k not in skip and k in rows[0] and rows[0][k].strip()]
            note = f"[{tab}] status: {status or '-'}" + (' · ' + ' · '.join(extra) if extra else '')
            key = phone or f"{name.lower()}|{tab}"
            p = people.setdefault(key, {'name': name, 'phone': phone, 'address': '', 'source': '', 'salesPerson': '', 'notes': []})
            p['name'] = name or p['name']
            p['address'] = r.get(c_loc, '') or p['address']
            src = r.get(c_source, '') if c_source else ''
            p['source'] = {'fb': 'Facebook', 'ig': 'Instagram'}.get(src.lower(), src) or p['source']
            sales = r.get(c_sales, '') if c_sales else ''
            p['salesPerson'] = sales if sales not in ('', '-') else p['salesPerson']
            p['stage'] = stage_for(status)  # later tab wins
            p['notes'].append(note)
    out = []
    for p in people.values():
        out.append({
            'name': p['name'] or f"Unknown ({p['phone']})",
            'phone': f"+91 {p['phone']}" if p['phone'] else '',
            'country': 'India',
            'address': p['address'],
            'stage': p['stage'],
            'source': p['source'],
            'salesPerson': p['salesPerson'],
            'notes': '\n'.join(p['notes']),
        })
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)


if __name__ == '__main__':
    main(sys.argv[1])
