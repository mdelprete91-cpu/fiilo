import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

// Se NEXT_PUBLIC_SENTRY_DSN non è valorizzato, withSentryConfig si comporta in
// modo no-op (non carica il client Sentry a runtime perché gli init bailano).
// L'upload dei sourcemap richiede SENTRY_AUTH_TOKEN; quando manca, lo step di
// upload viene saltato silenziosamente (`silent: true`).
export default withSentryConfig(nextConfig, {
  silent: !process.env.CI,
  org: process.env.SENTRY_ORG ?? 'TBD',
  project: process.env.SENTRY_PROJECT ?? 'TBD',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableLogger: true,
  widenClientFileUpload: true,
  reactComponentAnnotation: { enabled: false },
  tunnelRoute: '/monitoring',
  automaticVercelMonitors: false,
})
