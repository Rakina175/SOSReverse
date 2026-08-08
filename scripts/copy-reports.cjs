const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function copyFile(src, dest) {
  try {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
      console.log(`Copied ${path.basename(src)} to ${dest}`);
    } else {
      console.warn(`Source report not found: ${src}`);
    }
  } catch (e) {
    console.error(`Failed to copy ${src} to ${dest}:`, e);
  }
}

function main() {
  ensureDir(REPORTS_DIR);

  // Copy Selenium report
  const seleniumSrc = path.join(ROOT, 'selenium-tests', 'reports', 'selenium-test-report.xlsx');
  const seleniumDest = path.join(REPORTS_DIR, 'Selenium Report.xlsx');
  copyFile(seleniumSrc, seleniumDest);

  // Copy Appium report
  const appiumSrc = path.join(ROOT, 'appium-tests', 'reports', 'appium-mobile-test-report.xlsx');
  const appiumDest = path.join(REPORTS_DIR, 'Appium Report.xlsx');
  copyFile(appiumSrc, appiumDest);

  // Copy Load Test report
  const loadSrc = path.join(ROOT, 'load-tests', 'reports', 'load-test-report.xlsx');
  const loadDest = path.join(REPORTS_DIR, 'Load Test Report.xlsx');
  copyFile(loadSrc, loadDest);

  // Copy Security Findings report
  const securitySrc = path.join(ROOT, 'Vulnerability Test Results', 'findings.xlsx');
  const securityDest = path.join(REPORTS_DIR, 'Security Findings.xlsx');
  copyFile(securitySrc, securityDest);

  // Run Executive Summary generation
  try {
    console.log('Generating consolidated Executive Summary...');
    execSync('node scripts/generate-executive-summary.cjs', { stdio: 'inherit', cwd: ROOT });
  } catch (e) {
    console.error('Failed to run generate-executive-summary.cjs:', e);
  }

  // Run Consolidated Total Report generation
  try {
    console.log('Generating Grand Consolidated Total Report...');
    execSync('node scripts/generate-total-report.cjs', { stdio: 'inherit', cwd: ROOT });
  } catch (e) {
    console.error('Failed to run generate-total-report.cjs:', e);
  }
}

main();
