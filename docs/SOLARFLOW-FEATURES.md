# SolarFlow (Fuzen) — feature inventory for urjacrm

Reference dashboard: `solarflow210435.fuzen.app` (Solar CRM built on Fuzen).
Screenshots: `docs/solarflow-reference/`. Captured 2026-08-30.

Purpose: source of feature requirements to port into this IDURAR fork (urjacrm).

## Modules

| # | Module | What it does | Screenshot |
|---|--------|--------------|-----------|
| 1 | Dashboard | KPI cards (My Leads / Active Projects / Collections ₹ / Open Tickets), sales-pipeline funnel by stage, overdue follow-ups list, stuck-subsidies alert, recent leads activity, PWA "Install App" prompt | 01, 02 |
| 2 | Leads | Kanban by stage (New → Contacted → Survey Scheduled → Quote Sent → Negotiation → Won) + List view toggle, per-card monthly bill + location + WhatsApp click-to-chat, Import / Export, New Lead | 03 |
| 3 | Lead detail | Status dropdown + follow-up date (saved inline), contact info incl. lead source + roof ownership, schedule site survey w/ technician assignment, survey history, notes timeline, "Create Quotation" action | 17, 18 |
| 4 | Surveys | List w/ search + status + technician filters, admin "view all" toggle, Start Survey / View Survey | 04 |
| 5 | Survey form | 3 sections: customer details (read-only), technical specs (roof area, shading, connection type, sanctioned load, monthly units, **auto-calculated recommended kW**, GPS capture button, status, notes), photo gallery w/ drag-drop upload | 26, 27, 28 |
| 6 | Quotations | List w/ status + system-size filters, quote no / total / net cost / validity, print, convert-to-project | 05 |
| 7 | Quotation editor | Line items pulled from product catalog (item, brand, qty, unit, rate, **per-item GST %**), payment schedule % from templates, pricing summary: subtotal → GST → grand total, minus **Central Subsidy (PM Surya Ghar)** and **State Subsidy** = Net Customer Cost, MNRE disclaimer, Convert to Project | 23, 24, 25 |
| 8 | Projects | Installation pipeline cards: status, manager, system size, location, value, milestone progress bar (n/10) | 06 |
| 9 | Project detail | **10 installation milestones** with checkbox + photo proof upload (material procurement → delivery → structure/panel → inverter/wiring → testing/commissioning → DISCOM application → DISCOM inspection → net meter → subsidy applied → subsidy disbursed); **subsidy documents** (Aadhaar, electricity bill, property proof, bank passbook, installation certificate, inspection report); **payment schedule & collections** (total value / received / outstanding + per-milestone due, due date, status, received, record-payment) | 19, 20, 21, 22 |
| 10 | Subsidy tracker | Per project: location, expected subsidy, portal status, net-meter status, **time elapsed**, "stuck >45 days" filter + count | 07 |
| 11 | Payments | Total outstanding across projects | 08 |
| 12 | After-Sales | Service tickets (ticket no, project, issue type, status, reported on, technician) + AMC contracts tab; create ticket modal w/ file attach | 09, 29 |
| 13 | Solar calculator | Embeddable widget (shadow-DOM script) for the company website: monthly bill slider + roof area → savings estimate → **submits a lead straight into the CRM** with source "Website Solar Calculator". Setup guides for WordPress / Wix / Webflow / HTML | 15, 16 |
| 14 | Settings | Company profile (name, GST, address, logo) · **Product catalog** (item, brand, unit, default rate, GST %) · **State subsidy rules** (₹/kW + max cap per state) · **Payment term templates** (advance/delivery/commissioning %) · **Team management** (invite by email, roles: Admin / Sales Executive / Field Technician / Accounts) · automation (WhatsApp notifications toggle, AMC reminder lead days, subsidy follow-up threshold days) | 10–14 |

## What urjacrm (IDURAR fork) already has

Invoices, payments, customers/people/companies, settings, admin users, PDF generation, taxes, payment modes.

## Gap list — what must be built

1. **Lead pipeline** (kanban + stages + drag) — nothing equivalent today
2. **Survey module** (scheduling, technician assignment, field form, GPS, photos)
3. **Quotation subsidy engine** (state rules table + central PM Surya Ghar calc → net cost)
4. **Project/installation milestones** with photo proof
5. **Subsidy tracker** (portal + net-meter status, ageing, stuck alerts)
6. **Service tickets + AMC contracts**
7. **Product catalog with per-item GST** (IDURAR has taxes but not a catalog with brand/unit/default rate)
8. **Payment-term templates** driving auto-generated payment schedules
9. **Roles beyond `owner`** — IDURAR's Admin schema enum is `['owner']` only; needs Admin/Sales/Technician/Accounts + route guards
10. **Website lead-capture widget** (embeddable calculator)
11. **Dashboard** rebuilt around these KPIs
12. Notifications: WhatsApp click-to-chat on records, AMC reminders, subsidy follow-up alerts

## Suggested build order

1. Roles + team management (everything else depends on who can see what)
2. Product catalog + subsidy rules + payment templates (settings data other modules read)
3. Leads (kanban, detail, notes, follow-ups) — the funnel entry
4. Quotations w/ line items + subsidy math + PDF
5. Projects + milestones + payment schedule (converts from accepted quote)
6. Subsidy tracker (reads project milestone/doc state)
7. Service tickets + AMC
8. Dashboard aggregation
9. Calculator embed widget (last — needs public endpoint + tenant key)
