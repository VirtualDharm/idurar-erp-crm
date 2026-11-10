/**
 * Import leads (with their pipeline stage) from the JSON made by
 * scripts/lead-pipeline-to-json.py — same file import-customers.js reads.
 *
 *   node scripts/import-leads.js customers.json                       # preview
 *   node scripts/import-leads.js customers.json --apply               # write leads
 *   node scripts/import-leads.js customers.json --apply --remove-customers
 *        # also soft-delete (removed: true, like the Delete button) the
 *        # customers that import-customers.js created from the same file
 *
 * Leads are matched by mobile (last 10 digits), so re-runs update instead of
 * duplicating. Sales person, source and every Excel follow-up become notes.
 */
require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const REMOVE_CUSTOMERS = process.argv.includes('--remove-customers');
const file = process.argv[2];
const last10 = (v) => String(v || '').replace(/\D/g, '').slice(-10);

function toLead(r) {
  const notes = [];
  if (r.salesPerson) notes.push({ text: `Sales person: ${r.salesPerson}` });
  if (r.source) notes.push({ text: `Source: ${r.source}` });
  for (const line of (r.notes || '').split('\n').filter(Boolean)) notes.push({ text: line });
  const loc = (r.address || '').trim();
  return {
    name: r.name,
    mobile: r.phone || undefined,
    address: loc || undefined,
    city: loc && loc.length <= 30 ? loc : undefined, // short "Lucknow"-style locations show on the card
    leadSource: ['Facebook', 'Instagram'].includes(r.source) ? 'Social Media' : 'Manual',
    status: r.stage,
    notes,
  };
}

async function main() {
  if (!file) throw new Error('usage: node scripts/import-leads.js <customers.json> [--apply] [--remove-customers]');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  await mongoose.connect(process.env.DATABASE);
  require('@/models/appModels/Lead');
  require('@/models/appModels/Client');
  const Lead = mongoose.model('Lead');
  const Client = mongoose.model('Client');

  const leads = await Lead.find({ removed: false }).lean();
  const byMobile = new Map(leads.filter((l) => last10(l.mobile).length === 10).map((l) => [last10(l.mobile), l]));
  const byName = new Map(leads.filter((l) => last10(l.mobile).length !== 10).map((l) => [l.name.trim().toLowerCase(), l]));

  let created = 0;
  let updated = 0;
  for (const r of rows) {
    const doc = toLead(r);
    const p = last10(r.phone);
    const match = p.length === 10 ? byMobile.get(p) : byName.get(r.name.trim().toLowerCase());
    if (match) {
      updated += 1;
      if (APPLY) await Lead.updateOne({ _id: match._id }, { $set: { ...doc, updated: new Date() } });
    } else {
      created += 1;
      if (APPLY) await Lead.create(doc);
    }
  }
  console.log(`${APPLY ? 'APPLIED' : 'PREVIEW'} leads — ${leads.length} before, ${created} new, ${updated} updated`);

  // Customers that came from this same file: phone (or phone-less name) matches a row
  // AND they carry the import's fields (stage set). The original customers are untouched.
  const phones = new Set(rows.map((r) => last10(r.phone)).filter((p) => p.length === 10));
  const names = new Set(rows.filter((r) => last10(r.phone).length !== 10).map((r) => r.name.trim().toLowerCase()));
  const clients = await Client.find({ removed: false, stage: { $exists: true } }).lean();
  const toRemove = clients.filter((c) =>
    last10(c.phone).length === 10 ? phones.has(last10(c.phone)) : names.has((c.name || '').trim().toLowerCase())
  );
  const kept = (await Client.countDocuments({ removed: false })) - toRemove.length;
  if (REMOVE_CUSTOMERS && APPLY) {
    await Client.updateMany({ _id: { $in: toRemove.map((c) => c._id) } }, { $set: { removed: true, updated: new Date() } });
  }
  console.log(
    `${REMOVE_CUSTOMERS && APPLY ? 'REMOVED' : 'would remove (with --remove-customers)'} ${toRemove.length} imported customers; ${kept} other customers kept`
  );
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
