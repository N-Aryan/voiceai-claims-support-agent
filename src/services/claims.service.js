const { getSheetRows } = require('./sheets.service');
const { toSortableTimestamp } = require('../utils/normalize');

async function getLatestClaimForCustomer(customerId) {
  const claims = await getSheetRows('claims');
  const matchingClaims = claims.filter((claim) => claim.customer_id === customerId);

  if (matchingClaims.length === 0) {
    return null;
  }

  // If a customer has multiple claims, the voice workflow should read back the most recently updated one.
  matchingClaims.sort(
    (left, right) => toSortableTimestamp(right.last_updated) - toSortableTimestamp(left.last_updated),
  );

  return matchingClaims[0];
}

module.exports = { getLatestClaimForCustomer };
