const express = require('express');

const { escalateSchema } = require('../schemas/escalation.schema');
const { escalate } = require('../controllers/escalation.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/escalate', validate(escalateSchema), asyncHandler(escalate));

module.exports = router;
