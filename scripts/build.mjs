#!/usr/bin/env node
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entrypointsDir = join(root, 'core', 'entrypoints');
const referencesDir = join(root, 'core', 'references');
const skillsDir = join(root, 'skills');

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

const manifestPath = join(root, 'core', 'manifest.json');
if (!existsSync(manifestPath)) fail('core/manifest.json not found');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
if (!manifest.skills || typeof manifest.skills !== 'object') fail('core/manifest.json has no "skills" object');

const skills = Object.entries(manifest.skills);

for (const [name, entry] of skills) {
  if (!entry || typeof entry !== 'object') fail(`${name}: manifest entry is not an object`);
  if (typeof entry.entrypoint !== 'string' || !entry.entrypoint) {
    fail(`${name}: manifest entry has no "entrypoint"`);
  }
  if (!Array.isArray(entry.references)) {
    fail(`${name}: manifest entry has no "references" array`);
  }
  if (!existsSync(join(entrypointsDir, entry.entrypoint))) {
    fail(`${name}: entrypoint core/entrypoints/${entry.entrypoint} does not exist`);
  }
  for (const ref of entry.references) {
    if (!existsSync(join(referencesDir, ref))) {
      fail(`${name}: reference core/references/${ref} does not exist`);
    }
  }
}

for (const [name, { entrypoint, references }] of skills) {
  const text = readFileSync(join(entrypointsDir, entrypoint), 'utf8');

  const fm = text.match(/^---\n([\s\S]*?)\n---\n/);
  if (!fm) fail(`${name}: ${entrypoint} has no frontmatter block`);
  const fmLines = fm[1].split('\n');

  const nameLine = fmLines.find((l) => l.startsWith('name:'));
  const fmName = nameLine ? nameLine.slice('name:'.length).trim() : '';
  if (!fmName) fail(`${name}: frontmatter has no non-empty "name"`);
  if (fmName !== name) fail(`${name}: frontmatter name "${fmName}" does not match folder name`);

  const descIndex = fmLines.findIndex((l) => l.startsWith('description:'));
  if (descIndex === -1) fail(`${name}: frontmatter has no "description"`);
  let desc = fmLines[descIndex].slice('description:'.length).trim();
  if (desc === '' || desc === '>' || desc === '>-' || desc === '|') {
    const parts = [];
    for (let i = descIndex + 1; i < fmLines.length && /^\s+\S/.test(fmLines[i]); i++) {
      parts.push(fmLines[i].trim());
    }
    desc = parts.join(' ');
  }
  if (!desc) fail(`${name}: frontmatter "description" is empty`);

  const body = text.slice(fm[0].length);
  const mentioned = new Set([...body.matchAll(/references\/([A-Za-z0-9._-]+\.md)/g)].map((m) => m[1]));
  for (const ref of mentioned) {
    if (!references.includes(ref)) {
      fail(`${name}: ${entrypoint} mentions references/${ref} but it is not in its manifest references`);
    }
  }
  for (const ref of references) {
    if (!mentioned.has(ref)) {
      console.warn(`WARN: ${name}: references/${ref} copied but never mentioned in ${entrypoint}`);
    }
  }
}

rmSync(skillsDir, { recursive: true, force: true });

for (const [name, { entrypoint, references }] of skills) {
  mkdirSync(join(skillsDir, name), { recursive: true });
  cpSync(join(entrypointsDir, entrypoint), join(skillsDir, name, 'SKILL.md'));
  if (references.length > 0) {
    mkdirSync(join(skillsDir, name, 'references'));
    for (const ref of references) {
      cpSync(join(referencesDir, ref), join(skillsDir, name, 'references', ref));
    }
  }
}

console.log('skills/');
skills.forEach(([name, { references }], i) => {
  const last = i === skills.length - 1;
  const branch = last ? '└──' : '├──';
  const pad = last ? '    ' : '│   ';
  console.log(`${branch} ${name}/`);
  if (references.length === 0) {
    console.log(`${pad}└── SKILL.md`);
    return;
  }
  console.log(`${pad}├── SKILL.md`);
  console.log(`${pad}└── references/`);
  const refs = readdirSync(join(skillsDir, name, 'references')).sort();
  refs.forEach((ref, j) => {
    console.log(`${pad}    ${j === refs.length - 1 ? '└──' : '├──'} ${ref}`);
  });
});
console.log(`\nBuilt ${skills.length} skills.`);
