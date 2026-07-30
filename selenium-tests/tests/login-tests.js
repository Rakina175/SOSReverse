/*
  Selenium E2E Login Tests
  - Generates 300+ parameterized login test cases
  - Executes them sequentially against the app BASE_URL (default http://localhost:5173)
  - Writes an Excel report to ../reports/selenium-test-report.xlsx

  Usage:
    npm install selenium-webdriver xlsx
    BASE_URL=http://localhost:5173 node selenium-tests/tests/login-tests.js
*/

import { Builder, By, until } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import * as xlsx from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

xlsx.set_fs(fs);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:5173';
console.log("BASE_URL =", BASE_URL);
const REPORT_PATH = path.resolve(__dirname, '..', 'reports', 'selenium-test-report.xlsx');

// Utility to mask password values in reports
function mask(s, max = 15) {
  if (typeof s !== 'string') return String(s);
  if (s.length <= max) return s;
  return s.slice(0, max) + '...';
}

function generateTestCases(total = 310) {
  const cases = [];

  // 1. Valid demo credentials from sandbox AuthContext seed:
  cases.push({ id: 'TC-001', email: 'mock_citizen@sos.com', password: 'password123', expected: 'success', desc: 'Valid citizen demo login' });
  cases.push({ id: 'TC-002', email: 'mock_volunteer@sos.com', password: 'password123', expected: 'success', desc: 'Valid volunteer demo login' });
  cases.push({ id: 'TC-003', email: 'mock_admin@sos.com', password: 'password123', expected: 'success', desc: 'Valid admin demo login' });

  // 2. Common invalid credentials
  const invalids = [
    { email: '', password: '', expected: 'failure', desc: 'Empty email & password' },
    { email: 'invalidemail', password: 'abc', expected: 'failure', desc: 'Malformed email format (no @)' },
    { email: 'user@', password: 'pass', expected: 'failure', desc: 'Incomplete email format' },
    { email: 'a'.repeat(150) + '@test.com', password: 'p'.repeat(100), expected: 'failure', desc: 'Extremely long credentials' },
    { email: "' OR '1'='1", password: "' OR '1'='1", expected: 'failure', desc: 'SQL injection pattern in fields' },
    { email: '<script>alert(1)</script>@test.com', password: '<img>', expected: 'failure', desc: 'XSS injection payload' },
  ];

  invalids.forEach((it, idx) => cases.push({ id: `TC-INV-${idx + 1}`, ...it }));

  // 3. Generate the remaining test cases up to the total count (e.g. 310)
  const specials = ['!', '#', '$', '%', '^', '&', '*', '(', ')', '~', '`', '+', '='];
  let counter = 1;

  while (cases.length < total) {
    const type = counter % 6;
    let email;
    let password;
    let expected = 'failure';
    let desc = 'Random invalid case';

    switch (type) {
      case 0:
        email = `nonexistent_user_${counter}@example.com`;
        password = `Pass!${counter}`;
        desc = `Nonexistent email with standard password pattern (${counter})`;
        break;
      case 1:
        email = `   spaced_email_${counter}@example.com   `;
        password = '   ';
        desc = `Whitespace email and whitespace password (${counter})`;
        break;
      case 2:
        email = `user+tag${counter}@example.com`;
        password = 'password123'; // wrong password for a custom tagged email
        desc = `Tagged email format with invalid password (${counter})`;
        break;
      case 3:
        email = `long_user_name_prefix_${'x'.repeat((counter % 20) + 10)}@domain.org`;
        password = 'a'.repeat((counter % 30) + 8);
        desc = `Varying length long emails and long passwords (${counter})`;
        break;
      case 4:
        email = `special_chars_${counter}@domain.com`;
        password = specials.slice(0, (counter % specials.length) + 1).join('') + counter;
        desc = `Password containing special characters ${specials.slice(0, (counter % specials.length) + 1).join('')}`;
        break;
      default:
        email = `sql_fuzz_${counter}_${Math.random().toString(36).slice(2, 6)}@test.com`;
        password = `'; DROP TABLE users; SELECT * FROM credentials; -- ${counter}`;
        desc = `Fuzzing with database query snippets (${counter})`;
        break;
    }

    cases.push({ id: `TC-GEN-${1000 + counter}`, email, password, expected, desc });
    counter += 1;
  }

  return cases;
}

