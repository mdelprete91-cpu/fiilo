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
      title1: 'Un gestionale',
      title2: 'cucito addosso al mestiere.',
      subhead:
        'Configuratore d’abito, preventivo PDF, WhatsApp, produzione: pensati per atelier su misura, non riadattati da un CRM generico. Apriamo i primi accessi nel 2026.',
      cta: 'Richiedi una demo',
    },
    mockup: {
      marker: 'I.',
      eyebrow: 'Il prodotto',
      titleLine1Before: 'Un ',
      titleLine1Em: 'configuratore',
      titleLine2: 'che parla la lingua del sarto.',
      lede:
        'Tessuto, taglio, dettagli: si scelgono davanti al cliente. Il preventivo PDF parte già firmato con il vostro logo. Niente più stime perse nei thread WhatsApp.',
      chip1: 'Configuratore + preventivo PDF',
      chip2: 'WhatsApp categorizzato con AI',
      chip3: 'Misure storiche per cliente',
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
      title: 'Dal preventivo alla consegna, in continuità.',
      items: [
        {
          n: '1',
          title: 'Cliente, misure, contesto',
          body:
            'Scheda cliente con misure, foto, preferenze. Anche foto e audio WhatsApp ci finiscono dentro, già categorizzati dall’AI.',
        },
        {
          n: '2',
          title: 'Configura insieme al cliente',
          body:
            'Tessuto, taglio, finiture, bottoni: scelti al banco. Il preventivo PDF parte prima che il cliente esca dall’atelier.',
        },
        {
          n: '3',
          title: 'Produzione sotto controllo',
          body:
            'Pipeline visiva, stati e date chiari. Quando il capo è pronto, il cliente lo sa: nessun follow-up dimenticato.',
        },
      ],
    },
    useCases: {
      marker: 'III.',
      eyebrow: 'Per chi',
      titleLine1: 'Per chi vive',
      titleLine2: 'di misura.',
      lede:
        'filo si adatta al vostro flusso. Nomi, stati, finiture: tutto modellato sul mestiere reale, non su quello immaginato da un product manager.',
      items: [
        {
          label: 'Atelier su misura',
          title: 'Abiti, cappotti, smoking',
          body:
            'Configurazione capo, misure storiche per cliente, prove in calendario, stato di lavorazione vivo. Pensato per chi parte sempre dalla persona.',
          tint: 'bg-[#FFF4ED]',
        },
        {
          label: 'Camicerie',
          title: 'Camicie su misura',
          body:
            'Collo, polso, spalla salvati per stagione. WhatsApp del cliente integrato alla scheda: continuità tra una rivisitazione e la successiva.',
          tint: 'bg-[#F2F2F2]',
        },
      ],
      footnote: 'Pellicceria, cravatteria, modisteria: in roadmap. Scriveteci durante la demo per parlarne.',
    },
    features: {
      marker: 'IV.',
      eyebrow: 'Funzionalità',
      title: 'Quattro pilastri. Zero gimmick.',
      cards: [
        {
          colSpan: 2 as 1 | 2,
          title: 'Configuratore + preventivo PDF',
          body:
            'Tessuto, taglio, dettagli, bottoni: scelti al banco insieme al cliente. Il PDF firmato col vostro logo esce in un click. È l’esperienza di vendita che la sartoria su misura merita.',
          accent: true,
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'WhatsApp categorizzato',
          body: 'AI legge foto, audio, misure, conferme. Tutto finisce nella scheda giusta.',
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'Misure storiche',
          body: 'Ogni prova archiviata. Confronti stagione su stagione, anno su anno.',
        },
        {
          colSpan: 2 as 1 | 2,
          title: 'Pipeline produzione',
          body:
            'Bozza, conferma, prova, lavorazione, consegna. Una timeline pulita per ogni capo. Niente più ritardi che vi sfuggono fino al giorno della consegna.',
        },
      ],
    },
    finalCta: {
      marker: 'V.',
      eyebrow: 'Nota dal fondatore',
      line1:
        'Vengo dall’automotive, dove comprare un’auto è ormai un’esperienza configurata, accompagnata, ricca. Si configura il veicolo col venditore, si firma il preventivo, si aspetta la consegna nella fiducia che tutto fili.',
      line2:
        'La sartoria su misura segue lo stesso processo, da decenni. Solo, senza strumenti che parlino la sua lingua. Il cliente esce dall’atelier e troppe volte se ne perdono le tracce.',
      line3:
        'filo non snatura il mestiere. Lo mette al passo con il presente. Apriamo i primi accessi nel 2026: se siete un atelier serio, parliamone.',
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
      title1: 'Software',
      title2: 'tailored to the craft.',
      subhead:
        'Garment configurator, PDF quote, WhatsApp, production: built for bespoke ateliers, not retrofitted from a generic CRM. We are opening the first seats in 2026.',
      cta: 'Request a demo',
    },
    mockup: {
      marker: 'I.',
      eyebrow: 'The product',
      titleLine1Before: 'A ',
      titleLine1Em: 'configurator',
      titleLine2: 'that speaks the tailor’s language.',
      lede:
        'Fabric, cut, details: configured at the bench, in front of the client. The PDF quote leaves signed with your logo. No more estimates lost in WhatsApp threads.',
      chip1: 'Configurator + PDF quote',
      chip2: 'AI-tagged WhatsApp',
      chip3: 'Per-client measurement history',
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
      title: 'From quote to delivery, in continuity.',
      items: [
        {
          n: '1',
          title: 'Client, measurements, context',
          body:
            'Client record with measurements, photos, preferences. Photos and audio from WhatsApp land there too, AI-categorised.',
        },
        {
          n: '2',
          title: 'Configure with the client',
          body:
            'Fabric, cut, finishes, buttons: chosen at the bench. The PDF quote is ready before the client leaves.',
        },
        {
          n: '3',
          title: 'Production under control',
          body:
            'Visual pipeline with clear statuses and dates. When the garment is ready, the client knows. Nothing slips.',
        },
      ],
    },
    useCases: {
      marker: 'III.',
      eyebrow: 'Use cases',
      titleLine1: 'For everyone who',
      titleLine2: 'works to measure.',
      lede:
        'filo adapts to your workflow. Names, statuses, finishes: shaped around the real craft, not the one imagined by a product manager.',
      items: [
        {
          label: 'Bespoke ateliers',
          title: 'Suits, coats, tuxedos',
          body:
            'Garment configuration, per-client measurement history, scheduled fittings, live work-in-progress. Built for ateliers that start from the person.',
          tint: 'bg-[#FFF4ED]',
        },
        {
          label: 'Shirtmakers',
          title: 'Made-to-measure shirts',
          body:
            'Collar, cuff and shoulder saved by season. The client’s WhatsApp wired right to the record: continuity from one revision to the next.',
          tint: 'bg-[#F2F2F2]',
        },
      ],
      footnote: 'Furriers, tie-makers, milliners: on the roadmap. Tell us during the demo.',
    },
    features: {
      marker: 'IV.',
      eyebrow: 'Features',
      title: 'Four pillars. Zero gimmick.',
      cards: [
        {
          colSpan: 2 as 1 | 2,
          title: 'Configurator + PDF quote',
          body:
            'Fabric, cut, details, buttons: chosen at the bench with the client. The signed PDF, with your logo, comes out in a click. The sales experience bespoke tailoring deserves.',
          accent: true,
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'AI-tagged WhatsApp',
          body: 'AI reads photos, audio, measurements, confirmations. Everything lands on the right record.',
        },
        {
          colSpan: 1 as 1 | 2,
          title: 'Measurement history',
          body: 'Every fitting archived. Compare season to season, year to year.',
        },
        {
          colSpan: 2 as 1 | 2,
          title: 'Production pipeline',
          body:
            'Draft, confirm, fitting, work-in-progress, delivery. One clean timeline per garment. No more delays sneaking up on you.',
        },
      ],
    },
    finalCta: {
      marker: 'V.',
      eyebrow: 'A note from the founder',
      line1: 'I come from automotive, where buying a car is now a configured, accompanied, polished experience. You walk in, configure the vehicle with a sales advisor, sign a quote, leave trusting that everything is in motion.',
      line2: 'Bespoke tailoring has been doing the same for decades. Just without tools that speak its language. Too often, after delivery, the client disappears.',
      line3: 'filo does not change the craft. It brings it into the present. We are opening the first seats in 2026: if you run a serious atelier, let us talk.',
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
