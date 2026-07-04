const express = require('express');

const { getClaimStatusSchema } = require('../schemas/claims.schema');
const { getClaimStatus } = require('../controllers/claims.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/get-claim-status', validate(getClaimStatusSchema), asyncHandler(getClaimStatus));

module.exports = router;
