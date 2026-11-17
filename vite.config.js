import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const BUILD_ID = `${pkg.version}-${Date.now().toString(36)}`;

/**
 * Sau khi build:
 *  - version.json : phiên bản mới nhất (game hỏi định kỳ để báo "Có bản cập nhật")
 *  - sw.js        : service worker lưu sẵn game để chơi khi mất mạng
 */
function releasePlugin() {
  return {
    name: 'tiem-hoa-release',
    async generateBundle(_opts, bundle) {
      const { CHANGELOG } = await import('./data/changelog.js');
      const notes = CHANGELOG.find((c) => c.version === pkg.version)?.notes || [];
      this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ version: pkg.version, buildId: BUILD_ID, notes, builtAt: new Date().toISOString() }, null, 2) });
      const files = Object.keys(bundle).filter((f) => !f.endsWith('.map') && f !== 'version.json' && f !== 'sw.js');
      const precache = [...new Set(['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', ...files.map((f) => './' + f)])];
      const sw = readFileSync(new URL('./src/sw-template.js', import.meta.url), 'utf8')
        .replace('__CACHE__', JSON.stringify('tiem-hoa-' + BUILD_ID))
        .replace('__PRECACHE__', JSON.stringify(precache));
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: sw });
    },
  };
}

export default defineConfig({
  base: './',
  server: { host: true },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
  plugins: [releasePlugin()],
});
