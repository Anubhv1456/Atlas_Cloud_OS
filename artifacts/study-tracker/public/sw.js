// Fallback Service Worker for Atlas PWA
importScripts('/sw-custom.js');

const CACHE_NAME = 'atlas-pwa-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
