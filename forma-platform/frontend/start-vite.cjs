// Wrapper to start Vite from ASCII path (workaround for Cyrillic path bug)
const { execSync } = require('child_process');
const path = require('path');
const port = process.env.PORT || 5173;
const viteBin = path.join('C:\\Temp\\forma-fe', 'node_modules', 'vite', 'bin', 'vite.js');
try {
  execSync(`node "${viteBin}" --host 0.0.0.0 --port ${port}`, {
    cwd: 'C:\\Temp\\forma-fe',
    stdio: 'inherit',
    env: { ...process.env }
  });
} catch (e) {
  process.exit(1);
}
