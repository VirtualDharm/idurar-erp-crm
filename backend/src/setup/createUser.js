/**
 * Create login users.
 *
 * This fork has no admin-create API route (role enum is ['owner'] only), so new
 * logins are inserted straight into Mongo with the same bcrypt(salt + password)
 * scheme setup.js uses — otherwise login silently fails.
 *
 *   node src/setup/createUser.js raman@urjacrm.com "Raman" "Kumar" "SomePass123"
 *   node src/setup/createUser.js            # creates the default team list below
 *
 * Re-running is safe: an existing email is skipped, never overwritten.
 */
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');

const TEAM = [
  { email: 'raman@urjacrm.com', name: 'Raman', surname: 'Sharma', password: 'Raman@2026' },
  { email: 'pranav@urjacrm.com', name: 'Pranav', surname: 'Verma', password: 'Pranav@2026' },
  { email: 'yogesh@urjacrm.com', name: 'Yogesh', surname: 'Singh', password: 'Yogesh@2026' },
];

async function createUser(Admin, AdminPassword, { email, name, surname, password }) {
  const existing = await Admin.findOne({ email, removed: false });
  if (existing) {
    console.log(`⏭  ${email} — already exists, skipped`);
    return;
  }
  const admin = await new Admin({
    email, name, surname, enabled: true, role: 'owner',
  }).save();

  const pw = new AdminPassword();
  const salt = uniqueId();
  await new AdminPassword({
    user: admin._id,
    password: pw.generateHash(salt, password),
    salt,
    emailVerified: true,
  }).save();

  console.log(`✅ ${email} — created  (password: ${password})`);
}

(async () => {
  await mongoose.connect(process.env.DATABASE);
  const Admin = require('../models/coreModels/Admin');
  const AdminPassword = require('../models/coreModels/AdminPassword');

  const [email, name, surname, password] = process.argv.slice(2);
  const users = email
    ? [{ email, name: name || email.split('@')[0], surname: surname || '', password: password || 'Change@2026' }]
    : TEAM;

  for (const u of users) await createUser(Admin, AdminPassword, u);

  await mongoose.disconnect();
  process.exit(0);
})().catch((e) => {
  console.error('✗ failed:', e.message);
  process.exit(1);
});
