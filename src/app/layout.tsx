import type { Metadata } from 'next'
import { Geist, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import './globals.css'

const geist = Geist({
  variable: '--font-sans',
  subsets: ['latin'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const instrumentSerif = Instrument_Serif({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
})

const TITLE = 'fiilo — gestionale per sartorie italiane'
const DESC =
  'Clienti, misure, ordini, WhatsApp in un solo gestionale per atelier su misura italiani. In fase di lancio.'

export const metadata: Metadata = {
  metadataBase: new URL('https://fiilo.it'),
  title: {
    default: TITLE,
    template: '%s · fiilo',
  },
  description: DESC,
  applicationName: 'fiilo',
  authors: [{ name: 'Mario Del Prete' }],
  keywords: [
    'sartoria',
    'gestionale sartoria',
    'sartoria su misura',
    'atelier',
    'tailoring software',
    'bespoke tailoring',
    'fiilo',
  ],
  openGraph: {
    title: TITLE,
    description: DESC,
    url: '/',
    siteName: 'fiilo',
    images: [
      {
        url: '/og.jpg',
        width: 1200,
        height: 630,
        alt: 'fiilo — gestionale per sartorie su misura',
      },
    ],
    locale: 'it_IT',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESC,
    images: ['/og.jpg'],
  },
  icons: {
    icon: '/fiilo-logo.svg',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="it"
      className={`${geist.variable} ${jetbrainsMono.variable} ${instrumentSerif.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
