const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const RESULTS_PATH = path.join(__dirname, 'results', 'selenium-test-results.json');
const REPORT_PATH = path.join(__dirname, 'reports', 'selenium-test-report.xlsx');

if (!fs.existsSync(RESULTS_PATH)) {
  console.error('Missing Selenium JSON results:', RESULTS_PATH);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(RESULTS_PATH, 'utf8'));
const outputRows = (data.tests || []).map((test) => ({
  'Test ID': test.id || '',
  'Test Name': test.name || '',
  Status: test.status || 'FAIL',
  'Execution Time': test.executionTime || '',
  Timestamp: test.timestamp || '',
  Remarks: test.remarks || '',
}));

const workbook = XLSX.utils.book_new();
const worksheet = XLSX.utils.json_to_sheet(outputRows, { header: ['Test ID', 'Test Name', 'Status', 'Execution Time', 'Timestamp', 'Remarks'] });
XLSX.utils.book_append_sheet(workbook, worksheet, 'Selenium Results');

const reportsDir = path.dirname(REPORT_PATH);
if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });
XLSX.writeFile(workbook, REPORT_PATH);
console.log('Generated Selenium Excel report at', REPORT_PATH);
