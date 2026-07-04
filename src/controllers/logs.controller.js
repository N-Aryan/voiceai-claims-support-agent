const { saveCallLog } = require('../services/logs.service');

async function logCall(req, res) {
  const result = await saveCallLog(req.body);
  return res.json(result);
}

module.exports = { logCall };
