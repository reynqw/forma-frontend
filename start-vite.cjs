// Wrapper to start Vite from ASCII path (workaround for Cyrillic path bug)
const { execSync } = require('child_process');
const port = process.env.PORT || 5173;
try {
  execSync(`npx vite --host --port ${port}`, {
    cwd: 'C:\\Temp\\forma-fe',
    stdio: 'inherit',
    env: { ...process.env }
  });
} catch (e) {
  process.exit(1);
}
