const express = require('express');

const { knowledgeSearchSchema } = require('../schemas/knowledge.schema');
const { knowledgeSearch } = require('../controllers/knowledge.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/knowledge-search', validate(knowledgeSearchSchema), asyncHandler(knowledgeSearch));

module.exports = router;
