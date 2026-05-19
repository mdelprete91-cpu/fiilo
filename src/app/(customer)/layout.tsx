import { Toaster } from '@/components/ui/sonner'

export default function CustomerRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <div className="flex-1 flex flex-col">{children}</div>
      <footer className="border-t border-border px-6 py-4 text-center text-[11px] text-muted-foreground">
        Powered by <span className="font-medium text-foreground">filo</span>
      </footer>
      <Toaster />
    </div>
  )
}
