/*
  Appium Mobile Frontend Login Tests Runner
  - Generates 300 parameterized login test cases
  - Uses existing appium-tests/appium-login-tests.cjs helpers (getOptions, getAppUrl)
  - Executes tests via WebdriverIO remote (Appium)
  - Writes Excel report to ../reports/appium-mobile-test-report-300.xlsx

  Usage:
    npm install webdriverio xlsx
    node appium-tests/tests/appium-login-tests.js android

  Notes:
  - Requires Appium server running (default http://localhost:4723)
  - Adjust platform arg (android|ios) as needed
*/

const { remote } = require('webdriverio');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// Reuse helpers from existing cjs runner
const helpers = require('../appium-login-tests.cjs');
const { getOptions, getAppUrl } = helpers;

const PLATFORM = process.argv[2] || 'android';
const REPORT_PATH = path.join(__dirname, '..', 'reports', `appium-mobile-test-report-300.xlsx`);

function mask(s, max = 40) {
  if (typeof s !== 'string') return String(s);
  if (s.length <= max) return s;
  return s.slice(0, max) + '...';
}

function generateTestCases(total = 300) {
  const cases = [];
  // include a few canonical cases
  cases.push({ id: 'TC-0001', email: 'mock_citizen@sos.com', password: 'password123', expected: 'success', desc: 'Citizen demo' });
  cases.push({ id: 'TC-0002', email: 'mock_volunteer@sos.com', password: 'password123', expected: 'success', desc: 'Volunteer demo' });
  cases.push({ id: 'TC-0003', email: 'mock_admin@sos.com', password: 'password123', expected: 'success', desc: 'Admin demo' });

  let counter = 4;
  const specials = ['!', '#', '$', '%', '^', '&', '*', '(', ')', '~', '`', '+', '='];
  while (cases.length < total) {
    const t = counter % 6;
    let email;
    let password;
    let expected = 'failure';
    let desc = 'Generated negative case';

    switch (t) {
      case 0:
        email = `auto_user_${counter}@example.com`;
        password = `Pass${counter}!`;
        break;
      case 1:
        email = `user+${counter}@example.com`;
        password = 'p@ssw0rd';
        break;
      case 2:
        email = `long${'x'.repeat(counter % 50)}@example.com`;
        password = 'p'.repeat((counter % 40) + 1);
        break;
      case 3:
        email = `fuzz-${Math.random().toString(36).slice(2,8)}@test.org`;
        password = `'; DROP TABLE users; -- ${counter}`;
        break;
      case 4:
        email = `test${counter}@example.com`;
        password = specials.join('') + counter;
        break;
      default:
        email = `spaced ${counter}@x.com`;
        password = '   ';
        break;
    }

    // Occasionally mark expected success
    if (counter % 97 === 0) {
      expected = 'success';
      desc = 'Occasional positive candidate (may pass if account exists)';
    }

    cases.push({ id: `TC-${String(counter).padStart(4, '0')}`, email, password, expected, desc });
    counter += 1;
  }

  return cases.slice(0, total);
}

async function run() {
  const testCases = generateTestCases(300);
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const start = Date.now();
    let driver;
    const out = {
      TestID: tc.id,
      Email: tc.email,
      Password: mask(tc.password, 30),
      Expected: tc.expected,
      Actual: 'failure',
      Status: 'FAIL',
      Error: '',
      DurationMs: 0,
      Timestamp: new Date().toISOString(),
      Description: tc.desc,
    };

    try {
      driver = await remote(getOptions(PLATFORM));
      // navigate to login
      await driver.url(getAppUrl(PLATFORM, '/login'));
      // allow page to settle
      await driver.pause(800);

      // fill if inputs present
      const emailEl = await driver.$('input[type="email"]');
      const passEl = await driver.$('input[type="password"]');

      await emailEl.waitForDisplayed({ timeout: 5000 });
      await passEl.waitForDisplayed({ timeout: 5000 });

      await emailEl.clearValue();
      await emailEl.setValue(tc.email);
      await passEl.clearValue();
      await passEl.setValue(tc.password);

      const submit = await driver.$('button[type="submit"]');
      await submit.click();

      // short wait for navigation or localStorage change
      await driver.pause(800);

      // check localStorage for sos_current_user
      const stored = await driver.execute(() => window.localStorage.getItem('sos_current_user'));
      if (stored) {
        out.Actual = 'success';
        out.Status = tc.expected === 'success' ? 'PASS' : 'UNEXPECTED_PASS';
      } else {
        out.Actual = 'failure';
        out.Status = tc.expected === 'failure' ? 'PASS' : 'FAIL';
      }

      if (out.Status.startsWith('PASS')) passed++; else failed++;
    } catch (err) {
      out.Error = err && err.message ? err.message : String(err);
      failed++;
    } finally {
      if (driver) {
        try { await driver.deleteSession(); } catch (e) {};
      }
      out.DurationMs = Date.now() - start;
      results.push(out);
      process.stdout.write(`\rExecuted ${results.length}/${testCases.length} - Last: ${tc.id} -> ${out.Status}`);
    }
  }

  // write excel
  const summary = [
    { Key: 'TotalTests', Value: testCases.length },
    { Key: 'Passed', Value: passed },
    { Key: 'Failed', Value: failed },
    { Key: 'GeneratedAt', Value: new Date().toISOString() },
    { Key: 'Platform', Value: PLATFORM }
  ];

  const wb = xlsx.utils.book_new();
  const wsSummary = xlsx.utils.json_to_sheet(summary);
  const wsDetails = xlsx.utils.json_to_sheet(results);
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');
  xlsx.utils.book_append_sheet(wb, wsDetails, 'Details');

  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  xlsx.writeFile(wb, REPORT_PATH);
  console.log(`\nFinished. Report written to ${REPORT_PATH}`);
}

run().catch((e) => {
  console.error('Appium runner failed:', e);
  process.exit(1);
});
