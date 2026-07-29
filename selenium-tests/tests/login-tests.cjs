const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.SELENIUM_BASE_URL || 'http://127.0.0.1:5173';
const TIMEOUT = 10000;
const RESULTS_DIR = path.join(__dirname, '../results');
const RESULTS_PATH = path.join(RESULTS_DIR, 'selenium-test-results.json');

function ensureDirectory(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function createDriver() {
  const options = new chrome.Options();
  options.addArguments('--headless=new');
  options.addArguments('--no-sandbox');
  options.addArguments('--disable-dev-shm-usage');
  options.addArguments('--disable-gpu');
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
}

async function loginAs(driver, role) {
  await driver.get(`${BASE_URL}/login`);
  const button = await driver.wait(until.elementLocated(By.xpath(`//button[contains(text(), '${role}')]`)), TIMEOUT);
  await button.click();
  const emailInput = await driver.wait(until.elementLocated(By.css("input[type='email']")), TIMEOUT);
  const passwordInput = await driver.wait(until.elementLocated(By.css("input[type='password']")), TIMEOUT);
  const emailValue = await emailInput.getAttribute('value');
  const passwordValue = await passwordInput.getAttribute('value');
  assert.ok(emailValue.length > 0, `Expected ${role} autofill to populate email`);
  assert.ok(passwordValue.length > 0, `Expected ${role} autofill to populate password`);
  const submitButton = await driver.wait(until.elementLocated(By.css("button[type='submit']")), TIMEOUT);
  await submitButton.click();
}

const tests = [
  {
    id: 'TC001',
    name: 'Citizen login and dashboard access',
    fn: async (driver) => {
      await loginAs(driver, 'Citizen');
      await driver.wait(until.urlContains('/dashboard'), TIMEOUT);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/dashboard'));
    },
  },
  {
    id: 'TC002',
    name: 'Volunteer login and volunteer dashboard access',
    fn: async (driver) => {
      await loginAs(driver, 'Volunteer');
      await driver.wait(until.urlContains('/volunteer'), TIMEOUT);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/volunteer'));
    },
  },
  {
    id: 'TC003',
    name: 'Admin login and admin dashboard access',
    fn: async (driver) => {
      await loginAs(driver, 'Admin');
      await driver.wait(until.urlContains('/admin'), TIMEOUT);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/admin'));
    },
  },
  {
    id: 'TC004',
    name: 'Failed login shows inline error',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.wait(until.elementLocated(By.css("input[type='email']")), TIMEOUT);
      const passwordInput = await driver.wait(until.elementLocated(By.css("input[type='password']")), TIMEOUT);
      await emailInput.sendKeys('unknown@example.com');
      await passwordInput.sendKeys('wrongpassword');
      const submitButton = await driver.wait(until.elementLocated(By.css("button[type='submit']")), TIMEOUT);
      await submitButton.click();
      await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'bg-rose-500/10')]")), TIMEOUT);
    },
  },
  {
    id: 'TC005',
    name: 'Forgot password validation message',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/login`);
      const forgotButton = await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Forgot Password?')]")), TIMEOUT);
      await forgotButton.click();
      await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'bg-rose-500/10')]")), TIMEOUT);
    },
  },
  {
    id: 'TC006',
    name: 'Registration page can be reached',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/register`);

      // Wait until the registration form is visible
      await driver.wait(
        until.elementLocated(By.css("form")),
        TIMEOUT
      );

      // Verify the submit button exists
      const submitButton = await driver.wait(
        until.elementLocated(By.css("button[type='submit']")),
        TIMEOUT
      );

      const text = await submitButton.getText();

      assert.ok(
        text.includes("Register Account Profile"),
        `Unexpected button text: ${text}`
      );
    },
  },
  {
    id: 'TC007',
    name: 'Landing page loads',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/`);
      await driver.wait(until.elementLocated(By.tagName('body')), TIMEOUT);
    },
  },
  {
    id: 'TC008',
    name: 'Protected route redirects unauthenticated users',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/dashboard`);
      await driver.wait(until.urlContains('/login'), TIMEOUT);
    },
  },
];

async function runSuite() {
  console.log('Starting Selenium web E2E suite...');
  ensureDirectory(RESULTS_DIR);
  const results = [];
  let failedCount = 0;

  for (const test of tests) {
    const start = Date.now();
    let driver;
    let status = 'PASS';
    let remarks = 'Success';

    try {
      driver = await createDriver();
      await test.fn(driver);
      console.log(`PASS: ${test.name}`);
    } catch (error) {
      failedCount += 1;
      status = 'FAIL';
      remarks = error.message || String(error);
      console.error(`FAIL: ${test.name} -> ${remarks}`);
    } finally {
      if (driver) {
        try {
          await driver.quit();
        } catch (cleanupError) {
          console.warn(`Cleanup warning: ${cleanupError.message}`);
        }
      }
      const durationMs = Date.now() - start;
      results.push({
        id: test.id,
        name: test.name,
        status,
        executionTime: `${(durationMs / 1000).toFixed(2)} sec`,
        timestamp: new Date().toISOString(),
        remarks,
      });
    }
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    status: failedCount === 0 ? 'passed' : 'completed-with-failures',
    tests: results,
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(payload, null, 2));
  console.log(`Saved Selenium JSON results to ${RESULTS_PATH}`);
  if (failedCount > 0) process.exitCode = 1;
  return payload;
}

if (require.main === module) {
  runSuite().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { runSuite };
