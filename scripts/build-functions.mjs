// Đóng gói Edge Function thành 1 file duy nhất để dán vào Supabase Dashboard.
import { build } from 'esbuild';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const fns = ['contest-submit'];
for (const fn of fns) {
  const outDir = `supabase/functions/${fn}`;
  mkdirSync(outDir, { recursive: true });
  const res = await build({
    entryPoints: [`supabase/functions-src/${fn}.js`],
    bundle: true, format: 'esm', platform: 'neutral', target: 'es2022', write: false,
    external: ['jsr:*', 'npm:*'], legalComments: 'none',
  });
  const header = `// @ts-nocheck\n// ⚠️ FILE DO MÁY TẠO RA từ supabase/functions-src/${fn}.js — đừng sửa tay.\n// Cách dùng: Supabase Dashboard → Edge Functions → Deploy a new function → Via Editor\n//   đặt tên "${fn}", xóa nội dung mẫu, dán TOÀN BỘ file này vào → Deploy.\n`;
  writeFileSync(`${outDir}/index.ts`, header + res.outputFiles[0].text);
  console.log(`✓ ${outDir}/index.ts (${(readFileSync(`${outDir}/index.ts`).length / 1024).toFixed(1)} KB)`);
}
