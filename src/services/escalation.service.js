async function createEscalation(payload = {}) {
  return {
    escalated: true,
    message: 'Representative escalation has been created.',
    customer_id: payload.customer_id || '',
    phone_available: Boolean(payload.phone),
    reason: payload.reason,
  };
}

module.exports = { createEscalation };
