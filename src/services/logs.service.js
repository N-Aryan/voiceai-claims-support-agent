const { appendSheetRow } = require('./sheets.service');
const { normalizePhone } = require('../utils/normalize');

async function saveCallLog(payload) {
  const timestamp = payload.timestamp || new Date().toISOString();

  await appendSheetRow('call_logs', [
    timestamp,
    payload.caller_name,
    normalizePhone(payload.phone),
    payload.customer_id || '',
    payload.claim_id || '',
    payload.call_summary,
    payload.sentiment,
    payload.outcome,
    String(payload.escalated),
  ]);

  return {
    logged: true,
    message: 'Post-call interaction record saved successfully.',
  };
}

module.exports = { saveCallLog };
