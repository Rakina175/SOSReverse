const { remote } = require('webdriverio');
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const APPIUM_PORT = Number(process.env.APPIUM_PORT || 4723);
const DEFAULT_PLATFORM = process.env.PLATFORM || 'android';
const HOSTS = {
  android: 'http://10.0.2.2:5173',
  ios: 'http://localhost:5173',
};
const RESULTS_DIR = path.join(__dirname, 'results');
const RESULTS_PATH = path.join(RESULTS_DIR, 'appium-test-results.json');

function ensureResultsDir() {
  if (!fs.existsSync(RESULTS_DIR)) {
    fs.mkdirSync(RESULTS_DIR, { recursive: true });
  }
}

function writeResults(payload) {
  ensureResultsDir();
  fs.writeFileSync(RESULTS_PATH, JSON.stringify(payload, null, 2));
  console.log(`Saved Appium results to ${RESULTS_PATH}`);
}

function getCapabilities(platform = DEFAULT_PLATFORM) {
  const normalized = platform.toLowerCase();

  if (normalized === 'ios') {
    return {
      platformName: 'iOS',
      'appium:deviceName': 'iPhone Simulator',
      'appium:platformVersion': '17.0',
      'appium:automationName': 'XCUITest',
      browserName: 'Safari',
      'appium:newCommandTimeout': 240,
    };
  }

  return {
    platformName: 'Android',
    'appium:deviceName': 'Android Emulator',
    'appium:automationName': 'UiAutomator2',
    browserName: 'Chrome',
    'appium:chromeOptions': {
      w3c: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
    },
    'appium:newCommandTimeout': 240,
    'appium:ensureWebviewsHavePages': true,
  };
}

function getOptions(platform = DEFAULT_PLATFORM) {
  return {
    path: '/',
    port: APPIUM_PORT,
    capabilities: getCapabilities(platform),
    logLevel: 'info',
  };
}

function getAppUrl(platform = DEFAULT_PLATFORM, route = '/login') {
  const baseUrl = HOSTS[platform.toLowerCase()] || HOSTS.android;
  return `${baseUrl}${route.startsWith('/') ? route : `/${route}`}`;
}

async function waitForFrontend(driver) {
  await driver.waitUntil(
    async () => {
      const url = await driver.getUrl();
      return url.includes('/login') || url.includes('/dashboard') || url.includes('/volunteer') || url.includes('/admin');
    },
    { timeout: 10000, timeoutMsg: 'Frontend did not reach a known route' }
  );
}

async function loginAs(driver, platform, role) {
  const targetUrl = getAppUrl(platform, '/login');
  await driver.url(targetUrl);
  await waitForFrontend(driver);

  const roleButton = await driver.$(`//button[contains(text(), "${role}")]`);
  await roleButton.scrollIntoView();
  await roleButton.waitForDisplayed({ timeout: 5000 });
  await roleButton.click();

  const emailField = await driver.$('input[type="email"]');
  const passwordField = await driver.$('input[type="password"]');
  const emailValue = await emailField.getValue();
  const passwordValue = await passwordField.getValue();

  assert.ok(emailValue.length > 0, `Expected ${role} autofill to populate email`);
  assert.ok(passwordValue.length > 0, `Expected ${role} autofill to populate password`);

  const submitButton = await driver.$('button[type="submit"]');
  await submitButton.click();
}

