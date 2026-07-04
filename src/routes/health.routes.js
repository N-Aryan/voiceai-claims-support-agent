const express = require('express');

const { env } = require('../config/env');

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'observe-insurance-claims-agent',
    timestamp: new Date().toISOString(),
    google_configured: env.googleConfigured,
    llm_configured: env.llmConfigured,
  });
});

module.exports = router;
