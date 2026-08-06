import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

const port = 3000;

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      selfDestroying: false,
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'favicon.png', 'favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png', 'apple-touch-icon-precomposed.png', 'logo.svg', 'emblem.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifestFilename: 'manifest.json',
      manifest: {
        name: 'Atlas Study Tracker',
        short_name: 'Atlas',
        description: 'An intelligent medical study operating system for MBBS students.',
        theme_color: '#121315',
        background_color: '#121315',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
          { src: '/favicon-32x32.png', sizes: '32x32', type: 'image/png', purpose: 'any' },
          { src: '/favicon.png', sizes: '64x64', type: 'image/png', purpose: 'any' }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2,wasm}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: false,
    cssMinify: true,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          'recharts': ['recharts'],
          'framer-motion': ['framer-motion'],
          'lucide': ['lucide-react'],
          'dexie': ['dexie', 'dexie-react-hooks'],
          'vendor': ['react', 'react-dom', 'wouter', '@tanstack/react-query'],
          'ui-libs': ['@radix-ui/react-accordion', '@radix-ui/react-dialog', '@radix-ui/react-popover', 'cmdk', 'sonner', 'embla-carousel-react'],
          'form-libs': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'date-libs': ['date-fns', 'react-day-picker'],
        }
      }
    }
  },
  server: {
    hmr: {
      clientPort: 443,
    },
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: { strict: true },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