async function runAppiumFlow(driver, platform, testCase) {
  switch (testCase.id) {
    case 'citizen-login': {
      await loginAs(driver, platform, 'Citizen');
      await driver.waitUntil(async () => (await driver.getUrl()).includes('/dashboard'), { timeout: 10000, timeoutMsg: 'Expected redirect to /dashboard after citizen login' });
      return;
    }
    case 'volunteer-login': {
      await loginAs(driver, platform, 'Volunteer');
      await driver.waitUntil(async () => (await driver.getUrl()).includes('/volunteer'), { timeout: 10000, timeoutMsg: 'Expected redirect to /volunteer after volunteer login' });
      return;
    }
    case 'admin-login': {
      await loginAs(driver, platform, 'Admin');
      await driver.waitUntil(async () => (await driver.getUrl()).includes('/admin'), { timeout: 10000, timeoutMsg: 'Expected redirect to /admin after admin login' });
      return;
    }
    case 'failed-login': {
      await driver.url(getAppUrl(platform, '/login'));
      await driver.$('input[type="email"]').setValue('unknown@example.com');
      await driver.$('input[type="password"]').setValue('wrongpassword');
      await driver.$('button[type="submit"]').click();
      await driver.$('//div[contains(@class, "bg-rose-500/10")]').waitForDisplayed({ timeout: 5000 });
      return;
    }
    case 'forgot-password': {
      await driver.url(getAppUrl(platform, '/login'));
      await driver.$('//button[contains(text(), "Forgot Password?")]').click();
      await driver.$('//div[contains(@class, "bg-rose-500/10")]').waitForDisplayed({ timeout: 5000 });
      return;
    }
    case 'registration-page': {
      await driver.url(getAppUrl(platform, '/register'));
      await driver.$('//button[contains(text(), "Create Account")]').waitForDisplayed({ timeout: 5000 });
      return;
    }
    case 'landing-page': {
      await driver.url(getAppUrl(platform, '/'));
      await driver.$('body').waitForDisplayed({ timeout: 5000 });
      return;
    }
    default: {
      throw new Error(`Unsupported test case: ${testCase.id}`);
    }
  }
}

async function runMobileFrontendSuite(platform = DEFAULT_PLATFORM) {
  const dryRun = process.argv.includes('--dry-run');
  const testCases = [
    { id: 'citizen-login', name: 'Citizen login and dashboard access' },
    { id: 'volunteer-login', name: 'Volunteer login and volunteer dashboard access' },
    { id: 'admin-login', name: 'Admin login and admin dashboard access' },
    { id: 'failed-login', name: 'Failed login shows inline error' },
    { id: 'forgot-password', name: 'Forgot password validation message' },
    { id: 'registration-page', name: 'Registration page can be reached' },
    { id: 'landing-page', name: 'Landing page loads' },
  ];

  console.log(`Starting Appium frontend E2E suite for ${platform.toUpperCase()}`);

  const results = [];

  if (dryRun) {
    for (const testCase of testCases) {
      results.push({
        id: testCase.id,
        name: testCase.name,
        platform,
        status: 'dry-run',
        details: 'Dry run enabled; Appium session was not started.',
      });
    }
    const payload = { platform, generatedAt: new Date().toISOString(), status: 'dry-run', tests: results };
    writeResults(payload);
    return payload;
  }

  for (const testCase of testCases) {
    let driver;
    try {
      driver = await remote(getOptions(platform));
      await runAppiumFlow(driver, platform, testCase);
      results.push({ id: testCase.id, name: testCase.name, platform, status: 'passed', details: 'Completed successfully' });
      console.log(`PASS: ${testCase.name}`);
    } catch (error) {
      results.push({ id: testCase.id, name: testCase.name, platform, status: 'failed', details: error.message });
      console.log(`FAIL: ${testCase.name} -> ${error.message}`);
    } finally {
      if (driver) {
        try {
          await driver.deleteSession();
        } catch (cleanupError) {
          console.warn(`Session cleanup issue: ${cleanupError.message}`);
        }
      }
    }
  }

  const payload = {
    platform,
    generatedAt: new Date().toISOString(),
    status: results.some((item) => item.status === 'failed') ? 'completed-with-failures' : 'passed',
    tests: results,
  };
  writeResults(payload);
  return payload;
}

if (require.main === module) {
  const platformArg = process.argv[2] || DEFAULT_PLATFORM;
  runMobileFrontendSuite(platformArg)
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { runMobileFrontendSuite, getAppUrl, getCapabilities };
