const { getLatestClaimForCustomer } = require('../services/claims.service');

async function getClaimStatus(req, res) {
  const claim = await getLatestClaimForCustomer(req.body.customer_id);

  if (!claim) {
    return res.json({
      found: false,
      message: 'No claim was found for this customer. Offer representative support.',
    });
  }

  return res.json({
    found: true,
    claim_id: claim.claim_id,
    customer_id: claim.customer_id,
    claim_type: claim.claim_type,
    status: claim.status,
    last_updated: claim.last_updated,
    required_documents: claim.required_documents,
    next_step: claim.next_step,
    message: 'Claim status retrieved successfully.',
  });
}

module.exports = { getClaimStatus };
