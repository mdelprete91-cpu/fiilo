import * as Sentry from '@sentry/nextjs'

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    sampleRate: 1.0,
    tracesSampleRate: 0.1,
    replaysOnErrorSampleRate: 0,
    replaysSessionSampleRate: 0,
    ignoreErrors: [
      // Errori comuni iniettati da estensioni browser (Heurio, ad-blocker, ecc.)
      'top.GLOBALS',
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
      /heurio/i,
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
      /^Script error\.?$/,
      /Network request failed/i,
    ],
    denyUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^moz-extension:\/\//i,
      /^safari-extension:\/\//i,
    ],
  })
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
