const mongoose = require('mongoose');

/**
 * Price a quotation: line items → GST → subsidies → net customer cost.
 *
 * Central subsidy follows the PM Surya Ghar slabs (as of 2026): ₹30,000 for the
 * first kW, ₹18,000 for the second, ₹78,000 flat from 3 kW up. It is a step
 * function, not a rate, which is why it cannot be expressed as ₹/kW like the
 * state rules are.
 *
 * State subsidy comes from the SubsidyRule table, matched on the lead's state,
 * and is always min(perKw × size, cap).
 *
 * Returns the numbers; the caller decides whether to persist them.
 */
const centralSubsidyFor = (kw) => {
  if (!kw || kw <= 0) return 0;
  if (kw <= 1) return Math.round(30000 * kw);
  if (kw <= 2) return Math.round(30000 + 18000 * (kw - 1));
  return 78000;
};

const calculate = async ({ items = [], systemSizeKw = 0, state }) => {
  let subTotal = 0;
  let taxTotal = 0;

  const pricedItems = items.map((item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const gstPercent = Number(item.gstPercent) || 0;

    const base = qty * rate;
    const gst = (base * gstPercent) / 100;

    subTotal += base;
    taxTotal += gst;

    return { ...item, lineTotal: Math.round((base + gst) * 100) / 100 };
  });

  const grandTotal = Math.round((subTotal + taxTotal) * 100) / 100;
  const centralSubsidy = centralSubsidyFor(Number(systemSizeKw));

  let stateSubsidy = 0;
  if (state) {
    const SubsidyRule = mongoose.model('SubsidyRule');
    const rule = await SubsidyRule.findOne({
      state: new RegExp(`^${state.trim()}$`, 'i'),
      removed: false,
      enabled: true,
    });
    if (rule) {
      stateSubsidy = Math.min(rule.subsidyPerKw * Number(systemSizeKw), rule.maxCap);
    }
  }

  // A subsidy can never exceed the bill — otherwise the customer "earns" money.
  const totalSubsidy = Math.min(centralSubsidy + stateSubsidy, grandTotal);
  const netCustomerCost = Math.round((grandTotal - totalSubsidy) * 100) / 100;

  return {
    items: pricedItems,
    subTotal: Math.round(subTotal * 100) / 100,
    taxTotal: Math.round(taxTotal * 100) / 100,
    grandTotal,
    centralSubsidy,
    stateSubsidy: Math.round(stateSubsidy),
    netCustomerCost,
  };
};

module.exports = calculate;
module.exports.centralSubsidyFor = centralSubsidyFor;
