async function createEscalation() {
  return {
    escalated: true,
    message: 'Representative escalation has been created for the customer.',
  };
}

module.exports = { createEscalation };
