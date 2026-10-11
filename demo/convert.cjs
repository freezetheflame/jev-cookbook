#!/usr/bin/env node
// Offline CLI; read a UTF-8 file or stdin, output the Jev request only.
'use strict';
const fs = require('node:fs');
const converter = require('./converter.js');
try {
  if (process.argv.length > 3) throw new Error('Usage: node demo/convert.cjs [converter-spec.json]');
  const source = process.argv[2] || 0;
  const result = converter.generate(JSON.parse(fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '')));
  process.stdout.write(JSON.stringify(result.request, null, 2) + '\n');
  result.warnings.forEach(warning => process.stderr.write(warning + '\n'));
} catch (e) {
  process.stderr.write(e.message + '\n');
  process.exitCode = 1;
}
