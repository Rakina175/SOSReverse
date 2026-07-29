import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const RESULTS_DIR = path.join(__dirname, 'results');
const REPORTS_DIR = path.join(__dirname, 'reports');
const RESULTS_PATH = path.join(RESULTS_DIR, 'load-test-results.json');
const REPORT_PATH = path.join(REPORTS_DIR, 'load-test-report.xlsx');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatMs(duration) {
  return `${duration} ms`;
}

async function runBaseline() {
  ensureDir(RESULTS_DIR);
  ensureDir(REPORTS_DIR);

  const targetUrl = process.env.LOAD_BASE_URL || 'http://127.0.0.1:5173/';
  const start = Date.now();
  let status = 'FAIL';
  let statusCode = null;
  let remarks = '';

  try {
    const response = await fetch(targetUrl, { method: 'GET' });
    statusCode = response.status;
    status = response.ok ? 'PASS' : 'FAIL';
    remarks = response.ok ? 'Baseline request succeeded' : `Unexpected HTTP status ${response.status}`;
  } catch (error) {
    remarks = String(error);
  }

  const durationMs = Date.now() - start;
  const payload = {
    generatedAt: new Date().toISOString(),
    status,
    targetUrl,
    statusCode,
    durationMs,
    remarks,
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(payload, null, 2));
  console.log('Saved load test JSON results to', RESULTS_PATH);

  const XLSX = await import('xlsx');
  const sheetData = [
    ['Target URL', 'Status', 'Status Code', 'Execution Time', 'Timestamp', 'Remarks'],
    [payload.targetUrl, payload.status, payload.statusCode, formatMs(payload.durationMs), payload.generatedAt, payload.remarks],
  ];
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Load Test Results');
  XLSX.writeFile(workbook, REPORT_PATH);
  console.log('Generated load test Excel report at', REPORT_PATH);
}

runBaseline().catch((error) => {
  console.error(error);
  process.exit(1);
});
