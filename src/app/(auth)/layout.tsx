import Link from 'next/link'

import { FiloLogo } from '@/components/layout/FiloLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav — sticky cream bar with wordmark left */}
      <header className="flex items-center justify-between px-6 py-5 lg:px-12">
        <Link href="/" aria-label="filo home" className="inline-flex">
          <FiloLogo className="h-6 w-auto text-ink" />
        </Link>
      </header>

      {/* Centered card on canvas */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 sm:p-10">
          {children}
        </div>
      </main>

      {/* Quiet footer */}
      <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} filo · Gestionale per sartorie su misura
      </footer>
    </div>
  )
}
