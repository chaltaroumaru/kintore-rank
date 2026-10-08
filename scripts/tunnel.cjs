// Cloudflare の Quick Tunnel 経由で Expo 開発サーバーを公開する。
// 別の Wi-Fi やモバイル回線のスマホからでも Expo Go で接続できる (PC は起動しておく必要あり)。
// 使い方: npm run start:tunnel
const { spawn } = require('child_process');
const fs = require('fs');

const PORT = process.env.PORT || '8081';

function findCloudflared() {
  const candidates = [
    'C:\\Program Files (x86)\\cloudflared\\cloudflared.exe',
    'C:\\Program Files\\cloudflared\\cloudflared.exe',
  ];
  return candidates.find((p) => fs.existsSync(p)) || 'cloudflared';
}

const tunnel = spawn(findCloudflared(), ['tunnel', '--no-autoupdate', '--url', `http://localhost:${PORT}`], {
  stdio: ['ignore', 'pipe', 'pipe'],
});

let expo = null;
const timeout = setTimeout(() => {
  console.error('トンネルURLを取得できませんでした (60秒)。ネットワークを確認して再実行してください。');
  shutdown(1);
}, 60_000);

function onOutput(chunk) {
  const m = /https:\/\/[a-z0-9-]+\.trycloudflare\.com/.exec(chunk.toString());
  if (!m || expo) return;
  clearTimeout(timeout);
  const url = m[0];
  console.log(`\nトンネルURL: ${url}\nExpo を起動します。表示される QR コードを Expo Go で読み取ってください。\n`);
  expo = spawn('npx', ['expo', 'start', '--port', PORT, ...process.argv.slice(2)], {
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, EXPO_PACKAGER_PROXY_URL: url },
  });
  expo.on('exit', (code) => shutdown(code ?? 0));
}

tunnel.stdout.on('data', onOutput);
tunnel.stderr.on('data', onOutput);
tunnel.on('error', (e) => {
  console.error('cloudflared を起動できません。インストールされているか確認してください:', e.message);
  shutdown(1);
});
tunnel.on('exit', (code) => {
  if (expo) console.error('トンネルが切断されました。');
  shutdown(code ?? 1);
});

function shutdown(code) {
  clearTimeout(timeout);
  if (expo && !expo.killed) expo.kill();
  if (!tunnel.killed) tunnel.kill();
  process.exit(code);
}
process.on('SIGINT', () => shutdown(0));
