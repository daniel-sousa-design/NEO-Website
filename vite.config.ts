import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Vite config — https://vitejs.dev/config/
//
// Platform-independent: no Figma Make plugins, no .figma/make/site.json.
// Document metadata now lives directly in index.html and public/robots.txt.
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development'

  return {
    // Override for a sub-path deploy (e.g. GitHub Pages): BASE_URL=/NEO-Website/
    base: process.env.BASE_URL || '/',

    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },

    server: {
      host: 'localhost',
      port: 5173,
      open: true,
    },

    preview: {
      host: 'localhost',
      port: 4173,
    },

    build: {
      target: 'es2022',
      sourcemap: isDev,
      // Heavy media (large PNGs, video, 3D models) must stay as separate files
      // that the browser can stream and cache — never inlined as base64.
      assetsInlineLimit: 4096,
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          // Split vendor code so a source edit doesn't invalidate the whole
          // bundle. Vite 8 bundles with rolldown, where manualChunks must be a
          // function — the Rollup object form is rejected at build time.
          // Add a three/@react-three branch here when the 3D work lands.
          manualChunks(id: string) {
            if (id.includes('/node_modules/react-dom/') || id.includes('/node_modules/react/')) {
              return 'react'
            }
          },
        },
      },
    },

    // Pre-bundle deps on first dev start for a faster cold boot.
    optimizeDeps: {
      include: ['react', 'react-dom', 'react-dom/client'],
    },

    plugins: [react(), tailwindcss()],

    // 3D/video work often needs these; harmless until then.
    assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.hdr', '**/*.exr'],
  }
})
