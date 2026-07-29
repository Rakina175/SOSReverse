# React + TypeScript + Vite

This repository is a React + TypeScript + Vite application with a built-in test automation pipeline for Selenium, Appium, and load validation.

## Testing Instructions

### GitHub Actions

The workflow is located at `.github/workflows/test.yml`. It runs on Ubuntu and performs:

- checkout
- install dependencies
- build the project
- start the Vite server and wait until `http://127.0.0.1:5173` is available
- run Selenium tests and generate an Excel report
- run Appium dry-run tests and generate an Excel report
- run a baseline load test and generate an Excel report
- upload JSON and Excel artifacts

### Running Selenium

```bash
npm install
npm run build
npm run selenium:test
npm run selenium:report
```

Results:

- `selenium-tests/results/selenium-test-results.json`
- `selenium-tests/reports/selenium-test-report.xlsx`

### Running Appium

```bash
npm install
npm run appium:test:dry
npm run appium:report
```

Results:

- `appium-tests/results/appium-test-results.json`
- `appium-tests/reports/appium-mobile-test-report.xlsx`

### Running Load Tests

```bash
npm install
npm run load:test:baseline
```

Results:

- `load-tests/results/load-test-results.json`
- `load-tests/reports/load-test-report.xlsx`

### Downloading Excel Reports

After workflow execution, artifacts will include:

- `selenium-tests/reports/selenium-test-report.xlsx`
- `appium-tests/reports/appium-mobile-test-report.xlsx`
- `load-tests/reports/load-test-report.xlsx`
