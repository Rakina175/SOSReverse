import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('\n======================================================');
console.log('🚀 Starting Reverse SOS Dev Stack (Express + Vite)...');
console.log('======================================================\n');

// Helper to launch a command and log output prefixing
function runCommand(name, cmd, args) {
  const child = spawn(cmd, args, {
    cwd: rootDir,
    stdio: 'inherit',
    shell: true
  });

  child.on('error', (err) => {
    console.error(`[${name}] Failed to start:`, err);
  });

  return child;
}

// Start Express Backend on Port 5000
const backend = runCommand('Backend', 'node', ['server/index.js']);

// Start Vite Frontend on Port 5173
const frontend = runCommand('Frontend', 'npx', ['vite']);

// Process termination handler
const killChildren = () => {
  console.log('\n🛑 Shutting down Dev Stack...');
  try {
    backend.kill('SIGINT');
  } catch (_) {}
  try {
    frontend.kill('SIGINT');
  } catch (_) {}
  process.exit();
};

process.on('SIGINT', killChildren);
process.on('SIGTERM', killChildren);
process.on('exit', killChildren);
