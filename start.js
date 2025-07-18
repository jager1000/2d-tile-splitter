#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

async function start() {
  console.log('🚀 Starting Map Generator 2D...\n');

  // Fixed ports
  const backendPort = 8890;
  const frontendPort = 3000;

  console.log(`📊 Backend will run on port: ${backendPort}`);
  console.log(`🌐 Frontend will run on port: ${frontendPort}\n`);

  // Start backend
  console.log('🔧 Starting backend server...');
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'backend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: backendPort.toString() }
  });

  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Start frontend
  console.log('🎨 Starting frontend development server...');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, PORT: frontendPort.toString() }
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down...');
    backendProcess.kill('SIGINT');
    frontendProcess.kill('SIGINT');
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down...');
    backendProcess.kill('SIGTERM');
    frontendProcess.kill('SIGTERM');
    process.exit(0);
  });

  backendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Backend process exited with code ${code}`);
      frontendProcess.kill('SIGTERM');
      process.exit(1);
    }
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend process exited with code ${code}`);
      backendProcess.kill('SIGTERM');
      process.exit(1);
    }
  });

  console.log('\n✨ Map Generator 2D is running!');
  console.log(`🌐 Open http://localhost:${frontendPort} in your browser\n`);
}

start().catch((error) => {
  console.error('❌ Failed to start:', error);
  process.exit(1);
});