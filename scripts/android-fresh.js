/**
 * `npm run android:fresh`: closes any running emulator, cold-boots the AVD without snapshots
 * (nothing loaded, nothing saved), waits for Android to finish booting, then runs `react-native run-android`.
 * AVD: env ANDROID_AVD, else the first one from `emulator -list-avds`. SDK: ANDROID_HOME / ANDROID_SDK_ROOT.
 */
const {execFileSync, spawn, spawnSync} = require('child_process');
const path = require('path');

const sdk = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || 'C:\\Android\\Sdk';
// <sdk>/<folder>/<tool>(.exe), e.g. C:\Android\Sdk\emulator\emulator.exe
const exe = (folder, tool) => path.join(sdk, folder, process.platform === 'win32' ? `${tool}.exe` : tool);
const adb = exe('platform-tools', 'adb');
const emulator = exe('emulator', 'emulator');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const adbOut = (...args) => spawnSync(adb, args, {encoding: 'utf8'}).stdout || '';
const emulators = () => adbOut('devices').split('\n').filter(line => line.startsWith('emulator-')).map(line => line.split('\t')[0]);

async function main() {
  const avd = process.env.ANDROID_AVD ||
    execFileSync(emulator, ['-list-avds'], {encoding: 'utf8'}).split(/\r?\n/).find(Boolean);
  if (!avd) {throw new Error('No AVD found; create one in Android Studio or set ANDROID_AVD');}

  for (const serial of emulators()) {
    console.log(`Closing ${serial}...`);
    spawnSync(adb, ['-s', serial, 'emu', 'kill']);
  }
  for (let i = 0; i < 30 && emulators().length; i++) {await sleep(1000);}
  // A device left "offline" by a previous session is cleared by restarting adb.
  spawnSync(adb, ['kill-server']);
  spawnSync(adb, ['start-server']);

  console.log(`Cold booting ${avd} (no snapshot)...`);
  spawn(emulator, ['-avd', avd, '-no-snapshot'], {detached: true, stdio: 'ignore'}).unref();
  spawnSync(adb, ['wait-for-device'], {stdio: 'inherit'});
  for (let i = 0; adbOut('shell', 'getprop', 'sys.boot_completed').trim() !== '1'; i++) {
    if (i > 180) {throw new Error('Emulator did not finish booting in 6 minutes');}
    await sleep(2000);
  }
  console.log('Emulator ready.');
  const result = spawnSync('npx', ['react-native', 'run-android'], {stdio: 'inherit', shell: true});
  process.exit(result.status ?? 1);
}

main().catch(error => {
  console.error(error.message);
  process.exit(1);
});
