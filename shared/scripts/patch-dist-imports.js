const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TARGETS = [
  '../constants',
  '../../constants',
  '../../../constants'
];

function applyFix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = content;

  for (const target of TARGETS) {
    const withIndex = `${target}/index.js`;
    updated = updated.split(`'${target}'`).join(`'${withIndex}'`);
    updated = updated.split(`"${target}"`).join(`"${withIndex}"`);
  }

  if (updated !== content) {
    fs.writeFileSync(filePath, updated, 'utf8');
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(entryPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      applyFix(entryPath);
    }
  }
}

walk(path.join(ROOT, 'dist'));
