const { Builder, By, until } = require('selenium-webdriver');
const assert = require('assert');

const BASE_URL = process.env.SELENIUM_BASE_URL || 'http://localhost:5173';
const TIMEOUT = 5000;

async function createDriver() {
  const chrome = require('selenium-webdriver/chrome');
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
  const passwordInput = await driver.findElement(By.css("input[type='password']"));
  const emailValue = await emailInput.getAttribute('value');
  const passwordValue = await passwordInput.getAttribute('value');
  assert.ok(emailValue.length > 0, `Expected ${role} autofill to populate email`);
  assert.ok(passwordValue.length > 0, `Expected ${role} autofill to populate password`);
  const submitButton = await driver.findElement(By.css("button[type='submit']"));
  await submitButton.click();
  return emailValue;
}

const tests = [
  {
    name: 'TC-01: Citizen login and dashboard access',
    fn: async (driver) => {
      await loginAs(driver, 'Citizen');
      await driver.wait(until.urlContains('/dashboard'), TIMEOUT);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/dashboard'));
    },
  },
  {
    name: 'TC-02: Volunteer login and volunteer dashboard access',
    fn: async (driver) => {
      await loginAs(driver, 'Volunteer');
      await driver.wait(until.urlContains('/volunteer'), TIMEOUT);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/volunteer'));
    },
  },
  {
    name: 'TC-03: Admin login and admin dashboard access',
    fn: async (driver) => {
      await loginAs(driver, 'Admin');
      await driver.wait(until.urlContains('/admin'), TIMEOUT);
      const currentUrl = await driver.getCurrentUrl();
      assert.ok(currentUrl.includes('/admin'));
    },
  },
  {
    name: 'TC-04: Failed login shows inline error',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/login`);
      const emailInput = await driver.wait(until.elementLocated(By.css("input[type='email']")), TIMEOUT);
      const passwordInput = await driver.findElement(By.css("input[type='password']"));
      await emailInput.sendKeys('unknown@example.com');
      await passwordInput.sendKeys('wrongpassword');
      await driver.findElement(By.css("button[type='submit']")).click();
      await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'bg-rose-500/10')]")), TIMEOUT);
    },
  },
  {
    name: 'TC-05: Forgot password validation message',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/login`);
      await driver.findElement(By.xpath("//button[contains(text(), 'Forgot Password?')]"));
      await driver.findElement(By.xpath("//button[contains(text(), 'Forgot Password?')]")).click();
      await driver.wait(until.elementLocated(By.xpath("//div[contains(@class, 'bg-rose-500/10')]")), TIMEOUT);
    },
  },
  {
    name: 'TC-06: Registration page can be reached',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/register`);
      await driver.wait(until.elementLocated(By.xpath("//button[contains(text(), 'Create Account')]")), TIMEOUT);
    },
  },
  {
    name: 'TC-07: Landing page loads',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/`);
      await driver.wait(until.elementLocated(By.tagName('body')), TIMEOUT);
    },
  },
  {
    name: 'TC-08: Protected route redirects unauthenticated users',
    fn: async (driver) => {
      await driver.get(`${BASE_URL}/dashboard`);
      await driver.wait(until.urlContains('/login'), TIMEOUT);
    },
  },
];

async function runSuite() {
  console.log('Starting Selenium web E2E suite...');
  let passed = 0;
  let failed = 0;
  const results = [];

  for (const test of tests) {
    const driver = await createDriver();
    try {
      await test.fn(driver);
      passed += 1;
      results.push({ name: test.name, status: 'Passed', details: 'Completed successfully' });
      console.log(`PASS: ${test.name}`);
    } catch (error) {
      failed += 1;
      results.push({ name: test.name, status: 'Failed', details: error.message });
      console.log(`FAIL: ${test.name} -> ${error.message}`);
    } finally {
      await driver.quit();
    }
  }

  console.log(`Total: ${results.length}; Passed: ${passed}; Failed: ${failed}`);
  return { results, passed, failed };
}

if (require.main === module) {
  runSuite().then(() => process.exit(0)).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { runSuite };
