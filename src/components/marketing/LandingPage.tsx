'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Calendar,
  Download,
  Loader2,
  LayoutGrid,
  MessageCircle,
  Play,
  Search,
  Shirt,
  Sparkles,
  Users,
} from 'lucide-react'

import { FiloLogo } from '@/components/layout/FiloLogo'

const REVEAL = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
} as const
const REVEAL_T = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const }

/* ─────────────────  i18n  ───────────────── */

export type Locale = 'it' | 'en'

const MAILTO: Record<Locale, string> = {
  it: 'mailto:m.delprete91@gmail.com?subject=Richiesta%20demo%20fiilo',
  en: 'mailto:m.delprete91@gmail.com?subject=fiilo%20demo%20request',
}

const COPY = {
  it: {
    nav: { product: 'Prodotto', useCases: 'Per chi', login: 'Accedi', cta: 'Richiedi una demo' },
    hero: {
      badge: 'In fase di lancio',
      title1: 'La sartoria,',
      title2: 'organizzata.',
      subhead:
        'Clienti, misure, ordini, WhatsApp: cuciti in un solo gestionale per atelier su misura italiani. Stiamo aprendo l’accesso ai primi atelier nel 2026.',
      cta: 'Richiedi una demo',
    },
    mockup: {
      marker: 'I.',
      eyebrow: 'Il prodotto',
      titleLine1Before: 'Un ',
      titleLine1Em: 'gestionale',
      titleLine2: 'che parla la lingua del sarto.',
      lede:
        'Clienti, misure, lavorazioni e WhatsApp in un solo spazio. Niente menu inventati: solo i nomi che usa già in atelier.',
      chip1: 'Categorizza WhatsApp con AI',
      chip2: 'Misure storiche per cliente',
      chip3: 'PDF preventivi e ricevute',
      app: {
        header: 'Ordini · FW 2026',
        statusPill: 'In corso',
        col1: 'Cliente',
        col2: 'Capo',
        col3: 'Stato',
        col4: 'Consegna',
        exportBtn: 'Esporta',
        newOrderBtn: 'Nuovo ordine',
        rows: [
          { name: 'Marco Bianchi', capo: 'Abito due bottoni · gessato', delivery: '12 mag' },
          { name: 'Giovanna Esposito', capo: 'Cappotto cammello', delivery: '18 mag' },
          { name: 'Carlo De Luca', capo: 'Smoking nero · revers a punta', delivery: '25 mag' },
        ],
        statusDone: 'Consegnato',
        statusProcessing: 'In lavorazione',
        pending: 'Altri 24 ordini in attesa…',
        waNotif: 'Nuovo messaggio WhatsApp',
      },
    },
    steps: {
      marker: 'II.',
      eyebrow: 'Come funziona',
      title: 'Tre passi. Zero attriti.',
      items: [
        {
          n: '1',
          title: 'Prendi le misure',
          body:
            'Salva ogni misura nella scheda del cliente. Foto e reference da WhatsApp finiscono lì in automatico.',
        },
        {
          n: '2',
          title: 'Lavora con calma',
          body:
            'Pianifica prove e consegne sulla timeline. Ogni capo segue lo stato giusto.',
        },
        {
          n: '3',
          title: 'Consegna, e ricomincia',
          body:
            'Storico misure pronto per la stagione dopo. Ogni cliente è una continuità.',
        },
      ],
    },
    useCases: {
      marker: 'III.',
      eyebrow: 'Per chi',
      titleLine1: 'Per ogni mestiere',
      titleLine2: 'della sartoria.',
      lede:
        'filo si adatta alla tua bottega, non viceversa. Workflow e campi personalizzabili.',
      items: [
        {
          label: 'Atelier su misura',
          title: 'Abiti, cappotti, smoking',
          body:
            'Configurazione capo, misure storiche per cliente, gestione delle prove e dello stato di lavorazione.',
          tint: 'bg-[#FFF4ED]',
        },
        {
          label: 'Camicerie',
          title: 'Camicie su misura',
          body:
            'Misure di polso, collo e spalla salvate per stagione. WhatsApp del cliente integrato alla scheda.',
          tint: 'bg-[#F2F2F2]',
        },
      ],
      footnote: 'Altre lavorazioni in arrivo: scrivici per discuterne durante la demo.',
    },
    features: {
      marker: 'IV.',
      eyebrow: 'Funzionalità',
      title: 'Tutto quello che serve. Niente di più.',
      cards: [
        {
          colSpan: 2 as 1 | 2,
          title: 'WhatsApp integrato',
          body:
            'Foto, misure e reference dei clienti finiscono nella scheda. Niente più chat disperse o screenshot persi nella galleria.',
          accent: true,
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'Misure storiche',
          body: 'Storico delle prove, confronto fra stagioni.',
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'Catalogo capi',
          body: 'Modelli, tessuti e finiture pronti.',
        },
        {
          colSpan: 2 as 1 | 2,
          title: 'Calendario produzione',
          body:
            'Prove, consegne e carichi su una timeline chiara. Nessuna sorpresa a fine mese.',
        },
      ],
    },
    finalCta: {
      marker: 'V.',
      eyebrow: 'Nota dal fondatore',
      line1: 'Stiamo aprendo filo un capo alla volta.',
      line2: 'Se cercate uno strumento che vi somigli, scriveteci.',
      line3: 'Vediamo insieme se c’è terreno comune.',
      signatureName: 'Mario Del Prete',
      signatureRole: 'fondatore',
      cta: 'Richiedi una demo',
    },
    footer: { tagline: 'Gestionale per sartorie su misura', emailLabel: 'Email' },
  },
  en: {
    nav: { product: 'Product', useCases: 'Use cases', login: 'Log in', cta: 'Request a demo' },
    hero: {
      badge: 'Launching soon',
      title1: 'Tailoring,',
      title2: 'organised.',
      subhead:
        'Clients, measurements, orders, WhatsApp: stitched into one workspace built for Italian bespoke ateliers. We’re opening access to the first ateliers in 2026.',
      cta: 'Request a demo',
    },
    mockup: {
      marker: 'I.',
      eyebrow: 'The product',
      titleLine1Before: 'A tool that ',
      titleLine1Em: 'speaks',
      titleLine2: 'the tailor’s language.',
      lede:
        'Clients, measurements, work-in-progress and WhatsApp in one space. No invented menus, only the words you already use in the atelier.',
      chip1: 'AI-categorised WhatsApp',
      chip2: 'Per-client measurement history',
      chip3: 'PDF quotes and receipts',
      app: {
        header: 'Orders · FW 2026',
        statusPill: 'In progress',
        col1: 'Client',
        col2: 'Garment',
        col3: 'Status',
        col4: 'Delivery',
        exportBtn: 'Export',
        newOrderBtn: 'New order',
        rows: [
          { name: 'Marco Bianchi', capo: 'Two-button suit · pinstripe', delivery: '12 May' },
          { name: 'Giovanna Esposito', capo: 'Camel coat', delivery: '18 May' },
          { name: 'Carlo De Luca', capo: 'Black tuxedo · peak lapel', delivery: '25 May' },
        ],
        statusDone: 'Delivered',
        statusProcessing: 'In progress',
        pending: '24 more orders pending…',
        waNotif: 'New WhatsApp message',
      },
    },
    steps: {
      marker: 'II.',
      eyebrow: 'How it works',
      title: 'Three steps. Zero friction.',
      items: [
        {
          n: '1',
          title: 'Take the measurements',
          body:
            'Save every measurement to the client’s record. Photos and references from WhatsApp land there automatically.',
        },
        {
          n: '2',
          title: 'Work at your pace',
          body:
            'Schedule fittings and deliveries on the timeline. Every garment follows the right status.',
        },
        {
          n: '3',
          title: 'Deliver, and start again',
          body:
            'Measurement history is ready for the next season. Every client is a continuity.',
        },
      ],
    },
    useCases: {
      marker: 'III.',
      eyebrow: 'Use cases',
      titleLine1: 'For every craft',
      titleLine2: 'of tailoring.',
      lede:
        'filo adapts to your workshop, not the other way round. Workflows and fields are yours to shape.',
      items: [
        {
          label: 'Bespoke ateliers',
          title: 'Suits, coats, tuxedos',
          body:
            'Garment configuration, per-client measurement history, fitting scheduling and work-in-progress tracking.',
          tint: 'bg-[#FFF4ED]',
        },
        {
          label: 'Shirtmakers',
          title: 'Made-to-measure shirts',
          body:
            'Cuff, collar and shoulder measurements saved by season. The client’s WhatsApp wired right to the record.',
          tint: 'bg-[#F2F2F2]',
        },
      ],
      footnote: 'More crafts coming: tell us during the demo.',
    },
    features: {
      marker: 'IV.',
      eyebrow: 'Features',
      title: 'Everything you need. Nothing more.',
      cards: [
        {
          colSpan: 2 as 1 | 2,
          title: 'WhatsApp integrated',
          body:
            'Photos, measurements and references from clients land in the record. No more scattered chats or screenshots lost in the camera roll.',
          accent: true,
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'Measurement history',
          body: 'Fitting history, season-to-season comparisons.',
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'Garment catalogue',
          body: 'Models, fabrics and finishes ready to use.',
        },
        {
          colSpan: 2 as 1 | 2,
          title: 'Production calendar',
          body:
            'Fittings, deliveries and workloads on one clear timeline. No end-of-month surprises.',
        },
      ],
    },
    finalCta: {
      marker: 'V.',
      eyebrow: 'A note from the founder',
      line1: 'We are opening filo one piece at a time.',
      line2: 'If you are looking for a tool that resembles you, write to us.',
      line3: 'Let us meet, and see if there is common ground.',
      signatureName: 'Mario Del Prete',
      signatureRole: 'founder',
      cta: 'Request a demo',
    },
    footer: { tagline: 'Software for bespoke tailoring', emailLabel: 'Email' },
  },
}

