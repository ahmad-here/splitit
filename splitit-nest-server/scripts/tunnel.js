/**
 * Opens an ngrok HTTPS tunnel to the local server.
 *
 * Why: Android 9+ blocks cleartext (plain http://) traffic by default, so the
 * Expo app cannot call http://<LAN-IP>:3000 — it fails with
 * "UnknownServiceException: Cleartext communication ... not permitted".
 * ngrok gives us a public https:// URL that terminates TLS and forwards to the
 * local port, so no Android network-security config is needed.
 *
 * Usage:  npm run tunnel        (start the server separately with npm run start:dev)
 *         npm run dev:tunnel    (server + tunnel together)
 *
 * Requires NGROK_AUTHTOKEN in .env.local (free at https://dashboard.ngrok.com).
 * Optional NGROK_DOMAIN pins a reserved domain so the URL survives restarts —
 * without it ngrok issues a new random URL each run and the app's
 * EXPO_PUBLIC_API_BASE_URL must be updated every time.
 */

const path = require('path');
const ngrok = require('@ngrok/ngrok');

// Load .env.local / .env without adding a runtime dependency on dotenv.
for (const file of ['.env.local', '.env']) {
  try {
    require('fs')
      .readFileSync(path.join(__dirname, '..', file), 'utf8')
      .split('\n')
      .forEach((line) => {
        const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].trim();
      });
  } catch {
    // file absent — fine
  }
}

const PORT = process.env.PORT ?? 3000;

async function main() {
  const authtoken = process.env.NGROK_AUTHTOKEN;
  if (!authtoken) {
    console.error(
      '\nNGROK_AUTHTOKEN is not set.\n' +
        'Get a free token at https://dashboard.ngrok.com/get-started/your-authtoken\n' +
        'then add it to splitit-nest-server/.env.local:\n\n' +
        '  NGROK_AUTHTOKEN=your-token-here\n',
    );
    process.exit(1);
  }

  const listener = await ngrok.forward({
    addr: Number(PORT),
    authtoken,
    ...(process.env.NGROK_DOMAIN ? { domain: process.env.NGROK_DOMAIN } : {}),
  });

  const url = listener.url();
  console.log('\n' + '='.repeat(64));
  console.log(`  Tunnel up:  ${url}  ->  http://localhost:${PORT}`);
  console.log(`  Health:     ${url}/api/health`);
  console.log('\n  Put this in splitit/.env.local, then restart Expo:');
  console.log(`    EXPO_PUBLIC_API_BASE_URL=${url}`);
  console.log('='.repeat(64) + '\n');
  console.log('This URL is PUBLIC and the API has no auth — stop the tunnel when done.');

  // Keep the process alive until Ctrl+C. A timer is used rather than
  // process.stdin.resume(), which does NOT hold the event loop when stdin is
  // not a TTY (background/detached runs) — the tunnel would close instantly.
  const keepAlive = setInterval(() => {}, 1 << 30);

  const shutdown = async () => {
    clearInterval(keepAlive);
    console.log('\nClosing tunnel...');
    await listener.close().catch(() => {});
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('Failed to start ngrok tunnel:', err.message ?? err);
  process.exit(1);
});
