const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ROOT = path.resolve(__dirname, '..');
const REPORTS_DIR = path.join(ROOT, 'reports');
const REPORT_PATH = path.join(REPORTS_DIR, 'Total_Test_Cases_Report.xlsx');

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

  console.log('Loading results from JSON files...');
  const selenium = loadJson(SELENIUM_RESULTS);
  const appium = loadJson(APPIUM_RESULTS);
  const load = loadJson(LOAD_RESULTS);
  const security = loadJson(SECURITY_RESULTS);

  // 1. Calculate Selenium Stats & extract details
  let selTotal = 0, selPassed = 0, selFailed = 0;
  let selDetails = [];
  if (selenium && Array.isArray(selenium.tests)) {
    selTotal = selenium.tests.length;
    selPassed = selenium.tests.filter(t => t.status === 'PASS').length;
    selFailed = selenium.tests.filter(t => t.status === 'FAIL').length;
    selDetails = selenium.tests.map(t => ({
      'Test ID': t.id,
      'Description': t.name,
      'Status': t.status,
      'Execution Duration': t.executionTime,
      'Timestamp': t.timestamp,
      'Remarks': t.remarks
    }));
  } else {
    console.warn('Warning: Selenium results missing or empty.');
  }

  // 2. Calculate Appium Stats & extract details
  let appTotal = 0, appPassed = 0, appFailed = 0;
  let appDetails = [];
  if (appium && Array.isArray(appium.tests)) {
    appTotal = appium.tests.length;
    appPassed = appium.tests.filter(t => t.status === 'PASS').length;
    appFailed = appium.tests.filter(t => t.status === 'FAIL').length;
    appDetails = appium.tests.map(t => ({
      'Test ID': t.id,
      'Description': t.name,
      'Status': t.status,
      'Execution Duration': t.executionTime,
      'Timestamp': t.timestamp,
      'Remarks': t.details
    }));
  } else {
    console.warn('Warning: Appium results missing or empty.');
  }

  // 3. Calculate Load Stats & extract details
  let loadTotal = 0, loadPassed = 0, loadFailed = 0, loadUsers = 0, loadRps = 0, loadAvgLat = 0, loadMaxLat = 0;
  let loadDetails = [];
  if (load) {
    loadUsers = load.users || 0;
    loadRps = load.rps || 0;
    if (load.responseStats) {
      loadAvgLat = load.responseStats.avg || 0;
      loadMaxLat = load.responseStats.max || 0;
    }
    if (Array.isArray(load.cases)) {
      loadTotal = load.cases.length;
      loadPassed = load.cases.filter(c => c.Status === 'PASS').length;
      loadFailed = load.cases.filter(c => c.Status === 'FAIL').length;
      loadDetails = load.cases.map(c => ({
        'Test Case ID': c['Test Case ID'],
        'Category': c.Category,
        'Metric Focus': c['Metric Focus'],
        'Scenario': c.Scenario,
        'Expected Result': c['Expected Result'],
        'Actual Result': c['Actual Result'],
        'Priority': c.Priority,
        'Severity': c.Severity,
        'Automation Status': c['Automation Status'],
        'Status': c.Status
      }));
    }
  } else {
    console.warn('Warning: Load test results missing.');
  }

  // 4. Calculate Security Stats & extract details
  let secTotal = 0, secPassed = 0, secFailed = 0;
  let secDetails = [];
  if (security && Array.isArray(security.findings)) {
    secTotal = security.findings.length;
    secPassed = security.findings.filter(f => f.Status === 'PASS').length;
    secFailed = security.findings.filter(f => f.Status === 'FAIL').length;
    secDetails = security.findings.map(f => ({
      'Finding ID': f['Finding ID'],
      'Category': f.Category,
      'Severity': f.Severity,
      'Description': f.Description,
      'Evidence': f.Evidence,
      'File Path': f.File,
      'Endpoint': f.Endpoint,
      'Recommendation': f.Recommendation,
      'Status': f.Status
    }));
  } else {
    console.warn('Warning: Security findings missing.');
  }

  // Generate consolidated Executive Summary rows
  const summaryRows = [
    { 'Suite Name': 'Selenium Web E2E', 'Total Cases': selTotal, 'Passed': selPassed, 'Failed': selFailed, 'Pass Rate': selTotal ? `${((selPassed / selTotal) * 100).toFixed(2)}%` : '0%', 'Status': selFailed === 0 && selTotal > 0 ? 'PASS' : 'COMPLETED' },
    { 'Suite Name': 'Appium Mobile E2E', 'Total Cases': appTotal, 'Passed': appPassed, 'Failed': appFailed, 'Pass Rate': appTotal ? `${((appPassed / appTotal) * 100).toFixed(2)}%` : '0%', 'Status': appFailed === 0 && appTotal > 0 ? 'PASS' : 'COMPLETED' },
    { 'Suite Name': 'Load Test Scenarios', 'Total Cases': loadTotal, 'Passed': loadPassed, 'Failed': loadFailed, 'Pass Rate': loadTotal ? `${((loadPassed / loadTotal) * 100).toFixed(2)}%` : '0%', 'Status': loadFailed === 0 && loadTotal > 0 ? 'PASS' : 'COMPLETED' },
    { 'Suite Name': 'Security Review Findings', 'Total Cases': secTotal, 'Passed': secPassed, 'Failed': secFailed, 'Pass Rate': secTotal ? `${((secPassed / secTotal) * 100).toFixed(2)}%` : '0%', 'Status': secFailed === 0 && secTotal > 0 ? 'PASS' : 'FAILURES' },
  ];

  const metricsRows = [
    { 'Performance Metric': 'Concurrent Users', 'Value': loadUsers },
    { 'Performance Metric': 'Total Requests', 'Value': load ? load.totalRequests : 0 },
    { 'Performance Metric': 'Total Errors', 'Value': load ? load.totalErrors : 0 },
    { 'Performance Metric': 'Requests Per Second (RPS)', 'Value': loadRps },
    { 'Performance Metric': 'Average Latency (ms)', 'Value': loadAvgLat },
    { 'Performance Metric': 'Maximum Latency (ms)', 'Value': loadMaxLat }
  ];

  const metadataRows = [
    { 'Parameter': 'Report Consolidated Time', 'Value': new Date().toLocaleString() },
    { 'Parameter': 'Total E2E Cases Evaluated', 'Value': selTotal + appTotal + loadTotal + secTotal },
    { 'Parameter': 'Certification Status', 'Value': (selFailed + appFailed + loadFailed + secFailed) === 0 ? 'QA CERTIFIED' : 'PENDING REMEDIATION' },
  ];

  const workbook = XLSX.utils.book_new();

  // Create worksheets
  const wsSummary = XLSX.utils.aoa_to_sheet([
    ['CONSOLIDATED EXECUTIVE SUMMARY'],
    [],
    ['Test Suites Performance Overview'],
    ['Suite Name', 'Total Cases', 'Passed', 'Failed', 'Pass Rate', 'Status'],
    ...summaryRows.map(r => [r['Suite Name'], r['Total Cases'], r['Passed'], r['Failed'], r['Pass Rate'], r['Status']]),
    [],
    ['Baseline Load Test Performance Metrics'],
    ['Performance Metric', 'Value'],
    ...metricsRows.map(r => [r['Performance Metric'], r['Value']]),
    [],
    ['Report Metadata'],
    ['Parameter', 'Value'],
    ...metadataRows.map(r => [r['Parameter'], r['Value']])
  ]);

  const wsSelenium = XLSX.utils.json_to_sheet(selDetails);
  const wsAppium = XLSX.utils.json_to_sheet(appDetails);
  const wsLoad = XLSX.utils.json_to_sheet(loadDetails);
  const wsSecurity = XLSX.utils.json_to_sheet(secDetails);

  // Append sheets
  XLSX.utils.book_append_sheet(workbook, wsSummary, 'Executive Summary');
  if (selDetails.length > 0) XLSX.utils.book_append_sheet(workbook, wsSelenium, 'Selenium Web E2E');
  if (appDetails.length > 0) XLSX.utils.book_append_sheet(workbook, wsAppium, 'Appium Mobile E2E');
  if (loadDetails.length > 0) XLSX.utils.book_append_sheet(workbook, wsLoad, 'Load Test Cases');
  if (secDetails.length > 0) XLSX.utils.book_append_sheet(workbook, wsSecurity, 'Security Vulnerabilities');

  // Styling columns width
  wsSummary['!cols'] = [{ wch: 38 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }];
  wsSelenium['!cols'] = [{ wch: 12 }, { wch: 50 }, { wch: 12 }, { wch: 20 }, { wch: 28 }, { wch: 50 }];
  wsAppium['!cols'] = [{ wch: 12 }, { wch: 50 }, { wch: 12 }, { wch: 20 }, { wch: 28 }, { wch: 50 }];
  wsLoad['!cols'] = [{ wch: 15 }, { wch: 22 }, { wch: 22 }, { wch: 50 }, { wch: 60 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 20 }, { wch: 12 }];
  wsSecurity['!cols'] = [{ wch: 15 }, { wch: 22 }, { wch: 12 }, { wch: 50 }, { wch: 60 }, { wch: 30 }, { wch: 15 }, { wch: 60 }, { wch: 12 }];

  XLSX.writeFile(workbook, REPORT_PATH);
  console.log(`\nSuccessfully generated the grand consolidated Excel report at: ${REPORT_PATH}`);
}

main();
