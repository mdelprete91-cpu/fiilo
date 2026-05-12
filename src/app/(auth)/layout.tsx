import Image from 'next/image'
import Link from 'next/link'

import { FiiloLogo } from '@/components/layout/FiiloLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-2">
      {/* Left column — form */}
      <div className="flex min-h-screen flex-col lg:min-h-0">
        <header className="flex items-center justify-between px-6 py-5 lg:px-12">
          <Link href="/" aria-label="fiilo home" className="inline-flex">
            <FiiloLogo className="h-6 w-auto text-ink" />
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-sm">{children}</div>
        </main>

        <footer className="px-6 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} fiilo · Gestionale per sartorie su misura
        </footer>
      </div>

      {/* Right column — image (lg+) */}
      <div className="hidden p-3 lg:block">
        <div className="relative h-full w-full overflow-hidden rounded-xl">
          <Image
            src="/auth-tailor.jpg"
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
        </div>
      </div>
    </div>
  )
}
