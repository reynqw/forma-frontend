// Fix for Vite + Cyrillic paths on Windows
// Monkey-patches fs.writeFile to redirect timestamp files to tmpdir
const fs = require('fs');
const path = require('path');
const os = require('os');

const origWriteFile = fs.promises.writeFile;
fs.promises.writeFile = async function(filePath, ...args) {
  if (typeof filePath === 'string' && filePath.includes('.timestamp-') && filePath.endsWith('.mjs')) {
    const tmpPath = path.join(os.tmpdir(), path.basename(filePath));
    return origWriteFile.call(this, tmpPath, ...args);
  }
  return origWriteFile.call(this, filePath, ...args);
};

const origReadFile = fs.promises.readFile;
fs.promises.readFile = async function(filePath, ...args) {
  if (typeof filePath === 'string' && filePath.includes('.timestamp-') && filePath.endsWith('.mjs')) {
    const tmpPath = path.join(os.tmpdir(), path.basename(filePath));
    if (fs.existsSync(tmpPath)) {
      return origReadFile.call(this, tmpPath, ...args);
    }
  }
  return origReadFile.call(this, filePath, ...args);
};

const origUnlink = fs.promises.unlink;
fs.promises.unlink = async function(filePath, ...args) {
  if (typeof filePath === 'string' && filePath.includes('.timestamp-') && filePath.endsWith('.mjs')) {
    const tmpPath = path.join(os.tmpdir(), path.basename(filePath));
    if (fs.existsSync(tmpPath)) {
      return origUnlink.call(this, tmpPath, ...args);
    }
    return;
  }
  return origUnlink.call(this, filePath, ...args);
};
