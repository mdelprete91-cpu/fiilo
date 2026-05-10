import { FiloLogo } from '@/components/layout/FiloLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Pannello sinistro — brand */}
      <div className="hidden lg:flex flex-col justify-between bg-ink p-12 text-white">
        <div>
          <FiloLogo className="h-8 w-auto text-white" />
        </div>
        <blockquote className="space-y-4">
          <p className="font-heading text-3xl leading-snug text-white/90">
            &ldquo;Il vero lusso è avere il tempo di fare le cose bene.&rdquo;
          </p>
          <footer className="text-sm text-white/50 tracking-wider uppercase">
            — Giorgio Armani
          </footer>
        </blockquote>
        <p className="text-xs text-white/30 tracking-wider">
          Gestionale professionale per sartorie su misura
        </p>
      </div>

      {/* Pannello destro — form */}
      <div className="flex items-center justify-center p-8 bg-parchment">
        {children}
      </div>
    </div>
  )
}
