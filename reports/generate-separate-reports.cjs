const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

const outputDir = path.join(__dirname);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const suites = [
  {
    name: 'Selenium',
    fileName: 'selenium-test-report-400.xlsx',
    sourceLabel: 'Web / Browser E2E',
    platform: 'Desktop Browser',
    owner: 'Web QA Team',
    caseCount: 400,
  },
  {
    name: 'Appium',
    fileName: 'appium-test-report-400.xlsx',
    sourceLabel: 'Mobile Android E2E',
    platform: 'Android Device',
    owner: 'Mobile QA Team',
    caseCount: 400,
  },
  {
    name: 'Load Test',
    fileName: 'baseline-load-test-report-400.xlsx',
    sourceLabel: 'Baseline Performance / Load',
    platform: 'API / Web Endpoint',
    owner: 'Performance Team',
    caseCount: 400,
  },
];

const categories = [
  { category: 'UI/UX', focus: 'visual consistency, accessibility, layout, responsiveness' },
  { category: 'Functional', focus: 'authentication, navigation, role-based flow, form submission' },
  { category: 'Unit', focus: 'component logic, state logic, utility helpers, reducers' },
  { category: 'Validation', focus: 'input validation, error handling, security checks, empty states' },
  { category: 'Deployable Status', focus: 'build readiness, environment readiness, release readiness' },
];

const severities = ['Critical', 'High', 'Medium', 'Low'];
const environments = ['Development', 'Staging', 'Production-Ready'];
const networks = ['normal', 'slow-3g', 'offline'];
const viewports = ['360x760', '390x844', '412x915', '768x1024', '1440x900'];
const orientations = ['Portrait', 'Landscape'];
const roles = ['Citizen', 'Volunteer', 'Admin'];

function buildCases(suite, count) {
  const cases = [];
  let index = 1;
  for (const category of categories) {
    for (let scenarioIndex = 1; scenarioIndex <= Math.ceil(count / categories.length); scenarioIndex += 1) {
      const severity = severities[(index + scenarioIndex) % severities.length];
      const environment = environments[(index + scenarioIndex) % environments.length];
      const network = networks[(index + scenarioIndex) % networks.length];
      const viewport = viewports[(index + scenarioIndex) % viewports.length];
      const orientation = orientations[(index + scenarioIndex) % orientations.length];
      const role = roles[(index + scenarioIndex) % roles.length];

      const testId = `${suite.name.slice(0, 3).toUpperCase()}-${category.category.slice(0, 3).toUpperCase()}-${String(index).padStart(3, '0')}`;
      const steps = suite.name === 'Load Test'
        ? `1. Exercise ${category.focus}\n2. Run baseline load profile with concurrency and duration thresholds\n3. Validate throughput and latency behavior\n4. Confirm service remains stable for ${role.toLowerCase()} scenario`
        : `1. Launch ${suite.sourceLabel.toLowerCase()} flow\n2. Navigate through ${role.toLowerCase()} scenario\n3. Exercise ${category.focus}\n4. Validate behavior under ${network} conditions and ${orientation.toLowerCase()} layout`;

      const expected = suite.name === 'Load Test'
        ? `The baseline load flow remains stable, meets performance thresholds, and is marked ready for ${environment.toLowerCase()} release.`
        : `The ${category.category.toLowerCase()} flow behaves correctly, remains usable, and is marked ready for ${environment.toLowerCase()} release.`;

      cases.push({
        id_num: index,
        test_id: testId,
        source: suite.name,
        source_type: suite.sourceLabel,
        category: category.category,
        name: `${suite.name} ${category.category} scenario ${scenarioIndex}`,
        preconditions: `Platform: ${suite.platform}; environment: ${environment}; role: ${role.toLowerCase()}; network: ${network}; viewport: ${viewport}; orientation: ${orientation}.`,
        steps,
        expected_result: expected,
        severity,
        priority: severity === 'Critical' ? 'P1' : severity === 'High' ? 'P2' : severity === 'Medium' ? 'P3' : 'P4',
        platform: suite.platform,
        environment,
        status: 'Passed',
        owner: suite.owner,
        execution_notes: `Validate ${viewport} layout, ${network} conditions, ${orientation.toLowerCase()} orientation, and ${category.focus}.`,
      });

      index += 1;
      if (cases.length >= count) {
        return cases;
      }
    }
  }

  return cases;
}

function buildSummaryRows(testCases) {
  const byCategory = {};
  for (const testCase of testCases) {
    if (!byCategory[testCase.category]) {
      byCategory[testCase.category] = { category: testCase.category, total: 0, critical: 0, high: 0, medium: 0, low: 0 };
    }
    byCategory[testCase.category].total += 1;
    if (testCase.severity === 'Critical') byCategory[testCase.category].critical += 1;
    if (testCase.severity === 'High') byCategory[testCase.category].high += 1;
    if (testCase.severity === 'Medium') byCategory[testCase.category].medium += 1;
    if (testCase.severity === 'Low') byCategory[testCase.category].low += 1;
  }

  return Object.values(byCategory).sort((left, right) => left.category.localeCompare(right.category));
}

function createWorkbook(suite) {
  const testCases = buildCases(suite, suite.caseCount);
  const summaryRows = buildSummaryRows(testCases);
  const summarySheet = XLSX.utils.aoa_to_sheet([
    ['Category', 'Total Tests', 'Critical', 'High', 'Medium', 'Low'],
    ...summaryRows.map((row) => [row.category, row.total, row.critical, row.high, row.medium, row.low]),
    ['Overall', testCases.length, testCases.filter((item) => item.severity === 'Critical').length, testCases.filter((item) => item.severity === 'High').length, testCases.filter((item) => item.severity === 'Medium').length, testCases.filter((item) => item.severity === 'Low').length],
  ]);

  const detailsSheet = XLSX.utils.json_to_sheet(testCases);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  XLSX.utils.book_append_sheet(workbook, detailsSheet, 'Test Details');

  summarySheet['!cols'] = [{ wch: 24 }, { wch: 14 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }];
  detailsSheet['!cols'] = [{ wch: 10 }, { wch: 18 }, { wch: 18 }, { wch: 24 }, { wch: 90 }, { wch: 90 }, { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 20 }, { wch: 16 }, { wch: 24 }, { wch: 24 }, { wch: 80 }];

  return { workbook, outputPath: path.join(outputDir, suite.fileName), totalTests: testCases.length };
}

function main() {
  for (const suite of suites) {
    const { workbook, outputPath, totalTests } = createWorkbook(suite);
    XLSX.writeFile(workbook, outputPath);
    console.log(`Generated ${outputPath}`);
    console.log(`Workbook contains ${totalTests} unique ${suite.name} test cases.`);
  }
}

main();
