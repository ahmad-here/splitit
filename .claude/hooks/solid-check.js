#!/usr/bin/env node
/**
 * PostToolUse hook — after a Write/Edit to a TS/TSX file, prints heuristic
 * reminders when the change looks like it may be drifting from the project's
 * SOLID / modular conventions (see CLAUDE.md). Purely advisory: it inspects the
 * file on disk, never blocks, and always exits 0.
 */
const fs = require('fs');

let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  const notes = [];
  try {
    const data = JSON.parse(input || '{}');
    const raw = String(data?.tool_input?.file_path ?? '');
    const filePath = raw.replace(/\\/g, '/');
    if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);

    let src = '';
    try {
      src = fs.readFileSync(raw, 'utf8');
    } catch {
      process.exit(0); // file gone/unreadable — nothing to check
    }

    const base = filePath.split('/').pop() || '';
    const lines = src.split('\n').length;

    // SRP: oversized files usually do too much.
    if (lines > 250) {
      notes.push(`SRP: ${base} is ${lines} lines — consider splitting into focused units.`);
    }

    // DIP: persistence engines belong behind the StorageAdapter seam.
    if (/from ['"]@react-native-async-storage\/async-storage['"]/.test(src) && !/storage-adapter\.ts$/.test(filePath)) {
      notes.push('DIP: import AsyncStorage only in src/db/storage-adapter.ts — go through StorageAdapter/Repository elsewhere.');
    }

    // Keep LLM logic inside core/ (framework-agnostic).
    const inCore = filePath.includes('/src/core/');
    if (!inCore && /\.withStructuredOutput\(|new SystemMessage\(|SYSTEM_PROMPT\s*=/.test(src) && filePath.includes('/splitit-nest-server/')) {
      notes.push('Modularity: keep prompts / LLM calls in src/core/ — controllers & services should call into it.');
    }

    // Nest controllers should be thin and use DI, not instantiate services or run logic.
    if (/\.controller\.ts$/.test(filePath)) {
      if (/\bnew [A-Z]\w*Service\(/.test(src)) {
        notes.push('DIP: inject services via the constructor — do not `new` them in a controller.');
      }
      if (/\brunSplit\(|\brunChat\(/.test(src)) {
        notes.push('SRP: move business logic out of the controller into an injected service.');
      }
    }
  } catch {
    // ignore — advisory only
  }

  if (notes.length) {
    console.log('🧭 SOLID check:');
    for (const n of notes) console.log(`   • ${n}`);
  }
  process.exit(0);
});
