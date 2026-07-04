const express = require('express');

const { lookupCustomerSchema, verifyCustomerSchema } = require('../schemas/customer.schema');
const { lookupCustomer, verifyCustomer } = require('../controllers/customer.controller');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/lookup-customer', validate(lookupCustomerSchema), asyncHandler(lookupCustomer));
router.post('/verify-customer', validate(verifyCustomerSchema), asyncHandler(verifyCustomer));

module.exports = router;
