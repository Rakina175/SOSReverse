const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');

// Paths to various JSON results
const SELENIUM_RESULTS = path.join(ROOT, 'selenium-tests', 'results', 'selenium-test-results.json');
const APPIUM_RESULTS = path.join(ROOT, 'appium-tests', 'results', 'appium-test-results.json');
const LOAD_RESULTS = path.join(ROOT, 'load-tests', 'results', 'load-test-results.json');
const SECURITY_RESULTS = path.join(ROOT, 'Vulnerability Test Results', 'security-findings.json');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJson(p) {
  try {
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.error(`Failed to load results from ${p}:`, e);
  }
  return null;
}

function main() {
  ensureDir(REPORTS_DIR);

  const selenium = loadJson(SELENIUM_RESULTS);
  const appium = loadJson(APPIUM_RESULTS);
  const load = loadJson(LOAD_RESULTS);
  const security = loadJson(SECURITY_RESULTS);

  // 1. Calculate Selenium Stats
  let selTotal = 0, selPassed = 0, selFailed = 0;
  if (selenium && Array.isArray(selenium.tests)) {
    selTotal = selenium.tests.length;
    selPassed = selenium.tests.filter(t => t.status === 'PASS').length;
    selFailed = selenium.tests.filter(t => t.status === 'FAIL').length;
  }

  // 2. Calculate Appium Stats
  let appTotal = 0, appPassed = 0, appFailed = 0;
  if (appium && Array.isArray(appium.tests)) {
    appTotal = appium.tests.length;
    appPassed = appium.tests.filter(t => t.status === 'PASS').length;
    appFailed = appium.tests.filter(t => t.status === 'FAIL').length;
  }

  // 3. Calculate Load Stats
  let loadRequests = 0, loadErrors = 0, loadRps = 0, loadAvgLat = 0, loadP95Lat = 0;
  if (load) {
    loadRequests = load.totalRequests || 0;
    loadErrors = load.totalErrors || 0;
    loadRps = load.rps || 0;
    if (load.responseStats) {
      loadAvgLat = load.responseStats.avg || 0;
      loadP95Lat = load.responseStats.p95 || 0;
    }
  }

  // 4. Calculate Security Stats
  let secTotal = 0, secPassed = 0, secFailed = 0;
  if (security && Array.isArray(security.findings)) {
    secTotal = security.findings.length;
    secPassed = security.findings.filter(f => f.Status === 'PASS').length;
    secFailed = security.findings.filter(f => f.Status === 'FAIL').length;
  }

  // Generate Executive Summary Table
  const summaryRows = [
    { 'Suite Name': 'Selenium Web E2E', 'Total Cases': selTotal, 'Passed': selPassed, 'Failed': selFailed, 'Status/Remarks': selFailed === 0 && selTotal > 0 ? 'PASS' : 'COMPLETED WITH FAILURES' },
    { 'Suite Name': 'Appium Mobile E2E', 'Total Cases': appTotal, 'Passed': appPassed, 'Failed': appFailed, 'Status/Remarks': appFailed === 0 && appTotal > 0 ? 'PASS' : 'COMPLETED WITH FAILURES' },
    { 'Suite Name': 'Security Review Findings', 'Total Cases': secTotal, 'Passed': secPassed, 'Failed': secFailed, 'Status/Remarks': secFailed === 0 && secTotal > 0 ? 'PASS' : 'FAILURES DETECTED' },
  ];

  const metricsRows = [
    { 'Metric Name': 'Load Test Simulated Users', 'Value': load ? load.users : 0 },
    { 'Metric Name': 'Load Test Total Requests', 'Value': loadRequests },
    { 'Metric Name': 'Load Test Total Errors', 'Value': loadErrors },
    { 'Metric Name': 'Load Test Requests Per Second (RPS)', 'Value': loadRps },
    { 'Metric Name': 'Load Test Avg Latency (ms)', 'Value': loadAvgLat },
    { 'Metric Name': 'Load Test P95 Latency (ms)', 'Value': loadP95Lat },
  ];

  const infoRows = [
    { 'Parameter': 'Report Generation Time', 'Value': new Date().toISOString() },
    { 'Parameter': 'QA Certification Status', 'Value': (selFailed + appFailed + secFailed) === 0 ? 'CERTIFIED' : 'PENDING CORRECTIONS' },
    { 'Parameter': 'Environment', 'Value': 'Local Automated Environment' },
  ];

  const workbook = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsMetrics = XLSX.utils.json_to_sheet(metricsRows);
  const wsInfo = XLSX.utils.json_to_sheet(infoRows);

  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Test Suites Overview');
  XLSX.utils.book_append_sheet(workbook, wsMetrics, 'Performance Metrics');
  XLSX.utils.book_append_sheet(workbook, wsInfo, 'Execution Metadata');

  const outputPath = path.join(REPORTS_DIR, 'Executive Summary.xlsx');
  XLSX.writeFile(workbook, outputPath);

  console.log('Successfully generated Consolidated Executive Summary Report:', outputPath);
}

main();
