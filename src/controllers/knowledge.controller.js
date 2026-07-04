const { searchKnowledgeBase } = require('../services/knowledge.service');

async function knowledgeSearch(req, res) {
  const result = await searchKnowledgeBase(req.body.query);
  return res.json(result);
}

module.exports = { knowledgeSearch };
