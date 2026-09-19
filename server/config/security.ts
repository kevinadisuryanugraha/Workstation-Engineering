import type { HelmetOptions } from 'helmet';

/**
 * Centralized CSP / security-headers configuration (SEC-03, Story 8.1).
 * Revised after manual-check 2026-09-18: default helmet CSP blocked Vite dev
 * inline preamble, HMR websocket, and Google Fonts used by index.html.
 *
 * - Dev (Vite middleware): inline scripts (React preamble/HMR) + ws: HMR socket
 * - Prod: strict script-src 'self' (built bundles are external files)
 * - Google Fonts (fonts.googleapis.com / fonts.gstatic.com) dipakai index.html
 */

export function buildHelmetOptions(nodeEnv: string = process.env.NODE_ENV ?? 'development'): HelmetOptions {
  const isDev = nodeEnv !== 'production';

  return {
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        'script-src': isDev ? ["'self'", "'unsafe-inline'"] : ["'self'"],
        'style-src': ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
        'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
        'img-src': ["'self'", 'data:', 'blob:'],
        // HOTFIX 2026-09-19: domain Google Fonts ditambahkan — service worker
        // (workbox runtimeCaching) me-fetch CSS font via fetch(), butuh izin
        // connect-src eksplisit (sebelumnya diblok CSP di produksi).
        'connect-src': isDev
          ? ["'self'", 'ws:', 'wss:', 'http://localhost:*', 'https://fonts.googleapis.com']
          : ["'self'", 'wss:', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        'worker-src': ["'self'", 'blob:'], // PWA service worker
      },
    },
    crossOriginEmbedderPolicy: false, // allow external fonts/assets to load
  };
}
