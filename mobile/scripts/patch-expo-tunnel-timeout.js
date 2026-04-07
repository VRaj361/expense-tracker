/**
 * Expo CLI hardcodes a 10s ngrok connect timeout; slow networks often fail.
 * @expo/cli is nested under `expo` — patch after every `npm install`.
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '../node_modules/expo/node_modules/@expo/cli/build/src/start/server/AsyncNgrok.js'),
  path.join(__dirname, '../node_modules/@expo/cli/build/src/start/server/AsyncNgrok.js'),
];

for (const file of candidates) {
  if (!fs.existsSync(file)) continue;
  let src = fs.readFileSync(file, 'utf8');
  const from = 'const TUNNEL_TIMEOUT = 10 * 1000;';
  const to = 'const TUNNEL_TIMEOUT = 60 * 1000;';
  if (src.includes(to)) {
    console.log('[patch-expo-tunnel-timeout] Already 60s:', file);
  } else if (src.includes(from)) {
    fs.writeFileSync(file, src.replace(from, to));
    console.log('[patch-expo-tunnel-timeout] Extended tunnel timeout to 60s:', file);
  }
  break;
}
