/*
  Selenium E2E Login Tests
  - Generates 300+ parameterized login test cases
  - Executes them sequentially against the app `BASE_URL` (default http://localhost:5173)
  - Writes an Excel report to ../reports/selenium-test-report.xlsx

  Usage:
    npm install selenium-webdriver xlsx
    BASE_URL=http://localhost:5173 node selenium-tests/tests/login-tests.js

  Notes:
  - Adjust selectors or BASE_URL as needed for your environment.
  - The script uses localStorage check to infer successful login (sos_current_user).
*/

const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const REPORT_PATH = path.resolve(__dirname, '..', 'reports', 'selenium-test-report.xlsx');

// Utility to mask long values in reports
function mask(s, max = 40) {
  if (typeof s !== 'string') return String(s);
  if (s.length <= max) return s;
  return s.slice(0, max) + '...';
}

function generateTestCases(total = 300) {
  const cases = [];

  // Add a few known demo valid credentials (may succeed if seeded):
  cases.push({ id: 'TC-001', email: 'mock_citizen@sos.com', password: 'password123', expected: 'success', desc: 'Valid citizen demo' });
  cases.push({ id: 'TC-002', email: 'mock_volunteer@sos.com', password: 'password123', expected: 'success', desc: 'Valid volunteer demo' });
  cases.push({ id: 'TC-003', email: 'mock_admin@sos.com', password: 'password123', expected: 'success', desc: 'Valid admin demo' });

  // Common invalid cases
  const invalids = [
    { email: '', password: '', expected: 'failure', desc: 'Empty email & password' },
    { email: 'invalidemail', password: 'abc', expected: 'failure', desc: 'Malformed email' },
    { email: 'user@', password: 'pass', expected: 'failure', desc: 'Incomplete email' },
    { email: 'a'.repeat(300) + '@x.com', password: 'p'.repeat(300), expected: 'failure', desc: 'Very long credentials' },
    { email: "' OR '1'='1", password: "' OR '1'='1", expected: 'failure', desc: 'SQL injection pattern' },
    { email: '<script>alert(1)</script>@x.com', password: '<img>', expected: 'failure', desc: 'XSS payload' },
  ];

  invalids.forEach((it, idx) => cases.push({ id: `TC-INV-${idx + 1}`, ...it }));

  // Generate variations: numeric, random, special-chars
  const specials = ['!', '#', '$', '%', '^', '&', '*', '(', ')', '~', '`', '+', '='];
  let counter = 1;

  while (cases.length < total) {
    const type = counter % 6;
    let email;
    let password;
    let expected = 'failure';
    let desc = 'Random negative case';

    switch (type) {
      case 0:
        email = `test_user_${counter}@example.com`;
        password = `Pass!${counter}`;
        break;
      case 1:
        // whitespace email
        email = `  spaced_${counter}@x.com  `;
        password = '  ';
        break;
      case 2:
        email = `user+${counter}@example.com`;
        password = 'p@ssw0rd';
        break;
      case 3:
        email = `long${'x'.repeat((counter % 40) + 5)}@example.com`;
        password = 'p'.repeat((counter % 50) + 1);
        break;
      case 4:
        email = `admin${counter}@example.com`;
        password = specials.join('') + counter;
        break;
      default:
        // SQL-like fuzz
        email = `fuzz_${counter}_${Math.random().toString(36).slice(2, 8)}@test.com`;
        password = `'; DROP TABLE users; -- ${counter}`;
        break;
    }

    // designate some as expected success rarely (to allow for positive tests)
    if (counter % 100 === 0) {
      expected = 'success';
      desc = 'Occasional positive candidate (may pass if account exists)';
    }

    cases.push({ id: `TC-${1000 + counter}`, email, password, expected, desc });
    counter += 1;
  }

  return cases.slice(0, total);
}

async function run() {
  // Build Chrome driver (uses Selenium Manager to auto-download driver if necessary)
  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  const testCases = generateTestCases(300);
  const results = [];
  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const start = Date.now();
    let status = 'FAIL';
    let actual = 'failure';
    let errorMsg = '';

    try {
      await driver.get(`${BASE_URL}/login`);

      // Wait for email input
      const emailEl = await driver.wait(until.elementLocated(By.css('input[type="email"]')), 3000);
      const passEl = await driver.wait(until.elementLocated(By.css('input[type="password"]')), 3000);

      // Clear and type
      await emailEl.clear();
      await emailEl.sendKeys(tc.email);
      await passEl.clear();
      await passEl.sendKeys(tc.password);

      // Submit
      const submit = await driver.findElement(By.css('button[type="submit"]'));
      await submit.click();

      // Allow a short wait for login action
      await driver.sleep(600);

      // Check localStorage for sos_current_user to determine success
      const stored = await driver.executeScript("return window.localStorage.getItem('sos_current_user');");
      if (stored) {
        actual = 'success';
        status = tc.expected === 'success' ? 'PASS' : 'UNEXPECTED_PASS';
      } else {
        actual = 'failure';
        status = tc.expected === 'failure' ? 'PASS' : 'FAIL';
      }

      if (status.startsWith('PASS')) passed++;
      else failed++;
    } catch (err) {
      errorMsg = (err && err.message) ? err.message : String(err);
      failed++;
    }

    const duration = Date.now() - start;
    results.push({
      TestID: tc.id,
      Email: tc.email,
      Password: mask(tc.password, 30),
      Expected: tc.expected,
      Actual: actual,
      Status: status,
      Error: errorMsg,
      DurationMs: duration,
      Timestamp: new Date().toISOString(),
      Description: tc.desc,
    });

    // Simple progress log
    process.stdout.write(`\rExecuted ${results.length}/${testCases.length} - Last: ${tc.id} -> ${status}`);
  }

  await driver.quit();

  // Build workbook
  const summary = [{ Key: 'TotalTests', Value: testCases.length }, { Key: 'Passed', Value: passed }, { Key: 'Failed', Value: failed }, { Key: 'GeneratedAt', Value: new Date().toISOString() }];
  const wb = xlsx.utils.book_new();
  const wsSummary = xlsx.utils.json_to_sheet(summary);
  const wsDetails = xlsx.utils.json_to_sheet(results);
  xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');
  xlsx.utils.book_append_sheet(wb, wsDetails, 'Details');

  // Ensure reports dir exists
  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  xlsx.writeFile(wb, REPORT_PATH);

  console.log(`\n\nFinished. Report written to ${REPORT_PATH}`);
}

run().catch((e) => {
  console.error('Test runner failed:', e);
  process.exit(1);
});
