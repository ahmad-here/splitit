#!/usr/bin/env node
/**
 * PreToolUse hook — blocks writes to secret files (.env, .env.local, ...).
 * Committed .env.example is always allowed. Exit code 2 blocks the tool call.
 */
let input = '';
process.stdin.on('data', (c) => (input += c));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input || '{}');
    const filePath = data?.tool_input?.file_path ?? '';
    const base = String(filePath).replace(/\\/g, '/').split('/').pop() ?? '';
    const isEnv = /^\.env(\..+)?$/.test(base) && base !== '.env.example';
    // Service-account / credential JSON files (Firebase, GCP) also hold secrets.
    const isServiceAccount = /service-account.*\.json$/.test(base) || /firebase-adminsdk.*\.json$/.test(base);
    if (isEnv || isServiceAccount) {
      console.error(
        `Blocked: "${base}" holds secrets and must not be edited by the agent. ` +
          `Edit it manually; use .env.example for shared templates.`,
      );
      process.exit(2);
    }
  } catch {
    // On parse failure, do not block.
  }
  process.exit(0);
});
