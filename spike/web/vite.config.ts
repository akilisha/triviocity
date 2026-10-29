import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import legacy from '@vitejs/plugin-legacy';

// The bundle ships inside the host app and is served by the embedded server.
const outDir = '../host-app/modules/spike-server/android/src/main/assets/web';

export default defineConfig({
  plugins: [
    preact(),
    // Placeholder target: Tizen 4 (2018 Samsung TVs) runs Chromium 56. Tighten once Phase 0
    // records the engine versions of the TVs we support (spec §2.2, §7.3).
    legacy({ targets: ['chrome >= 56', 'safari >= 12'] }),
  ],
  build: { outDir, emptyOutDir: true },
});
