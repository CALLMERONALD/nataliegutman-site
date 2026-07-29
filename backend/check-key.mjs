import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const backendDirectory = path.dirname(fileURLToPath(import.meta.url));
const rootDirectory = path.dirname(backendDirectory);
const sourceExtensions = new Set(['.html', '.js', '.mjs']);
const dependencyDirectories = new Set(['node_modules']);
const generatedDirectories = new Set(['dist', 'coverage']);
const excludedDirectories = new Set(['.git', 'docs', ...dependencyDirectories, ...generatedDirectories]);
const privilegedRole = 'service' + '_role';
const jwtPattern = /\beyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/g;

function sourceFiles(directory) {
  const files = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name)) files.push(...sourceFiles(fullPath));
    } else if (entry.isFile() && sourceExtensions.has(path.extname(entry.name))) {
      files.push(fullPath);
    }
  }
  return files;
}

function decodePayload(token, relativePath) {
  const payloadSegment = token.split('.')[1];
  const normalized = payloadSegment.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
  try {
    return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
  } catch (error) {
    throw new Error(`${relativePath}: could not decode embedded JWT payload: ${error.message}`);
  }
}

const files = sourceFiles(rootDirectory).sort();
let tokenCount = 0;

for (const file of files) {
  const relativePath = path.relative(rootDirectory, file);
  const source = fs.readFileSync(file, 'utf8');
  assert.equal(source.includes(privilegedRole), false,
    `${relativePath}: privileged backend role marker must never appear in browser/source files`);

  for (const token of source.match(jwtPattern) || []) {
    const payload = decodePayload(token, relativePath);
    assert.equal(payload.role, 'anon', `${relativePath}: embedded JWT role must be anon`);
    tokenCount += 1;
  }
}

assert.ok(tokenCount > 0, 'No embedded public anon JWT was found');
console.log(`check-key: scanned ${files.length} workspace HTML/JS/MJS files`);
console.log(`check-key: decoded ${tokenCount} embedded JWT(s); every role is anon`);
console.log('check-key: privileged backend role marker absent');
