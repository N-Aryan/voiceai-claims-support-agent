const express = require('express');

const { logCallSchema } = require('../schemas/logs.schema');
const { logCall } = require('../controllers/logs.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/log-call', validate(logCallSchema), asyncHandler(logCall));

module.exports = router;
