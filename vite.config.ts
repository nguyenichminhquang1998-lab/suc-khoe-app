import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Deploy dưới dạng static site (GitHub Pages dùng đường dẫn /<tên-repo>/).
// Đặt BASE_PATH khi build nếu host ở nơi khác.
const base = process.env.BASE_PATH ?? '/'

import pkg from './package.json' with { type: 'json' }

export default defineConfig({
  base,
  define: {
    __PHIEN_BAN_APP__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Sức Khỏe App',
        short_name: 'Sức Khỏe',
        description: 'Theo dõi calo, dinh dưỡng, cân nặng và lịch tập',
        lang: 'vi',
        start_url: base,
        scope: base,
        display: 'standalone',
        background_color: '#0f172a',
        theme_color: '#0f172a',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,woff2}'],
        // Ảnh bữa ăn nằm trong IndexedDB nên không cần cache runtime cho chúng.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
})
