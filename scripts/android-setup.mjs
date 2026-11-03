// Chỉnh dự án Android sau khi "npx cap add android" (chạy trong GitHub Actions):
//  - thêm đường dẫn vn.tiemhoagiacmo.game:// để đăng nhập Google / link email mở lại được app
//  - đặt số phiên bản app theo package.json
import { readFileSync, writeFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const SCHEME = 'vn.tiemhoagiacmo.game';

const mf = 'android/app/src/main/AndroidManifest.xml';
let xml = readFileSync(mf, 'utf8');
if (!xml.includes(`android:scheme="${SCHEME}"`)) {
  const filter = `
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="${SCHEME}" />
            </intent-filter>
`;
  const i = xml.indexOf('</activity>');
  if (i < 0) throw new Error('Không tìm thấy </activity> trong AndroidManifest.xml');
  xml = xml.slice(0, i) + filter + '        ' + xml.slice(i);
  writeFileSync(mf, xml);
}

// Số bản (versionCode) phải LUÔN TĂNG để cài đè được bản cũ: 1.000.000 + số phút tính từ 01/01/2026.
const versionCode = 1000000 + Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60000);
const gf = 'android/app/build.gradle';
let gradle = readFileSync(gf, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);
writeFileSync(gf, gradle);
console.log(`✓ Android: scheme ${SCHEME}://, versionName ${pkg.version}, versionCode ${versionCode}`);
