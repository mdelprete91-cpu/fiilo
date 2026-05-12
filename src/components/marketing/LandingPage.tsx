'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Calendar,
  Download,
  Loader2,
  LayoutGrid,
  MessageCircle,
  Phone,
  Play,
  Search,
  Shirt,
  Sparkles,
  Star,
  Users,
} from 'lucide-react'

import { FiloLogo } from '@/components/layout/FiloLogo'

const REVEAL = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const
const REVEAL_T = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

export function LandingPage() {
  return (
    <div className="force-light relative w-full overflow-x-hidden bg-card text-foreground selection:bg-secondary selection:text-foreground">
      <Nav />
      <Hero />
      <Steps />
      <UseCases />
      <Mockup />
      <Features />
      <Testimonial />
      <FinalCTA />
      <Footer />
    </div>
  )
}

/* ─────────────────  NAV  ───────────────── */

function Nav() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border bg-card/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" aria-label="filo home" className="inline-flex items-center">
          <FiloLogo className="h-5 w-auto text-ink" />
        </Link>
        <div className="hidden items-center gap-8 text-sm font-medium text-foreground/80 md:flex">
          <a href="#prodotto" className="transition-colors hover:text-foreground">
            Prodotto
          </a>
          <a href="#use-cases" className="transition-colors hover:text-foreground">
            Per chi
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden text-sm font-medium text-foreground/80 transition-colors hover:text-foreground md:inline-flex"
          >
            Accedi
          </Link>
          <a
            href="mailto:hello@fiilo.it?subject=Richiesta%20demo%20fiilo"
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            Richiedi una demo
          </a>
        </div>
      </div>
    </nav>
  )
}

/* ─────────────────  HERO  ───────────────── */

function Hero() {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      {/* Full-bleed video */}
      <video
        src="/hero.mp4"
        poster="/auth-tailor.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label="Sartoria — momento di vita quotidiana in atelier"
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 0.7
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Dark gradient overlay for legibility */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-start justify-end px-6 pb-16 pt-32 text-primary-foreground md:pb-24">
        <motion.div
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={REVEAL_T}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1 backdrop-blur"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-medium text-white/85">
            Disponibile in Italia · 2026
          </span>
        </motion.div>

        <motion.h1
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ ...REVEAL_T, delay: 0.05 }}
          className="max-w-4xl text-[clamp(2.75rem,7vw,6.5rem)] font-normal leading-[0.95] tracking-[-0.02em] font-[family-name:var(--font-serif)]"
        >
          La sartoria,
          <br />
          organizzata.
        </motion.h1>

        <motion.p
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ ...REVEAL_T, delay: 0.1 }}
          className="mt-6 max-w-lg text-lg leading-relaxed text-white/80"
        >
          Clienti, misure, ordini, WhatsApp. Tutto cucito in un solo gestionale
          pensato per atelier su misura italiani.
        </motion.p>

        <motion.div
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ ...REVEAL_T, delay: 0.15 }}
          className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
          <a
            href="mailto:hello@fiilo.it?subject=Richiesta%20demo%20fiilo"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-[1.02]"
          >
            Richiedi una demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────  STEPS  ───────────────── */

