/**
 * Team management — create and administer the people who can log in.
 *
 * The upstream fork ships no way to add a second user (only read/update of the
 * one seeded `owner`), so accounts had to be inserted straight into Mongo. This
 * controller closes that gap: it creates the Admin + AdminPassword pair with the
 * same bcrypt(salt + password) scheme `setup.js` uses — any other hashing makes
 * login fail silently.
 *
 * Guarded by hasRole('owner', 'admin') at the route layer.
 */
const mongoose = require('mongoose');
const { generate: uniqueId } = require('shortid');

const Admin = mongoose.model('Admin');
const AdminPassword = mongoose.model('AdminPassword');

const ROLES = ['owner', 'admin', 'sales', 'technician', 'accounts'];

const list = async (req, res) => {
  const users = await Admin.find({ removed: false })
    .select('name surname email role enabled photo created')
    .sort({ created: 1 });

  return res.status(200).json({
    success: true,
    result: users,
    message: `Found ${users.length} team members`,
  });
};

const create = async (req, res) => {
  const { email, name, surname = '', password, role = 'sales' } = req.body;

  if (!email || !name || !password) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'email, name and password are required.',
    });
  }
  if (password.length < 8) {
    return res.status(400).json({
      success: false,
      result: null,
      message: 'Password must be at least 8 characters.',
    });
  }
  if (!ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      result: null,
      message: `role must be one of: ${ROLES.join(', ')}`,
    });
  }

  const existing = await Admin.findOne({ email: email.toLowerCase(), removed: false });
  if (existing) {
    return res.status(409).json({
      success: false,
      result: null,
      message: 'A team member with this email already exists.',
    });
  }

  const user = await new Admin({ email, name, surname, role, enabled: true }).save();

  const salt = uniqueId();
  await new AdminPassword({
    user: user._id,
    password: new AdminPassword().generateHash(salt, password),
    salt,
    emailVerified: true,
  }).save();

  return res.status(200).json({
    success: true,
    result: { _id: user._id, email: user.email, name: user.name, role: user.role },
    message: 'Team member created.',
  });
};

const updateRole = async (req, res) => {
  const { role } = req.body;

  if (!ROLES.includes(role)) {
    return res.status(400).json({
      success: false,
      result: null,
      message: `role must be one of: ${ROLES.join(', ')}`,
    });
  }

  const target = await Admin.findOne({ _id: req.params.id, removed: false });
  if (!target) {
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  }
  // Demoting the last owner would leave nobody able to manage the team.
  if (target.role === 'owner' && role !== 'owner') {
    const owners = await Admin.countDocuments({ role: 'owner', removed: false });
    if (owners <= 1) {
      return res.status(403).json({
        success: false,
        result: null,
        message: 'Cannot change the role of the only owner.',
      });
    }
  }

  target.role = role;
  await target.save();

  return res.status(200).json({ success: true, result: target, message: 'Role updated.' });
};

const setEnabled = async (req, res) => {
  const enabled = !!req.body.enabled;

  const target = await Admin.findOne({ _id: req.params.id, removed: false });
  if (!target) {
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  }
  if (target._id.toString() === req.admin._id.toString()) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You cannot disable your own account.',
    });
  }
  if (target.role === 'owner' && !enabled) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'The owner account cannot be disabled.',
    });
  }

  target.enabled = enabled;
  await target.save();

  return res.status(200).json({
    success: true,
    result: target,
    message: enabled ? 'Team member enabled.' : 'Team member disabled.',
  });
};

const remove = async (req, res) => {
  const target = await Admin.findOne({ _id: req.params.id, removed: false });
  if (!target) {
    return res.status(404).json({ success: false, result: null, message: 'User not found.' });
  }
  if (target.role === 'owner') {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'The owner account cannot be removed.',
    });
  }
  if (target._id.toString() === req.admin._id.toString()) {
    return res.status(403).json({
      success: false,
      result: null,
      message: 'You cannot remove your own account.',
    });
  }

  // Soft delete keeps historical references (created-by, assigned-to) intact.
  target.removed = true;
  target.enabled = false;
  await target.save();
  await AdminPassword.updateOne({ user: target._id }, { $set: { removed: true, loggedSessions: [] } });

  return res.status(200).json({ success: true, result: null, message: 'Team member removed.' });
};

const roles = async (req, res) =>
  res.status(200).json({ success: true, result: ROLES, message: 'Available roles' });

module.exports = { list, create, updateRole, setEnabled, remove, roles, ROLES };