type Copy = (typeof COPY)['it']

interface LandingPageProps {
  locale: Locale
}

export function LandingPage({ locale }: LandingPageProps) {
  const t = COPY[locale]
  const mailto = MAILTO[locale]
  return (
    <div className="force-light relative w-full overflow-x-hidden bg-card text-foreground selection:bg-secondary selection:text-foreground">
      <Nav t={t} mailto={mailto} />
      <Hero t={t} mailto={mailto} />
      <Mockup t={t} />
      <Steps t={t} />
      <UseCases t={t} />
      <Features t={t} />
      <FinalCTA t={t} mailto={mailto} />
      <Footer t={t} />
    </div>
  )
}

/* ─────────────────  NAV  ───────────────── */

function Nav({ t, mailto }: { t: Copy; mailto: string }) {
  // Stato "over hero": nav trasparente in negativo. Quando si scrolla oltre,
  // il piatto di vetro fade in e i colori swappano in positivo.
  const [isOverHero, setIsOverHero] = useState(true)

  useEffect(() => {
    let ticking = false
    const check = () => {
      const navH = window.innerWidth >= 768 ? 64 : 56
      const threshold = window.innerHeight - navH
      setIsOverHero(window.scrollY < threshold)
      ticking = false
    }
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(check)
        ticking = true
      }
    }
    check()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const trans = 'transition-colors duration-300 ease-out motion-reduce:transition-none'

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b ${trans} ${
        isOverHero ? 'border-transparent' : 'border-foreground/10'
      }`}
    >
      {/* Glass plate — opacity fade so backdrop-filter doesn't pop in */}
      <div
        aria-hidden
        className={`absolute inset-0 -z-10 bg-card/90 backdrop-blur-xl backdrop-saturate-150 transition-opacity duration-300 ease-out motion-reduce:transition-none ${
          isOverHero ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ backgroundColor: 'color-mix(in srgb, var(--card) 90%, transparent)' }}
      />

      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 md:h-16 md:px-6">
        <Link href="/" aria-label="filo home" className="inline-flex items-center">
          <FiloLogo
            className={`h-[18px] w-auto md:h-5 ${trans} ${
              isOverHero ? 'text-white' : 'text-ink'
            }`}
          />
        </Link>
        <div
          className={`hidden items-center gap-8 text-sm font-medium md:flex ${trans} ${
            isOverHero ? 'text-white/85' : 'text-foreground/75'
          }`}
        >
          <a
            href="#prodotto"
            className={
              isOverHero
                ? 'transition-colors hover:text-white'
                : 'transition-colors hover:text-foreground'
            }
          >
            {t.nav.product}
          </a>
          <a
            href="#use-cases"
            className={
              isOverHero
                ? 'transition-colors hover:text-white'
                : 'transition-colors hover:text-foreground'
            }
          >
            {t.nav.useCases}
          </a>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/login"
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${trans} ${
              isOverHero
                ? 'text-white/85 hover:bg-white/10 hover:text-white'
                : 'text-foreground/75 hover:bg-foreground/5 hover:text-foreground'
            }`}
          >
            {t.nav.login}
          </Link>
          <a
            href={mailto}
            className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium hover:scale-[1.02] sm:px-4 ${trans} transition-transform ${
              isOverHero
                ? 'bg-white text-foreground hover:bg-white/95'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {t.nav.cta}
          </a>
        </div>
      </nav>
    </header>
  )
}

/* ─────────────────  HERO  ───────────────── */

function Hero({ t, mailto }: { t: Copy; mailto: string }) {
  return (
    <section className="relative h-[100svh] min-h-[640px] w-full overflow-hidden">
      <video
        src="/hero.mp4"
        poster="/auth-tailor.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-label="Tailoring atelier"
        onLoadedMetadata={(e) => {
          e.currentTarget.playbackRate = 0.7
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col items-start justify-end px-6 pb-16 pt-32 text-primary-foreground md:pb-24">
        <motion.div
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={REVEAL_T}
          className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-black/20 px-3 py-1 backdrop-blur"
        >
          <span className="flex h-2 w-2 rounded-full bg-accent" />
          <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/85">
            {t.hero.badge}
          </span>
        </motion.div>

        <motion.h1
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ ...REVEAL_T, delay: 0.05 }}
          className="max-w-4xl text-[clamp(2.75rem,7vw,6.5rem)] font-normal leading-[0.95] tracking-[-0.02em] font-[family-name:var(--font-serif)]"
        >
          {t.hero.title1}
          <br />
          {t.hero.title2}
        </motion.h1>

        <motion.p
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ ...REVEAL_T, delay: 0.1 }}
          className="mt-6 max-w-lg text-lg leading-relaxed text-white/80"
        >
          {t.hero.subhead}
        </motion.p>

        <motion.div
          variants={REVEAL}
          initial="hidden"
          animate="visible"
          transition={{ ...REVEAL_T, delay: 0.15 }}
          className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
        >
          <a
            href={mailto}
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-[1.02]"
          >
            {t.hero.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </a>
        </motion.div>
      </div>
    </section>
  )
}

/* ─────────────────  MOCKUP  ───────────────── */

function Mockup({ t }: { t: Copy }) {
  const m = t.mockup
  return (
    <section id="prodotto" className="relative overflow-hidden bg-background py-24 md:py-32">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(ellipse 70% 55% at 50% 60%, var(--secondary) 0%, transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={REVEAL_T}
          className="mb-16 grid items-end gap-8 md:mb-20 md:grid-cols-[1fr_auto] md:gap-16"
        >
          <div>
            <div className="mb-5 flex items-baseline gap-3">
              <span
                className="text-2xl italic leading-none text-foreground/30"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                {m.marker}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
                {m.eyebrow}
              </span>
            </div>
            <h2
              className="max-w-3xl text-5xl font-normal leading-[0.95] tracking-[-0.02em] text-ink md:text-7xl"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              {m.titleLine1Before}
              <span className="italic text-foreground/55">{m.titleLine1Em}</span>
              <br />
              {m.titleLine2}
            </h2>
          </div>
          <p className="max-w-xs text-[15px] leading-relaxed text-foreground/60 md:pb-3">
            {m.lede}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ ...REVEAL_T, duration: 0.9 }}
          className="relative"
        >
          <AnnotationChip
            className="left-[-1.5rem] top-12 md:left-[-3rem] md:top-16"
            delay={0.5}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span>{m.chip1}</span>
          </AnnotationChip>
          <AnnotationChip
            className="right-[-1rem] top-[35%] md:right-[-2.5rem]"
            delay={0.65}
          >
            <span className="font-mono text-foreground/45">·</span>
            <span>{m.chip2}</span>
          </AnnotationChip>
          <AnnotationChip
            className="bottom-[-1rem] left-[12%] md:bottom-[-1.25rem] md:left-[18%]"
            delay={0.8}
          >
            <span className="font-mono text-foreground/45">·</span>
            <span>{m.chip3}</span>
          </AnnotationChip>

          <div className="relative overflow-hidden rounded-2xl bg-card shadow-[0_30px_80px_-20px_rgb(0,0,0,0.18)] ring-1 ring-foreground/8">
            <div className="flex min-h-[500px] overflow-hidden rounded-xl border border-border bg-card text-foreground">
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
                    <h3 className="text-sm font-medium text-ink">{m.app.header}</h3>
                    <span className="rounded bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground/55">
                      {m.app.statusPill}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1 text-xs font-medium text-foreground/55 hover:text-foreground">
                      <Download className="h-3 w-3" /> {m.app.exportBtn}
                    </button>
                    <button className="flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-sm hover:opacity-90">
                      <Play className="h-3 w-3 fill-current" />
                      {m.app.newOrderBtn}
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-12 border-b border-border bg-secondary/60 text-[11px] font-medium uppercase tracking-wider text-foreground/55">
                      <div className="col-span-1 border-r border-border px-6 py-3">
                        <input
                          type="checkbox"
                          readOnly
                          className="h-3 w-3 rounded border-border focus:ring-0"
                        />
                      </div>
                      <div className="col-span-3 flex items-center gap-2 border-r border-border px-4 py-3">
                        <Users className="h-3 w-3" /> {m.app.col1}
                      </div>
                      <div className="col-span-3 flex items-center gap-2 border-r border-border px-4 py-3">
                        <Shirt className="h-3 w-3" /> {m.app.col2}
                      </div>
                      <div className="col-span-3 flex items-center gap-2 border-r border-border px-4 py-3">
                        <Sparkles className="h-3 w-3 text-accent" /> {m.app.col3}
                      </div>
                      <div className="col-span-2 flex items-center gap-2 px-4 py-3">
                        <Calendar className="h-3 w-3" /> {m.app.col4}
                      </div>
                    </div>

                    {m.app.rows.map((row, idx) => (
                      <Row
                        key={row.name}
                        initials={initials(row.name)}
                        name={row.name}
                        capo={row.capo}
                        status={idx === m.app.rows.length - 1 ? 'processing' : 'done'}
                        delivery={row.delivery}
                        doneLabel={m.app.statusDone}
                        processingLabel={m.app.statusProcessing}
                      />
                    ))}
                    <div className="grid grid-cols-12 text-xs text-foreground/55">
                      <div className="col-span-1 flex items-center border-r border-border px-6 py-3.5">
                        <input
                          type="checkbox"
                          readOnly
                          className="h-3 w-3 rounded border-border focus:ring-0"
                        />
                      </div>
                      <div className="col-span-11 px-4 py-3.5 text-[10px] italic">
                        {m.app.pending}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 flex items-center gap-3 rounded-full border border-border bg-card py-2 pl-3 pr-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                  <span className="text-xs font-medium text-foreground/65">
                    {m.app.waNotif}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function AnnotationChip({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1], delay }}
      className={`absolute z-10 hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-[0_10px_30px_-8px_rgb(0,0,0,0.15)] md:inline-flex ${className ?? ''}`}
    >
      {children}
    </motion.div>
  )
}

function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return (first + last).toUpperCase()
}

function Row({
  initials,
  name,
  capo,
  status,
  delivery,
  doneLabel,
  processingLabel,
}: {
  initials: string
  name: string
  capo: string
  status: 'done' | 'processing'
  delivery: string
  doneLabel: string
  processingLabel: string
}) {
  return (
    <div
      className={`grid grid-cols-12 border-b border-border text-xs text-foreground transition-colors hover:bg-secondary/60 ${
        status === 'processing' ? 'bg-accent/5' : ''
      }`}
    >
      <div className="col-span-1 flex items-center border-r border-border px-6 py-3.5">
        <input type="checkbox" readOnly className="h-3 w-3 rounded border-border focus:ring-0" />
      </div>
      <div className="col-span-3 flex items-center gap-3 border-r border-border px-4 py-3.5">
        <div className="flex h-5 w-5 items-center justify-center rounded bg-secondary text-[8px] font-bold text-foreground">
          {initials}
        </div>
        <span className="font-medium">{name}</span>
      </div>
      <div className="col-span-3 border-r border-border px-4 py-3.5 text-foreground/55">{capo}</div>
      <div className="col-span-3 flex items-center border-r border-border px-4 py-3.5">
        {status === 'done' ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            <span className="h-1 w-1 rounded-full bg-emerald-500" /> {doneLabel}
          </span>
        ) : (
          <span className="inline-flex animate-pulse items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
            <Loader2 className="h-2.5 w-2.5 animate-spin" /> {processingLabel}
          </span>
        )}
      </div>
      <div className="col-span-2 px-4 py-3.5 font-mono text-[10px] text-foreground/55">{delivery}</div>
    </div>
  )
}

/* ─────────────────  STEPS  ───────────────── */

function Steps({ t }: { t: Copy }) {
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
          <div className="mb-5 flex items-baseline gap-3">
            <span
              className="text-2xl italic leading-none text-foreground/30"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              {t.steps.marker}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
              {t.steps.eyebrow}
            </span>
          </div>
          <h2 className="text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-ink md:text-5xl">
            {t.steps.title}
          </h2>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {t.steps.items.map((s, i) => (
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

function UseCases({ t }: { t: Copy }) {
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
            <div className="mb-5 flex items-baseline gap-3">
              <span
                className="text-2xl italic leading-none text-foreground/30"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                {t.useCases.marker}
              </span>
              <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
                {t.useCases.eyebrow}
              </span>
            </div>
            <h2 className="max-w-3xl text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-ink md:text-5xl">
              {t.useCases.titleLine1}
              <br />
              {t.useCases.titleLine2}
            </h2>
          </div>
          <p className="max-w-sm text-[15px] text-foreground/65">{t.useCases.lede}</p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-2">
          {t.useCases.items.map((c, i) => (
            <motion.div
              key={c.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ ...REVEAL_T, delay: i * 0.08 }}
              className={`group relative flex aspect-[4/5] flex-col justify-between overflow-hidden rounded-3xl p-8 md:p-10 ${c.tint}`}
            >
              <span className="text-xs font-medium uppercase tracking-[0.18em] text-foreground/55">
                {c.label}
              </span>
              <div className="space-y-4">
                <h3
                  className="text-3xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-4xl"
                  style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
                >
                  {c.title}
                </h3>
                <p className="max-w-sm text-[15px] leading-relaxed text-foreground/65">
                  {c.body}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="mt-10 text-sm text-foreground/55">{t.useCases.footnote}</p>
      </div>
    </section>
  )
}

/* ─────────────────  FEATURES  ───────────────── */

function Features({ t }: { t: Copy }) {
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
          <div className="mb-5 flex items-baseline gap-3">
            <span
              className="text-2xl italic leading-none text-foreground/30"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              {t.features.marker}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-foreground/55">
              {t.features.eyebrow}
            </span>
          </div>
          <h2 className="text-4xl font-normal leading-[1] tracking-[-0.02em] font-[family-name:var(--font-serif)] text-ink md:text-5xl">
            {t.features.title}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {t.features.cards.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ ...REVEAL_T, delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className={`group relative overflow-hidden rounded-3xl border border-border bg-background p-8 ${
                c.colSpan === 2 ? 'md:col-span-2' : ''
              }`}
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
              <p className="max-w-md text-[15px] leading-relaxed text-foreground/65">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─────────────────  FINAL CTA  ───────────────── */

function FinalCTA({ t, mailto }: { t: Copy; mailto: string }) {
  return (
    <section className="bg-card px-4 pb-24 md:px-6 md:pb-32">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-100px' }}
        transition={REVEAL_T}
        className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-primary px-8 py-20 md:px-16 md:py-28"
      >
        <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary-foreground/5 blur-3xl" />

        <div className="relative mx-auto max-w-2xl">
          <div className="mb-12 flex items-baseline gap-3">
            <span
              className="text-2xl italic leading-none text-primary-foreground/30"
              style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
            >
              {t.finalCta.marker}
            </span>
            <span className="text-xs font-medium uppercase tracking-[0.2em] text-primary-foreground/55">
              {t.finalCta.eyebrow}
            </span>
          </div>

          <div
            className="space-y-7 text-3xl font-normal leading-[1.25] tracking-[-0.015em] text-primary-foreground md:text-4xl"
            style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
          >
            <p>{t.finalCta.line1}</p>
            <p className="text-primary-foreground/85">{t.finalCta.line2}</p>
            <p className="italic text-primary-foreground/70">{t.finalCta.line3}</p>
          </div>

          <div className="mt-14 flex items-center gap-4">
            <div className="h-px w-10 bg-primary-foreground/30" />
            <div className="leading-tight">
              <div className="text-sm font-medium text-primary-foreground">
                {t.finalCta.signatureName}
              </div>
              <div
                className="text-xs italic text-primary-foreground/55"
                style={{ fontFamily: 'var(--font-serif), Georgia, serif' }}
              >
                {t.finalCta.signatureRole}
              </div>
            </div>
          </div>

          <div className="mt-12">
            <a
              href={mailto}
              className="group inline-flex items-center gap-2 rounded-full bg-card px-6 py-3.5 text-sm font-medium text-foreground shadow-lg transition-transform hover:scale-[1.02]"
            >
              {t.finalCta.cta}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </motion.div>
    </section>
  )
}

/* ─────────────────  FOOTER  ───────────────── */

function Footer({ t }: { t: Copy }) {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <Link href="/" aria-label="filo home" className="inline-flex">
          <FiloLogo className="h-5 w-auto text-ink" />
        </Link>
        <div className="text-xs text-foreground/55">
          © {new Date().getFullYear()} fiilo · {t.footer.tagline}
        </div>
        <div className="flex items-center gap-5">
          <a
            href="mailto:m.delprete91@gmail.com"
            className="text-foreground/55 transition-colors hover:text-foreground"
            aria-label={t.footer.emailLabel}
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  )
}
