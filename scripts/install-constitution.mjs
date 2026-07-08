#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'core', 'references', 'constitution.md');

const START = '<!-- nuke:constitution:start -->';
const END = '<!-- nuke:constitution:end -->';

// claude is deliberately not auto-detected: the Claude Code plugin already
// injects the constitution via its SessionStart hook — pass --claude only
// when not using the plugin, or you get it twice.
const TARGETS = {
  codex: join(homedir(), '.codex', 'AGENTS.md'),
  opencode: join(homedir(), '.config', 'opencode', 'AGENTS.md'),
  claude: join(homedir(), '.claude', 'CLAUDE.md'),
};
const AUTODETECT = ['codex', 'opencode'];

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

const args = process.argv.slice(2);
let remove = false;
const files = [];
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--remove') remove = true;
  else if (a === '--file') {
    const p = args[++i];
    if (!p) fail('--file needs a path');
    files.push(p);
  } else if (a.startsWith('--') && Object.hasOwn(TARGETS, a.slice(2))) files.push(TARGETS[a.slice(2)]);
  else fail(`unknown argument: ${a} (use --codex, --opencode, --claude, --file <path>, --remove)`);
}
if (files.length === 0) {
  for (const name of AUTODETECT) {
    if (existsSync(dirname(TARGETS[name]))) files.push(TARGETS[name]);
  }
  if (files.length === 0) {
    fail('no harness detected (~/.codex, ~/.config/opencode) — pass --codex, --opencode, --claude, or --file <path>');
  }
}

if (!existsSync(sourcePath)) fail(`constitution source not found: ${sourcePath}`);
const constitution = readFileSync(sourcePath, 'utf8').trim();
const block = `${START}\n\n${constitution}\n\n${END}`;

for (const file of files) {
  const existing = existsSync(file) ? readFileSync(file, 'utf8') : '';
  const startIdx = existing.indexOf(START);
  const endIdx = existing.indexOf(END);
  const hasBlock = startIdx !== -1 && endIdx > startIdx;

  if (remove && !hasBlock) {
    console.log(`skip     ${file} — no constitution block`);
    continue;
  }

  let next;
  if (hasBlock) {
    const before = existing.slice(0, startIdx).trimEnd();
    const after = existing.slice(endIdx + END.length).trim();
    next = remove
      ? [before, after].filter(Boolean).join('\n\n')
      : [before, block, after].filter(Boolean).join('\n\n');
  } else {
    next = [existing.trimEnd(), block].filter(Boolean).join('\n\n');
  }
  if (next) next += '\n';

  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, next);
  console.log(`${remove ? 'removed' : hasBlock ? 'updated' : 'added'}  ${file}`);
}
