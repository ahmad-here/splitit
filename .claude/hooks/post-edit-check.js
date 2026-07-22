#!/usr/bin/env node
/**
 * PostToolUse hook — after editing a TS/TSX file, prints a scoped reminder of
 * how to typecheck the project that changed. Non-blocking (always exit 0).
 */
let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const filePath = String(data?.tool_input?.file_path ?? '').replace(/\\/g, '/');
    if (!/\.(ts|tsx)$/.test(filePath)) process.exit(0);

    if (filePath.includes('/splitit-server/')) {
      console.log('ℹ️  Backend changed — verify with: cd splitit-server && npx tsc --noEmit');
    } else if (filePath.includes('/splitit/')) {
      console.log('ℹ️  App changed — verify with: cd splitit && npx tsc --noEmit');
    }
  } catch {
    // ignore
  }
  process.exit(0);
});
