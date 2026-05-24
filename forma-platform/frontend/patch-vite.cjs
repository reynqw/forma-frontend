const fs = require('fs');
const path = require('path');

const depFile = path.join(__dirname, 'node_modules/vite/dist/node/chunks/dep-BK3b2jBa.js');
let code = fs.readFileSync(depFile, 'utf8');

const oldCode = 'const fileNameTmp = `${fileBase}.mjs`;\n    const fileUrl = `${pathToFileURL(fileBase)}.mjs`';
const newCode = 'const fileNameTmp = require("path").join(require("os").tmpdir(), require("path").basename(fileBase) + ".mjs");\n    const fileUrl = `${pathToFileURL(fileNameTmp.replace(/\\.mjs$/, ""))}.mjs`';

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync(depFile, code, 'utf8');
  console.log('Vite patched successfully!');
} else {
  console.log('Pattern not found - maybe already patched or different version');
}
