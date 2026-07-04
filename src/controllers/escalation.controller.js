const { createEscalation } = require('../services/escalation.service');

async function escalate(req, res) {
  const result = await createEscalation(req.body);
  return res.json(result);
}

module.exports = { escalate };
