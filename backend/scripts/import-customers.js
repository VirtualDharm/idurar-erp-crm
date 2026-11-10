/**
 * Import customers (with their pipeline stage) from the JSON made by
 * scripts/lead-pipeline-to-json.py.
 *
 *   node scripts/import-customers.js customers.json            # preview: counts only
 *   node scripts/import-customers.js customers.json --apply    # write
 *
 * Matches existing customers by phone (last 10 digits), so running it again
 * updates them instead of adding duplicates. Customers without a phone are
 * matched by exact name among phone-less customers.
 */
require('module-alias/register');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const mongoose = require('mongoose');

const APPLY = process.argv.includes('--apply');
const file = process.argv[2];

async function main() {
  if (!file) throw new Error('usage: node scripts/import-customers.js <customers.json> [--apply]');
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  await mongoose.connect(process.env.DATABASE);
  require('@/models/appModels/Client');
  const Client = mongoose.model('Client');

  const existing = await Client.find({ removed: false }).lean();
  const byPhone = new Map();
  const byName = new Map();
  for (const c of existing) {
    const p = (c.phone || '').replace(/\D/g, '').slice(-10);
    if (p.length === 10) byPhone.set(p, c);
    else byName.set((c.name || '').trim().toLowerCase(), c);
  }

  let created = 0;
  let updated = 0;
  for (const r of rows) {
    const p = (r.phone || '').replace(/\D/g, '').slice(-10);
    const match = p.length === 10 ? byPhone.get(p) : byName.get(r.name.trim().toLowerCase());
    if (match) {
      updated += 1;
      if (APPLY) await Client.updateOne({ _id: match._id }, { $set: { ...r, updated: new Date() } });
    } else {
      created += 1;
      if (APPLY) await Client.create(r);
    }
  }
  console.log(`${APPLY ? 'APPLIED' : 'PREVIEW'} — database ${mongoose.connection.name}: ${existing.length} customers before, ${created} new, ${updated} updated`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