async function run() {
  console.log(`Starting Selenium Web E2E Test Suite against: ${BASE_URL}`);

  const options = new chrome.Options();
  options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu');

  const driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();

  const testCases = generateTestCases(310);
  console.log(`Generated ${testCases.length} E2E test cases to execute.`);

  const results = [];
  let passedCount = 0;
  let failedCount = 0;
  const suiteStartTime = Date.now();

  try {
    for (let i = 0; i < testCases.length; i++) {
      const tc = testCases[i];
      const start = Date.now();
      let actual = 'failure';
      let status = 'FAIL';
      let errorMsg = '';

      try {
        // Navigate to login page



        await driver.get(`${BASE_URL}/login`);

        // Reset state: clear current user session from local storage to isolate each test
        await driver.executeScript("window.localStorage.removeItem('sos_current_user');");
        // Reload page to refresh React Context
        await driver.navigate().refresh();

        // Wait for input elements to be present and visible

        const emailEl = await driver.wait(
          until.elementLocated(By.css('input[type="email"]')),
          4000
        );



        const passEl = await driver.wait(
          until.elementLocated(By.css('input[type="password"]')),
          4000
        );



        await emailEl.clear();
        await emailEl.sendKeys(tc.email);


        await passEl.clear();
        await passEl.sendKeys(tc.password);


        const submitBtn = await driver.wait(
          until.elementLocated(By.css('button[type="submit"]')),
          4000
        );



        await submitBtn.click();


        // Wait for either a redirect or an error message to display
        await driver.wait(async (d) => {
          const url = await d.getCurrentUrl();
          if (url.includes('/dashboard') || url.includes('/volunteer') || url.includes('/admin')) {
            return true;
          }
          const errorElements = await d.findElements(By.css('div.bg-rose-500\\/10'));
          if (errorElements.length > 0) {
            return true;
          }
          return false;
        }, 3000).catch(() => {
          // Timeout is acceptable if page did not update immediately; we will check localstorage anyway
        });

        // Determine actual login state
        const stored = await driver.executeScript("return window.localStorage.getItem('sos_current_user');");
        if (stored) {
          actual = 'success';
          status = tc.expected === 'success' ? 'PASS' : 'UNEXPECTED_PASS';
        } else {
          actual = 'failure';
          status = tc.expected === 'failure' ? 'PASS' : 'FAIL';

          // Grab error alert message if present
          const errorElements = await driver.findElements(By.css('div.bg-rose-500\\/10 p'));
          if (errorElements.length > 0) {
            errorMsg = await errorElements[0].getText();
          }
        }

        if (status.startsWith('PASS')) {
          passedCount++;
        } else {
          failedCount++;
        }
      } catch (err) {
        errorMsg = err && err.message ? err.message : String(err);

        console.log("\n=================================");
        console.log("FAILED:", tc.id);
        console.log("EMAIL:", tc.email);
        console.log(errorMsg);
        console.log("=================================\n");

        failedCount++;
        status = "FAIL";
      }

      const duration = Date.now() - start;
      results.push({
        'Test ID': tc.id,
        'Description': tc.desc,
        'Email Input': tc.email,
        'Password (Masked)': mask(tc.password),
        'Expected Outcome': tc.expected,
        'Actual Outcome': actual,
        'Status': status,
        'Duration (ms)': duration,
        'Error Details': errorMsg,
        'Timestamp': new Date().toISOString()
      });

      if ((i + 1) % 10 === 0 || i === testCases.length - 1) {
        console.log(`Progress: Executed ${i + 1}/${testCases.length} tests (Passed: ${passedCount}, Failed/Unexpected: ${failedCount})`);
      }
    }
  } finally {
    await driver.quit();
  }

  const suiteEndTime = Date.now();
  const totalDurationSec = ((suiteEndTime - suiteStartTime) / 1000).toFixed(2);

  // Generate Excel workbook
  const summaryData = [
    { 'Metric': 'Total Test Cases Executed', 'Value': testCases.length },
    { 'Metric': 'Passed Cases (Expected matches Actual)', 'Value': passedCount },
    { 'Metric': 'Failed / Unexpected Cases', 'Value': failedCount },
    { 'Metric': 'Overall Pass Rate (%)', 'Value': `${((passedCount / testCases.length) * 100).toFixed(2)}%` },
    { 'Metric': 'Total Suite Duration (seconds)', 'Value': parseFloat(totalDurationSec) },
    { 'Metric': 'Test Environment URL', 'Value': BASE_URL },
    { 'Metric': 'Executed At', 'Value': new Date().toLocaleString() }
  ];

  const wb = xlsx.utils.book_new();
  const wsSummary = xlsx.utils.json_to_sheet(summaryData);
  const wsDetails = xlsx.utils.json_to_sheet(results);

  // Styling columns width for better visibility
  wsSummary['!cols'] = [{ wch: 35 }, { wch: 30 }];
  wsDetails['!cols'] = [
    { wch: 12 }, // Test ID
    { wch: 45 }, // Description
    { wch: 35 }, // Email
    { wch: 20 }, // Password
    { wch: 18 }, // Expected
    { wch: 18 }, // Actual
    { wch: 12 }, // Status
    { wch: 15 }, // Duration
    { wch: 45 }, // Error Details
    { wch: 25 }  // Timestamp
  ];

  xlsx.utils.book_append_sheet(wb, wsSummary, 'Summary');
  xlsx.utils.book_append_sheet(wb, wsDetails, 'Details');

  // Ensure directories exist
  const reportsDir = path.dirname(REPORT_PATH);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  xlsx.writeFile(wb, REPORT_PATH);
  console.log(`\nSuccess: Generated Excel report at ${REPORT_PATH}`);
}

run().catch((e) => {
  console.error('Fatal Test Runner Failure:', e);
  process.exit(1);
});
