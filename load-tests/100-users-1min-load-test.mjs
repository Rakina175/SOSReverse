import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const RESULTS_DIR = path.join(__dirname, 'results');
const REPORTS_DIR = path.join(__dirname, 'reports');
const RESULTS_PATH = path.join(RESULTS_DIR, 'load-test-100x1m-results.json');
const REPORT_PATH = path.join(REPORTS_DIR, 'load-test-100x1m-report.xlsx');

function ensureDir(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = arr.slice().sort((a,b)=>a-b);
  const idx = Math.ceil((p/100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(sorted.length-1, idx))];
}

function stats(durations) {
  const n = durations.length;
  if (n === 0) return { count:0, avg:0, min:0, max:0, p50:0, p95:0, p99:0 };
  const sum = durations.reduce((a,b)=>a+b,0);
  const avg = sum / n;
  return {
    count: n,
    avg: Math.round(avg),
    min: Math.min(...durations),
    max: Math.max(...durations),
    p50: percentile(durations,50),
    p95: percentile(durations,95),
    p99: percentile(durations,99)
  };
}

async function runLoad({users=100, durationSec=60, target=process.env.LOAD_BASE_URL||'http://127.0.0.1:5173/'} = {}){
  ensureDir(RESULTS_DIR); ensureDir(REPORTS_DIR);
  console.log(`Starting load test: ${users} users for ${durationSec}s against ${target}`);
  const endTime = Date.now() + durationSec*1000;

  const globalDurations = [];
  let totalRequests = 0;
  let totalErrors = 0;

  const worker = async (id) => {
    while (Date.now() < endTime) {
      const start = Date.now();
      try {
        const res = await fetch(target, { method: 'GET' });
        const dur = Date.now() - start;
        globalDurations.push(dur);
        totalRequests += 1;
        // consume body lightly
        try { await res.text().then(()=>{}); } catch(e){}
      } catch (e) {
        totalErrors += 1;
      }
    }
  };

  const workers = [];
  for (let i=0;i<users;i++) workers.push(worker(i));

  // run all workers concurrently
  await Promise.all(workers.map(p=>p.catch(()=>{})));

  const durationActual = durationSec;
  const rps = totalRequests / Math.max(1, durationActual);
  const s = stats(globalDurations);

  const result = {
    generatedAt: new Date().toISOString(),
    target,
    users,
    durationSec: durationActual,
    totalRequests,
    totalErrors,
    rps: Math.round(rps),
    responseStats: s
  };

  fs.writeFileSync(RESULTS_PATH, JSON.stringify(result, null, 2));
  console.log('Saved load results to', RESULTS_PATH);

  // write excel
  const XLSX = await import('xlsx');
  const summary = [
    ['Metric','Value'],
    ['Target', result.target],
    ['Users', result.users],
    ['DurationSec', result.durationSec],
    ['TotalRequests', result.totalRequests],
    ['TotalErrors', result.totalErrors],
    ['RPS', result.rps],
    ['AvgResponseMs', result.responseStats.avg],
    ['MinResponseMs', result.responseStats.min],
    ['MaxResponseMs', result.responseStats.max],
    ['P50_ms', result.responseStats.p50],
    ['P95_ms', result.responseStats.p95],
    ['P99_ms', result.responseStats.p99],
  ];

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.aoa_to_sheet(summary);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

  // Details sheet - include sample of durations (first 1000)
  const detailRows = [['Index','DurationMs']];
  globalDurations.slice(0,1000).forEach((d,i)=> detailRows.push([i+1,d]));
  const wsDetails = XLSX.utils.aoa_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsDetails, 'Details');

  XLSX.writeFile(wb, REPORT_PATH);
  console.log('Excel report written to', REPORT_PATH);

  return result;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  // default run
  runLoad({users:100,durationSec:60}).then(res=>{
    console.log('Done', res);
  }).catch(e=>{ console.error(e); process.exit(1); });
}

export { runLoad };
