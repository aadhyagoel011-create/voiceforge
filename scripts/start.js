import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

console.log('🚀 Starting VoiceForge (Backend on :5000 + Frontend on :5173)...');

// 1. Start backend
const serverProcess = spawn('npm', ['start'], {
  cwd: path.join(rootDir, 'server'),
  shell: true,
  stdio: 'inherit'
});

// 2. Start Vite frontend
const clientProcess = spawn('npm', ['run', 'dev'], {
  cwd: path.join(rootDir, 'client'),
  shell: true,
  stdio: 'inherit'
});

function cleanup() {
  console.log('\nShutting down VoiceForge...');
  serverProcess.kill();
  clientProcess.kill();
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
