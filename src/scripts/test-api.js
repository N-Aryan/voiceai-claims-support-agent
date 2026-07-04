require('dotenv').config();

const baseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const fixtures = {
  phoneFound: process.env.TEST_PHONE_FOUND || '9876543210',
  phoneNotFound: process.env.TEST_PHONE_NOT_FOUND || '0000000000',
  dobValid: process.env.TEST_DOB_VALID || '1994-05-12',
  dobInvalid: process.env.TEST_DOB_INVALID || '1990-01-01',
  customerId: process.env.TEST_CUSTOMER_ID || 'CUST001',
  claimId: process.env.TEST_CLAIM_ID || 'CLM1001',
  faqQuery: process.env.TEST_FAQ_QUERY || 'How do I submit missing documents?',
  officeHoursQuery: process.env.TEST_FAQ_OFFICE_HOURS_QUERY || 'What are your office hours?',
};

let passed = 0;
let failed = 0;

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : {};

  return { status: response.status, data };
}

function expect(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function runTest(name, testFn) {
  try {
    await testFn();
    passed += 1;
    console.log(`PASS ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`FAIL ${name}`);
    console.log(`  ${error.message}`);
  }
}

function expectSuccessEnvelope(data, fieldName) {
  expect(Object.prototype.hasOwnProperty.call(data, fieldName), `Missing "${fieldName}" in response.`);
}

async function main() {
  console.log(`Testing API at ${baseUrl}`);

  await runTest('health', async () => {
    const { status, data } = await request('GET', '/health');
    expect(status === 200, `Expected 200, received ${status}.`);
    expect(data.status === 'ok', 'Expected status=ok.');
    expect(data.service === 'observe-insurance-claims-agent', 'Unexpected service name.');
  });

  await runTest('lookup-customer happy path', async () => {
    const { status, data } = await request('POST', '/lookup-customer', {
      phone: fixtures.phoneFound,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expectSuccessEnvelope(data, 'found');
    expect(data.found === true, 'Expected found=true. Update TEST_PHONE_FOUND to match your sheet fixture.');
    expect(data.customer_id === fixtures.customerId, 'Unexpected customer_id in lookup response.');
  });

  await runTest('lookup-customer not found', async () => {
    const { status, data } = await request('POST', '/lookup-customer', {
      phone: fixtures.phoneNotFound,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expect(data.found === false, 'Expected found=false for the not found test fixture.');
  });

  await runTest('verify-customer success', async () => {
    const { status, data } = await request('POST', '/verify-customer', {
      phone: fixtures.phoneFound,
      dob: fixtures.dobValid,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expectSuccessEnvelope(data, 'authenticated');
    expect(
      data.authenticated === true,
      'Expected authenticated=true. Update TEST_PHONE_FOUND and TEST_DOB_VALID to match your sheet fixture.',
    );
  });

  await runTest('verify-customer failure', async () => {
    const { status, data } = await request('POST', '/verify-customer', {
      phone: fixtures.phoneFound,
      dob: fixtures.dobInvalid,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expect(data.authenticated === false, 'Expected authenticated=false for the invalid DOB fixture.');
  });

  await runTest('get-claim-status', async () => {
    const { status, data } = await request('POST', '/get-claim-status', {
      customer_id: fixtures.customerId,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expectSuccessEnvelope(data, 'found');
    expect(data.found === true, 'Expected found=true. Update TEST_CUSTOMER_ID to match your claim fixture.');
  });

  await runTest('knowledge-search', async () => {
    const { status, data } = await request('POST', '/knowledge-search', {
      query: fixtures.faqQuery,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expectSuccessEnvelope(data, 'found');
    expect(data.found === true, 'Expected found=true for the missing documents FAQ query.');
    expect(typeof data.answer === 'string' && data.answer.length > 0, 'Expected answer text in knowledge-search response.');
    expect(Array.isArray(data.sources) && data.sources.length >= 1, 'Expected at least one knowledge source.');
    expect(data.retrieval_mode === 'gemini_rag', 'Expected retrieval_mode=gemini_rag.');
  });

  await runTest('knowledge-search office hours', async () => {
    const { status, data } = await request('POST', '/knowledge-search', {
      query: fixtures.officeHoursQuery,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expectSuccessEnvelope(data, 'found');
    expect(data.found === true, 'Expected found=true for the office hours FAQ query.');
    expect(typeof data.answer === 'string' && data.answer.length > 0, 'Expected answer text in office hours response.');
    expect(Array.isArray(data.sources) && data.sources.length >= 1, 'Expected at least one office hours source.');
    expect(data.retrieval_mode === 'gemini_rag', 'Expected retrieval_mode=gemini_rag.');
    expect(
      data.sources.some((source) => /office\s*hours/i.test(source.title || '')),
      'Expected an Office Hours source. Update TEST_FAQ_OFFICE_HOURS_QUERY or the sheet fixture if needed.',
    );
  });

  await runTest('escalate', async () => {
    const { status, data } = await request('POST', '/escalate', {
      customer_id: fixtures.customerId,
      phone: fixtures.phoneFound,
      reason: 'Caller requested a human representative',
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expect(data.escalated === true, 'Expected escalated=true.');
  });

  await runTest('log-call', async () => {
    const { status, data } = await request('POST', '/log-call', {
      caller_name: 'Rahul Sharma',
      phone: fixtures.phoneFound,
      customer_id: fixtures.customerId,
      claim_id: fixtures.claimId,
      call_summary:
        'Caller checked claim status. The approved claim status and payment timeline were shared.',
      sentiment: 'neutral',
      outcome: 'claim_status_shared',
      escalated: false,
    });

    expect(status === 200, `Expected 200, received ${status}.`);
    expect(data.logged === true, 'Expected logged=true.');
  });

  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  console.error('FAIL test runner');
  console.error(`  ${error.message}`);
  process.exit(1);
});
