// Chỉnh dự án Android sau khi "npx cap add android" (chạy trong GitHub Actions):
//  - thêm đường dẫn vn.tiemhoagiacmo.game:// để đăng nhập Google / link email mở lại được app
//  - khóa màn hình ngang
//  - toàn màn hình: ẩn thanh trạng thái + thanh điều hướng (vuốt từ mép thì hiện tạm rồi tự ẩn)
//  - đặt số phiên bản app theo package.json
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

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

// Chỉ chơi màn hình ngang (xoay được cả 2 chiều ngang)
xml = readFileSync(mf, 'utf8');
if (!xml.includes('android:screenOrientation')) {
  xml = xml.replace(/<activity\b/, '<activity\n            android:screenOrientation="sensorLandscape"');
  writeFileSync(mf, xml);
}

// Toàn màn hình kiểu game: viết lại MainActivity.java (Capacitor tạo sẵn file rỗng)
const findMain = (dir) => {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { const r = findMain(p); if (r) return r; }
    else if (f === 'MainActivity.java') return p;
  }
  return null;
};
const mainActivity = findMain('android/app/src/main/java');
if (!mainActivity) throw new Error('Không tìm thấy MainActivity.java');
const pkgName = /package\s+([\w.]+);/.exec(readFileSync(mainActivity, 'utf8'))?.[1] || 'vn.tiemhoagiacmo.game';
writeFileSync(mainActivity, `package ${pkgName};

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import com.getcapacitor.BridgeActivity;

// Tệp này do scripts/android-setup.mjs tạo ra — sửa ở đó, không sửa ở đây.
// Ẩn thanh trạng thái + thanh điều hướng khi chơi. Vuốt từ mép màn hình thì 2 thanh hiện tạm rồi tự ẩn.
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        hideSystemBars();
    }

    @Override
    public void onResume() {
        super.onResume();
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @SuppressWarnings("deprecation")
    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                    | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                    | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                    | View.SYSTEM_UI_FLAG_FULLSCREEN
            );
        }
    }
}
`);

// Số bản (versionCode) phải LUÔN TĂNG để cài đè được bản cũ: 1.000.000 + số phút tính từ 01/01/2026.
const versionCode = 1000000 + Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 60000);
const gf = 'android/app/build.gradle';
let gradle = readFileSync(gf, 'utf8');
gradle = gradle.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`).replace(/versionName\s+"[^"]*"/, `versionName "${pkg.version}"`);
writeFileSync(gf, gradle);
console.log(`✓ Android: màn hình ngang, toàn màn hình, scheme ${SCHEME}://, versionName ${pkg.version}, versionCode ${versionCode}`);
