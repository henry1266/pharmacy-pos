const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const RELATIVE_IMPORT_REGEX = /(from\s+['"])(\.[^'"]*)(['"])/g;

function needsExtension(specifier) {
  return !specifier.endsWith('.js') && !specifier.endsWith('.mjs') && !specifier.endsWith('.cjs') && !specifier.endsWith('.json');
}

function normalizeSpecifier(specifier) {
  if (!needsExtension(specifier)) {
    return specifier;
  }
  if (specifier.endsWith('/index')) {
    return `${specifier}.js`;
  }
  return `${specifier}.js`;
}

function applyFix(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  const updated = original.replace(RELATIVE_IMPORT_REGEX, (_match, prefix, specifier, suffix) => {
    if (specifier === '.' || specifier === '..') {
      return `${prefix}${specifier}${suffix}`;
    }
    const normalized = normalizeSpecifier(specifier);
    return `${prefix}${normalized}${suffix}`;
  });

  if (updated !== original) {
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
