#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const net = require('net');

// Function to find available port
function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findAvailablePort(startPort + 1));
    });
  });
}

async function start() {
  console.log('🚀 Starting Map Generator 2D...\n');

  // Find available ports
  const backendPort = await findAvailablePort(8890);
  const frontendPort = await findAvailablePort(3000);

  console.log(`📊 Backend will run on port: ${backendPort}`);
  console.log(`🌐 Frontend will run on port: ${frontendPort}\n`);

  // Set environment variables
  process.env.PORT = backendPort.toString();

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
    }
  });

  frontendProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Frontend process exited with code ${code}`);
    }
  });
}

start().catch(console.error);
