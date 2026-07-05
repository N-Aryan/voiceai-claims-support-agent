const { appendSheetRow } = require('./sheets.service');
const { normalizePhone } = require('../utils/normalize');

async function saveCallLog(payload) {
  const timestamp = payload.timestamp || new Date().toISOString();
  const callerName = payload.caller_name || 'Unknown caller';
  const phone = payload.phone ? normalizePhone(payload.phone) : '';

  await appendSheetRow('call_logs', [
    timestamp,
    callerName,
    phone,
    payload.customer_id || '',
    payload.claim_id || '',
    payload.call_summary,
    payload.sentiment || 'unknown',
    payload.outcome,
    String(payload.escalated),
  ]);

  return {
    logged: true,
    message: 'Post-call interaction record saved successfully.',
  };
}

module.exports = { saveCallLog };