function Steps() {
  const items = [
    {
      n: '1',
      title: 'Prendi le misure',
      body: 'Salva ogni misura nella scheda del cliente. Foto e reference da WhatsApp finiscono lì in automatico.',
    },
    {
      n: '2',
      title: 'Lavora con calma',
      body: 'Pianifica prove e consegne sulla timeline. Ogni capo segue lo stato giusto.',
    },
    {
      n: '3',
      title: 'Consegna, e ricomincia',
      body: 'Storico misure pronto per la stagione dopo. Ogni cliente è una continuità.',
    },
  ]

  return (
    <section className="bg-card py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={REVEAL_T}
          className="mb-16 max-w-2xl"
        >
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
            Come funziona
          </div>
          <h2 className="text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-ink md:text-5xl">
            Tre passi. Zero attriti.
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ ...REVEAL_T, delay: i * 0.08 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-background p-8"
            >
              <span
                className="mb-10 block text-7xl font-normal leading-none tracking-[-0.02em] text-foreground/20"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                {s.n}
              </span>
              <h3 className="mb-2 text-xl font-semibold text-ink">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-foreground/65">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────  USE CASES  ───────────────── */

function UseCases() {
  const cases = [
    {
      label: 'Atelier su misura',
      title: 'Abiti, cappotti, smoking',
      tint: 'bg-[#FFF4ED]',
    },
    {
      label: 'Camicerie',
      title: 'Camicie su misura',
      tint: 'bg-[#F2F2F2]',
    },
    {
      label: 'Pellicceria',
      title: 'Capi spalla in pelle',
      tint: 'bg-[#FBF4EA]',
    },
    {
      label: 'Cravatteria',
      title: 'Cravatte e papillon',
      tint: 'bg-[#EEF1FB]',
    },
  ]

  return (
    <section id="use-cases" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={REVEAL_T}
          className="mb-16 flex flex-col items-start justify-between gap-6 md:flex-row md:items-end"
        >
          <div>
            <div className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
              Per chi
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-ink md:text-5xl">
              Per ogni mestiere
              <br />
              della sartoria.
            </h2>
          </div>
          <p className="max-w-sm text-[15px] text-foreground/65">
            filo si adatta alla tua bottega — non viceversa. Workflow e campi
            personalizzabili.
          </p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {cases.map((c, i) => (
            <motion.a
              key={c.label}
              href="#"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...REVEAL_T, delay: i * 0.06 }}
              whileHover={{ y: -4 }}
              className={`group relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl p-6 ${c.tint}`}
            >
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-foreground/55">
                {c.label}
              </span>
              <h3
                className="text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-4xl"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                {c.title}
              </h3>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────  MOCKUP  ───────────────── */

function Mockup() {
  return (
    <section id="prodotto" className="bg-primary py-24 text-primary-foreground md:py-32">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={REVEAL_T}
          className="mb-16 max-w-2xl"
        >
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/55">
            Prodotto
          </div>
          <h2 className="text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] md:text-5xl">
            Un gestionale che parla
            <br />
            la lingua del sarto.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ ...REVEAL_T, duration: 0.9 }}
          className="relative rounded-2xl bg-card/5 p-1 ring-1 ring-card/10 md:p-2"
        >
          <div className="flex min-h-[500px] overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-2xl">
            {/* Sidebar */}
            <aside className="hidden w-16 flex-col items-center gap-5 border-r border-border bg-secondary py-6 md:flex">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <LayoutGrid className="h-4 w-4" />
              </div>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/55 hover:bg-card hover:text-foreground">
                <Search className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/55 hover:bg-card hover:text-foreground">
                <Users className="h-4 w-4" />
              </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg text-foreground/55 hover:bg-card hover:text-foreground">
                <Calendar className="h-4 w-4" />
              </button>
              <div className="mt-auto flex h-8 w-8 items-center justify-center rounded-full bg-secondary">
                <span className="text-[10px] font-medium text-foreground/55">MD</span>
              </div>
            </aside>

            <div className="relative flex flex-1 flex-col">
              <div className="flex h-14 items-center justify-between border-b border-border px-6">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-ink">Ordini · FW 2026</h3>
                  <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/55">
                    In corso
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-1 text-xs font-medium text-foreground/55 hover:text-foreground">
                    <Download className="h-3 w-3" /> Esporta
                  </button>
                  <button className="flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90">
                    <Play className="h-3 w-3 fill-current" />
                    Nuovo ordine
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <div className="min-w-[800px]">
                  <div className="grid grid-cols-12 border-b border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                    <div className="col-span-1 border-r border-border px-6 py-3">
                      <input type="checkbox" readOnly className="h-3 w-3 rounded border-border focus:ring-0" />
                    </div>
                    <div className="col-span-3 flex items-center gap-2 border-r border-border px-4 py-3">
                      <Users className="h-3 w-3" /> Cliente
                    </div>
                    <div className="col-span-3 flex items-center gap-2 border-r border-border px-4 py-3">
                      <Shirt className="h-3 w-3" /> Capo
                    </div>
                    <div className="col-span-3 flex items-center gap-2 border-r border-border px-4 py-3">
                      <Sparkles className="h-3 w-3 text-accent" /> Stato
                    </div>
                    <div className="col-span-2 flex items-center gap-2 px-4 py-3">
                      <Calendar className="h-3 w-3" /> Consegna
                    </div>
                  </div>

                  <Row initials="MB" name="Marco Bianchi" capo="Abito due bottoni · gessato" status="done" delivery="12 mag" />
                  <Row initials="GE" name="Giovanna Esposito" capo="Cappotto cammello" status="done" delivery="18 mag" />
                  <Row initials="CD" name="Carlo De Luca" capo="Smoking nero · revers a punta" status="processing" delivery="25 mag" />
                  <div className="grid grid-cols-12 text-xs text-foreground/55">
                    <div className="col-span-1 flex items-center border-r border-border px-6 py-3.5">
                      <input type="checkbox" readOnly className="h-3 w-3 rounded border-border focus:ring-0" />
                    </div>
                    <div className="col-span-11 px-4 py-3.5 text-[10px] italic">
                      Altri 24 ordini in attesa…
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-full border border-border bg-card py-2 pl-3 pr-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                <span className="text-xs font-medium text-foreground/65">
                  Nuovo messaggio WhatsApp
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Row({
  initials,
  name,
  capo,
  status,
  delivery,
}: {
  initials: string
  name: string
  capo: string
  status: 'done' | 'processing'
  delivery: string
}) {
  return (
    <div className={`grid grid-cols-12 border-b border-border text-xs text-foreground transition-colors hover:bg-secondary/60 ${status === 'processing' ? 'bg-accent/5' : ''}`}>
      <div className="col-span-1 flex items-center border-r border-border px-6 py-3.5">
        <input type="checkbox" readOnly className="h-3 w-3 rounded border-border focus:ring-0" />
      </div>
      <div className="col-span-3 flex items-center gap-3 border-r border-border px-4 py-3.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-[8px] font-bold text-foreground">
          {initials}
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <div className="col-span-3 border-r border-border px-4 py-3.5 text-foreground/55">
        {capo}
      </div>
      <div className="col-span-3 flex items-center border-r border-border px-4 py-3.5">
        {status === 'done' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-500" /> Consegnato
          </span>
        ) : (
          <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> In lavorazione
          </span>
        )}
      </div>
      <div className="col-span-2 px-4 py-3.5 font-mono text-[10px] text-foreground/55">
        {delivery}
      </div>
    </div>
  )
}

/* ─────────────────  FEATURES  ───────────────── */

function Features() {
  const cards = [
    {
      colSpan: 2 as const,
      title: 'WhatsApp integrato',
      body: 'Foto, misure e reference dei clienti finiscono nella scheda. Niente più chat disperse o screenshot persi nella galleria.',
      accent: true,
    },
    {
      colSpan: 1 as const,
      title: 'Misure storiche',
      body: 'Storico delle prove, confronto fra stagioni.',
    },
    {
      colSpan: 1 as const,
      title: 'Catalogo capi',
      body: 'Modelli, tessuti e finiture pronti.',
    },
    {
      colSpan: 2 as const,
      title: 'Calendario produzione',
      body: 'Prove, consegne e carichi su una timeline chiara. Nessuna sorpresa a fine mese.',
    },
  ]
  return (
    <section className="bg-card py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={REVEAL_T}
          className="mb-16 max-w-3xl"
        >
          <div className="mb-4 text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
            Funzionalità
          </div>
          <h2 className="text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-ink md:text-5xl">
            Tutto quello che serve. Niente di più.
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ ...REVEAL_T, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className={`group relative overflow-hidden rounded-3xl border border-border bg-background p-8 ${c.colSpan === 2 ? 'md:col-span-2' : ''}`}
            >
              {c.accent && (
                <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-accent/15 blur-2xl" />
              )}
              <h3
                className="mb-3 text-2xl font-normal tracking-[-0.02em] text-ink md:text-3xl"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                {c.title}
              </h3>
              <p className="max-w-md text-[15px] leading-relaxed text-foreground/65">
                {c.body}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────  TESTIMONIAL  ───────────────── */

function Testimonial() {
  return (
    <section className="bg-background py-24 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={REVEAL_T}
        className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-10 text-center md:p-14"
      >
        <div className="mb-5 flex items-center justify-center gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-4 w-4 fill-accent text-accent" />
          ))}
        </div>
        <p className="text-2xl font-medium leading-relaxed text-ink md:text-3xl">
          “Da quando uso filo, le misure non si perdono più. E le serate finiscono prima.”
        </p>
        <div className="mt-7 flex items-center justify-center gap-3">
          <div className="h-10 w-10 rounded-full bg-secondary" />
          <div className="text-left">
            <div className="text-sm font-medium">Antonio Esposito</div>
            <div className="text-xs text-foreground/55">Sartoria Esposito · Napoli</div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ─────────────────  FINAL CTA  ───────────────── */

function FinalCTA() {
  return (
    <section className="bg-card px-4 pb-24 md:px-6 md:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={REVEAL_T}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary px-8 py-20 text-center md:px-16 md:py-28"
      >
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />

        <h2 className="relative text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-primary-foreground md:text-6xl">
          Pronto a cucire il prossimo capo?
        </h2>
        <p className="relative mx-auto mt-6 max-w-md text-[15px] text-primary-foreground/65">
          Stiamo aprendo l’early access agli atelier italiani. Scrivici per una demo personalizzata.
        </p>
        <div className="relative mt-10 flex justify-center">
          <a
            href="mailto:hello@fiilo.it?subject=Richiesta%20demo%20fiilo"
            className="group inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-[1.02]"
          >
            Richiedi una demo
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>
      </motion.div>
    </section>
  )
}

/* ─────────────────  FOOTER  ───────────────── */

function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <Link href="/" aria-label="filo home" className="inline-flex">
          <FiloLogo className="h-5 w-auto text-ink" />
        </Link>
        <div className="text-xs text-foreground/55">
          © {new Date().getFullYear()} fiilo · Gestionale per sartorie su misura
        </div>
        <div className="flex items-center gap-5">
          <a
            href="mailto:hello@fiilo.it"
            className="text-foreground/55 transition-colors hover:text-foreground"
            aria-label="Email"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
          <a
            href="tel:+390000000000"
            className="text-foreground/55 transition-colors hover:text-foreground"
            aria-label="Telefono"
          >
            <Phone className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}
