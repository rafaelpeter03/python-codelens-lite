import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Buffer } from 'node:buffer';
import { URL } from 'node:url';
import * as esbuild from 'esbuild';

async function loadTsModule(relativePath) {
  const sourceUrl = new URL(relativePath, import.meta.url);
  const source = await readFile(sourceUrl, 'utf8');
  const transformed = await esbuild.transform(source, {
    loader: 'ts',
    format: 'esm',
    platform: 'node'
  });

  const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed.code).toString('base64')}`;
  return import(moduleUrl);
}

const { isLineAnImport, isLineTextAnImport } = await loadTsModule('../src/importDetector.ts');
const { getLocationCommand } = await loadTsModule('../src/locationCommand.ts');

function textDocument(lines) {
  return {
    lineCount: lines.length,
    lineAt(line) {
      return { text: lines[line] };
    }
  };
}

assert.equal(isLineTextAnImport(['import os'], 0), true);
assert.equal(isLineTextAnImport(['from package import Thing'], 0), true);
assert.equal(isLineTextAnImport(['Thing()'], 0), false);

const parenthesizedImport = [
  'from package import (',
  '    Thing,',
  '    OtherThing,',
  ')',
  'Thing()'
];
assert.equal(isLineTextAnImport(parenthesizedImport, 1), true);
assert.equal(isLineTextAnImport(parenthesizedImport, 2), true);
assert.equal(isLineTextAnImport(parenthesizedImport, 4), false);

const slashImport = [
  'from package import \\',
  '    Thing',
  'Thing()'
];
assert.equal(isLineTextAnImport(slashImport, 1), true);
assert.equal(isLineTextAnImport(slashImport, 2), false);

assert.equal(isLineAnImport(textDocument(parenthesizedImport), 1), true);

assert.deepEqual(getLocationCommand('peek'), {
  command: 'editor.action.peekLocations',
  mode: 'peek'
});
assert.deepEqual(getLocationCommand('reveal'), {
  command: 'editor.action.goToLocations',
  mode: 'goto'
});
