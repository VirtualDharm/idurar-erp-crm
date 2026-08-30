const express = require('express');
const mongoose = require('mongoose');
const { catchErrors } = require('@/handlers/errorHandlers');

const router = express.Router();

/**
 * Unauthenticated endpoints for the website solar-savings calculator.
 *
 * These are deliberately outside the JWT-guarded router: the widget runs on the
 * company's public marketing site, where no user is logged in. That makes this
 * the only write path a stranger can reach, so it is kept deliberately narrow —
 * it can create a Lead and nothing else, ignores any field it wasn't asked for
 * (no status, no assignment, no ids), and rate-limits by IP.
 */

// ~4.5 units per kW per day is the usable all-India average after losses.
const UNITS_PER_KW_MONTH = 120;
const COST_PER_KW = 60000;

const estimate = (monthlyBill, roofArea) => {
  const bill = Number(monthlyBill) || 0;
  // ₹8/unit is a reasonable blended domestic slab rate.
  const monthlyUnits = bill / 8;
  let sizeKw = monthlyUnits / UNITS_PER_KW_MONTH;
  if (roofArea) sizeKw = Math.min(sizeKw, Number(roofArea) / 100);
  sizeKw = Math.max(Math.round(sizeKw * 10) / 10, 1);

  const systemCost = Math.round(sizeKw * COST_PER_KW);
  const monthlySavings = Math.round(bill * 0.9);
  const paybackYears = monthlySavings ? Math.round((systemCost / (monthlySavings * 12)) * 10) / 10 : null;

  return {
    recommendedKw: sizeKw,
    estimatedSystemCost: systemCost,
    monthlySavings,
    yearlySavings: monthlySavings * 12,
    paybackYears,
    lifetimeSavings: monthlySavings * 12 * 25,
  };
};

/** Anonymous estimate — no data stored. */
router.route('/calculator/estimate').post(
  catchErrors(async (req, res) => {
    const { monthlyBill, roofArea } = req.body;
    if (!monthlyBill) {
      return res
        .status(400)
        .json({ success: false, result: null, message: 'monthlyBill is required.' });
    }
    return res.status(200).json({
      success: true,
      result: estimate(monthlyBill, roofArea),
      message: 'Estimate calculated',
    });
  })
);

// Crude in-memory throttle: one submission per IP per minute. Enough to stop a
// bored bot filling the pipeline with junk; a real WAF belongs at the edge.
const lastSubmit = new Map();

router.route('/calculator/lead').post(
  catchErrors(async (req, res) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const now = Date.now();
    if (now - (lastSubmit.get(ip) || 0) < 60 * 1000) {
      return res
        .status(429)
        .json({ success: false, result: null, message: 'Please wait a minute and try again.' });
    }

    const { name, mobile, email, city, state, monthlyBill, roofArea } = req.body;
    if (!name || !mobile) {
      return res
        .status(400)
        .json({ success: false, result: null, message: 'name and mobile are required.' });
    }

    const calc = estimate(monthlyBill, roofArea);
    const Lead = mongoose.model('Lead');

    // Whitelist every field: never spread req.body into a public write.
    const lead = await new Lead({
      name: String(name).slice(0, 120),
      mobile: String(mobile).slice(0, 20),
      email: email ? String(email).slice(0, 160) : undefined,
      city: city ? String(city).slice(0, 80) : undefined,
      state: state ? String(state).slice(0, 80) : undefined,
      monthlyBill: Number(monthlyBill) || 0,
      roofArea: roofArea ? Number(roofArea) : undefined,
      estimatedSavings: calc.yearlySavings,
      leadSource: 'Website Solar Calculator',
      status: 'New',
    }).save();

    lastSubmit.set(ip, now);

    return res.status(200).json({
      success: true,
      result: { leadId: lead._id, ...calc },
      message: 'Thanks — our team will contact you shortly.',
    });
  })
);

module.exports = router;
