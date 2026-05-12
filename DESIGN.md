---
name: fiilo
description: Gestionale editoriale per sartorie su misura italiane.
colors:
  ink: "#111111"
  canvas-light: "#FAFAFA"
  canvas-dark: "#0A0A0A"
  card-light: "#FFFFFF"
  card-dark: "#161616"
  surface-light: "#F1F1F1"
  surface-dark: "#1F1F1F"
  muted-fg-light: "#6B6B6B"
  muted-fg-dark: "#A1A1A1"
  border-light: "#E5E5E5"
  border-dark: "#2D2D2D"
  fin-orange: "#FF5600"
  fin-orange-dark: "#FF6A1F"
  white-foreground: "#FFFFFF"
  success-fg-light: "#047857"
  success-fg-dark: "#6EE7B7"
  warning-fg-light: "#B45309"
  warning-fg-dark: "#FCD34D"
  kpi-fatturato-light: "#1A4D2E"
  kpi-incassato-light: "#1E3A8A"
  kpi-due-light: "#92400E"
  kpi-fatturato-dark: "#86EFAC"
  kpi-incassato-dark: "#A5B4FC"
  kpi-due-dark: "#FCD34D"
typography:
  display:
    fontFamily: "Instrument Serif, Georgia, Times New Roman, serif"
    fontSize: "clamp(2.75rem, 7vw, 6.5rem)"
    fontWeight: 400
    lineHeight: 0.95
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 400
    lineHeight: 1.05
    letterSpacing: "-0.015em"
  number:
    fontFamily: "Instrument Serif, Georgia, serif"
    fontSize: "3rem"
    fontWeight: 400
    lineHeight: 1
    fontVariantNumeric: "tabular-nums"
  body:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  body-prose:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 600
    letterSpacing: "0.15em"
    textTransform: "uppercase"
  micro:
    fontFamily: "Geist, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
rounded:
  sm: "7px"
  md: "10px"
  lg: "12px"
  xl: "17px"
  "2xl": "22px"
  "3xl": "26px"
  full: "9999px"
spacing:
  hairline: "1px"
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section-tight: "48px"
  section-loose: "96px"
  section-marketing: "192px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white-foreground}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white-foreground}"
  button-secondary:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "8px 14px"
  button-ghost:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.card-light}"
    rounded: "{rounded.xl}"
    padding: "24px"
  card-header:
    backgroundColor: "{colors.card-light}"
    textColor: "{colors.muted-fg-light}"
    typography: "{typography.label}"
    padding: "20px 24px 16px 24px"
  card-footer:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink}"
    padding: "12px 24px"
  input:
    backgroundColor: "{colors.canvas-light}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 14px"
  chip-success:
    backgroundColor: "#D1FAE5"
    textColor: "{colors.success-fg-light}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  chip-warning:
    backgroundColor: "#FEF3C7"
    textColor: "{colors.warning-fg-light}"
    rounded: "{rounded.full}"
    padding: "2px 8px"
  badge-status:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.muted-fg-light}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "2px 6px"
---

# Design System: fiilo

## 1. Overview

**Creative North Star: "Il Quaderno del Sarto"**

fiilo è il quaderno di un sarto: una superficie editoriale, precisa, discreta, dove la scrittura sparisce nel gesto. La pagina è warm off-white come una carta da taccuino non sbiancata; il titolo è in Instrument Serif italic come l'intestazione di una livretto; le etichette sono small-caps con tracking 0.15em come le marche di stagione sul margine; i numeri sono in serif tabular come quelli di un libro mastro sartoriale, non sans-bold da SaaS dashboard. Il nero che usiamo è charcoal #111111, mai puro: come l'inchiostro su un Moleskine, mai un blocco di colore.

Il prodotto rifiuta esplicitamente, in linea con PRODUCT.md: dashboard SaaS generiche con metriche enormi, gradient accent e card identiche a griglia; gestionali anni 2000 con form grigiastre, bordi ovunque, zero gerarchia; app "minimal" che diventano piatte per pigrizia; glassmorphism e gradient text decorativi. Il glass appare solo dove serve (nav sopra il video hero della landing) e mai come scelta default. La voce è italiana, sartoriale, professionale ma intima — non corporativa.

La densità varia con il registro: la landing è generosa (`py-32`, hero a `100svh`, type display fino a `7xl`) perché racconta; il dashboard è denso (`py-4/6`, font `text-[10px]`/`text-[11px]` per le micro-label, table compatte) perché lavora. Tipografia, palette e radius sono però condivisi tra i due registri come una spina dorsale unica.

**Key Characteristics:**
- **Editoriale-tipografica**: Instrument Serif italic per i titoli, marker romani (I., II., III.) sulla landing, small-caps tracked per le label
- **Off-white sempre**: canvas `#FAFAFA` light, `#0A0A0A` warm near-black dark; mai bianco/nero puri
- **Pill buttons ovunque**: `rounded-full` come default su tutti i bottoni primitive e segmented controls
- **Hairline dividers > borders ovunque**: separazione per linea sottile, non per scatolaggio
- **Fin Orange parsimonioso**: l'accent `#FF5600` ≤ 10% della superficie, riservato a stati/CTA AI
- **Numeri in serif**: i big number nelle KPI usano `.font-heading` (Instrument Serif), mai sans-bold

## 2. Colors: Atelier sotto luce diurna

La palette è restrained: tinted neutrals (off-white warm, charcoal warm) con un solo accent (Fin Orange) usato sotto la soglia del 10%. Il dark mode è un'inversione warm: near-black `#0A0A0A`, mai puro `#000`.

### Primary
- **Charcoal Inchiostro** (`#111111`): il nostro "nero". Usato per testo principale (`text-ink`), bottoni primary, primary fills. Mai pure black per non strappare la pagina.

### Secondary
- **Fin Orange** (`#FF5600` light / `#FF6A1F` dark): accent per stati AI (✨ badge categorizzati), call-to-action speciali, dot di urgenza, microsoft AI sparkle. Usato sotto il 10% della superficie. Nel dark mode leggermente più chiaro (`#FF6A1F`) per non bucare lo schermo.

### Neutral
- **Off-white Carta** (`#FAFAFA`): canvas light. La pagina di base. Riposante come carta da taccuino non sbiancata.
- **Warm Charcoal** (`#0A0A0A`): canvas dark. Mai pure black per ragioni di confort visivo.
- **Bianco Surface** (`#FFFFFF`): superficie card light, dove "si scrive". Si solleva visivamente dall'off-white.
- **Dark Surface** (`#161616`): superficie card dark. Anchor delle card sopra il warm canvas.
- **Grigio Banner** (`#F1F1F1` light / `#1F1F1F` dark): secondary surface per banner, alt rows, card footer (bg-muted/30).
- **Hairline** (`#E5E5E5` light / `rgba(250,250,250,0.12)` dark): bordo divisorio sottile. Usato per `border-b`, `divide-y`, `ring-1` morbidi.

### KPI Roles (financial)
Solo dentro PanoramicaView per i KPI finanziari. Colorati per leggibilità + significato:
- **Verde Foresta** (`oklch(0.30 0.08 155)` light / `oklch(0.80 0.13 155)` dark): Fatturato. Variabili `--kpi-fatturato`.
- **Blu Notte** (`oklch(0.32 0.07 250)` light / `oklch(0.78 0.13 250)` dark): Incassato. Variabili `--kpi-incassato`.
- **Arancio Bruciato** (`oklch(0.55 0.12 55)` light / `oklch(0.78 0.15 55)` dark): Da incassare. Variabili `--kpi-due`.

### Named Rules

**The Fin Orange Discipline.** L'accent occupa al massimo il 10% di una qualunque schermata. Tipica allocazione: dot pulsante sopra il badge ✨ AI, bordo del CTA primary sul Final CTA, urgency dot su un singolo capo in produzione. Mai accent su 4+ elementi nella stessa view.

**The No-Pure-Black Rule.** `#000` è proibito ovunque. Il "nero" del sistema è `#111111` (charcoal), il "near-black" dark mode è `#0A0A0A`. Anche shadow e overlay usano `oklch(0 0 0 / ALPHA)` con alpha basso, non `rgba(0,0,0,1)` solido.

**The Hairline Over Block.** Quando devi separare due aree, prima prova un divider hairline (`border-b border-border` o `divide-y`). Solo se questo fallisce, usa un cambio di background. Mai entrambi sulla stessa transizione.

## 3. Typography

**Display Font:** Instrument Serif (con fallback Georgia, Times New Roman, serif)
**Body Font:** Geist (con fallback system-ui, sans-serif)
**Mono Font:** JetBrains Mono (con fallback ui-monospace, monospace)

**Character:** una coppia editoriale-tecnica. Instrument Serif porta la voce sartoriale (italic eleganza, contrasto modesto, terminali tondi); Geist porta la chiarezza tecnica del prodotto (leggibilità a 14px, tabular nums, peso variable). JetBrains Mono è riservato a ID, telefoni e tabular data nei mockup.

### Hierarchy

- **Display** (Instrument Serif 400, `clamp(2.75rem, 7vw, 6.5rem)`, line-height 0.95, tracking -0.02em): hero landing, title page (`font-heading text-5xl text-ink leading-none` per le H1 di pagina dashboard).
- **Headline** (Instrument Serif 400, 3rem, line-height 1, tracking -0.02em): section h2 landing.
- **Title** (Instrument Serif 400, 1.875rem, line-height 1.05, tracking -0.015em): card titles nelle Use Cases / Features.
- **Number** (Instrument Serif 400, 3rem, tabular-nums): KPI numbers (Abiti, Rilevazioni, Clienti). Pattern fisso: `font-heading text-5xl leading-none tabular-nums text-ink`.
- **Body** (Geist 400, 0.875rem aka `text-sm`, line-height 1.5): UI body di default in dashboard, descrizioni, paragrafi corti.
- **Body Prose** (Geist 400, 0.9375rem aka `text-[15px]`, line-height 1.55): testi più lunghi nella landing (lede, body card).
- **Label** (Geist 600, 0.625rem aka `text-[10px]`, uppercase, tracking 0.15em): TUTTE le piccole label (eyebrow section, table headers, badge text). Pattern fisso: `text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground`.
- **Micro** (Geist 500, 0.6875rem aka `text-[11px]`): time-ago, micro-info inline.
- **Mono** (JetBrains Mono 400, 0.75rem aka `text-xs`): slug, ID, tabular data nei mockup.

### Named Rules

**The Serif-Number Rule.** Ogni numero che è un KPI o un'unità contabile va in `.font-heading` (Instrument Serif) con `tabular-nums`. I numeri sans-bold tipo `text-3xl font-bold` sono proibiti. Pattern canonico: `<p className="font-heading text-5xl leading-none tabular-nums text-ink">{value}</p>`.

**The Italic Accent Rule.** L'italic è riservato a tre situazioni: marker editoriali (`I.` `II.` `III.` sulla landing), accent words dentro un titolo display (es. *gestionale*, *raffinata*), e signature ruoli ("Mario Del Prete · *fondatore*"). Mai italic per enfasi banale nel body copy.

**The Small-Caps Discipline.** Tutte le label piccole usano `tracking-[0.15em]`. Mai 0.08em, 0.10em, 0.12em (deprecati). Mai sentence case per le label: sempre uppercase quando si applica il pattern.

## 4. Elevation

Il sistema è **piatto per default**. La profondità si costruisce con **tonal layering** (canvas → card → surface → secondary) e **hairline borders**, non con drop shadow. Le shadow esistono ma sono rare e funzionali, mai decorative.

### Shadow Vocabulary

- **Hover lift** (`box-shadow: 0 4px 12px oklch(0 0 0 / 0.06)` con `transform: translateY(-1px)`): solo su elementi interactive (`hover-lift` utility class). Mai a riposo.
- **Mockup card landing** (`shadow-[0_30px_80px_-20px_rgb(0,0,0,0.18)]` con `ring-1 ring-foreground/8`): un singolo product showcase nel Mockup section. Restante landing è piatta.
- **Modal/Popover** (`shadow-md` shadcn default): solo per overlay che richiedono separazione dalla pagina (dropdown menu, dialog).
- **Float chip** (`shadow-[0_8px_30px_rgb(0,0,0,0.12)]`): pill flottanti dentro il mockup ("Nuovo messaggio WhatsApp"). Usate con parsimonia, una o due per mockup.

### Named Rules

**The Flat-By-Default Rule.** Le superfici a riposo sono piatte. Le shadow appaiono solo come risposta a stato (hover, drag overlay, popover open). Una card dashboard a riposo NON ha shadow, ha `border-border`. `shadow-card` esistente nel codice → da usare solo dove c'era già; preferire ring + border per nuovi componenti.

**The Tonal Layer Rule.** Per separare due piani, cambia tinta (`bg-card` su `bg-background`) prima di aggiungere shadow. Esempio: card bianca su pagina off-white = separazione percepita senza un solo pixel di shadow.

## 5. Components

### Buttons

- **Shape:** sempre pill (`rounded-full`). L'unica eccezione sono i badge stato `text-[10px]` minuscoli, che restano `rounded-sm` perché 9999px su 18px sembra ovale.
- **Primary:** `bg-primary text-primary-foreground` (charcoal `#111111` con testo bianco). Padding `px-4 py-2` per size default, `px-3.5 py-1.5` nella nav, `px-6 py-3.5` per hero CTA.
- **Secondary / Ghost:** `border border-border bg-card text-foreground hover:bg-secondary`. Stesso pill shape, peso visivo minore.
- **Hover:** `hover:bg-primary/90` per primary, `hover:scale-[1.02]` per CTA hero/final. Transition `transition-colors` o `transition-transform`.
- **Disabled:** `disabled:opacity-50`. Niente colore separato.
- **Scroll-aware nav CTA** (landing): doppio stato inverso. Sopra hero video → `bg-white text-foreground`. Sotto contenuto → `bg-primary text-primary-foreground`. Pattern unico nella landing, transition-colors 300ms.

### Chips & Badges

- **Style:** pill (`rounded-full`) per status content (Consegnato, In lavorazione), square pill (`rounded-sm`) per micro-badge `text-[10px]` (categoria messaggio, role tag).
- **Success (Consegnato/Saldato/Attiva):** `bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-900`. Con dot `bg-emerald-500`.
- **Warning (In lavorazione/Acconto):** `bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-900`. Con loader o dot animato.
- **Destructive:** usato solo su action buttons (`bg-destructive/10 text-destructive`). Mai come fill solido.
- **AI sparkle ✨:** prefisso `<span aria-hidden>✨</span>` davanti al badge categoria quando `ai_processed=true`. Niente colore extra, solo opacity 70.

### Cards / Containers

- **Corner Style:** `rounded-xl` (~17px). Le card della landing usano `rounded-2xl`/`rounded-3xl` (22-26px) per il feel più editoriale. Mai `rounded-lg` o smaller su una "card vera".
- **Background:** `bg-card` (`#FFFFFF` light / `#161616` dark). Mai puro `bg-white`.
- **Shadow Strategy:** nessuna shadow a riposo. Vedi Elevation. Eccezione: mockup landing.
- **Border:** `border border-border` hairline. Mai border colorate side-stripe.
- **Header:** `border-b border-border px-6 pt-5 pb-4` con label small-caps + descrizione opzionale.
- **Footer:** `border-t border-border bg-muted/30 px-6 py-3` con messaggio sx + pill button dx.
- **Internal Padding:** `p-6` per body card, `px-6 py-4` per rows.
- **Pattern canonico:** `<section className="overflow-hidden rounded-xl border border-border bg-card">`.

### Inputs / Fields

- **Style:** `rounded-md border border-border bg-background px-3 py-2.5 text-sm`. Background usa canvas (off-white) dentro card bianca → leggera tinta che fa percepire il campo.
- **Focus:** `focus:outline-none focus:ring-2 focus:ring-ring/30`. Niente border-shift; il ring è sottile, color charcoal/30%.
- **Placeholder:** `placeholder:text-muted-foreground/50`.
- **Disabled:** `disabled:opacity-50`.

### Navigation

- **Landing nav** (scroll-aware): fixed full-width. Sopra hero = transparent + white text + white CTA pill. Sotto contenuto = glass `bg-card/90 backdrop-blur-xl backdrop-saturate-150` + dark text + dark CTA pill. Transition 300ms su tutto.
- **Dashboard sidebar (AppSidebar):** warm brown-black sempre (intenzionalmente non si inverte fra light/dark). `oklch(0.16 0.012 80)` bg, `oklch(0.94 0.006 80)` foreground. Voci nav: `rounded-lg px-3 py-2.5 text-sm font-medium`. Active = bg più chiaro + ink full. Inactive = `text-muted-foreground/55`.
- **Mobile:** sidebar diventa drawer; nav landing mostra Accedi sempre visibile (non più nascosta dietro hamburger).

### KPI Cell

Pattern signature del dashboard / platform admin. Sempre dentro card.

```tsx
<div className="px-6 py-5">
  <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
    Abiti
  </p>
  <p className="font-heading mt-3 text-5xl leading-none tabular-nums text-ink">
    {value}
  </p>
</div>
```

- Label sempre small-caps 0.15em, mai sentence case
- Numero sempre `font-heading` (Instrument Serif), mai sans-bold
- `tabular-nums` obbligatorio per allineamento
- Nessuna trend arrow nei numeri (è una decoration anti-pattern; il valore parla da solo)

### Annotation Chips (landing Mockup section)

Pill flottanti posizionate `absolute` intorno alla mockup card. Reveal staggered da motion (`whileInView` con delay 0.5-0.8s). Solo md+ (nascoste su mobile per evitare clutter):

```tsx
<motion.div
  className="absolute z-10 hidden items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-xs font-medium text-foreground shadow-[0_10px_30px_-8px_rgb(0,0,0,0.15)] md:inline-flex"
>
  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
  <span>Categorizza WhatsApp con AI</span>
</motion.div>
```

### Founder Letter (Final CTA landing)

Pattern signature di chiusura: charcoal banner rounded-3xl, body 3 righe serif scalate (100/85/70 opacity), signature con hairline divider + nome sans + ruolo italic serif, CTA pill bianco. Replaces the generic SaaS "Ready to ship?" banner.

## 6. Do's and Don'ts

### Do:

- **Do** usa `font-heading` (Instrument Serif) per **tutti** i numeri KPI grandi e i titoli display. Pattern fisso: `font-heading text-5xl leading-none tabular-nums text-ink`.
- **Do** usa `tracking-[0.15em]` per TUTTE le label small-caps. Mai 0.08, 0.10, 0.12em.
- **Do** usa `rounded-full` per ogni bottone (primitive `Button` + bottoni raw HTML). I segmented control container vanno pure pill.
- **Do** usa `rounded-xl` per le card. `rounded-2xl` o `rounded-3xl` solo nella landing.
- **Do** usa `rounded-md` per gli input. `rounded-sm` solo per badge minuscoli `text-[10px]`.
- **Do** usa `bg-emerald-50/950 dark:bg-emerald-950/50` pattern per success, `bg-amber-50/950 dark:bg-amber-950/50` per warning. Mai oklch inline.
- **Do** usa `var(--kpi-fatturato/incassato/due)` dentro `style={{}}` per i KPI finanziari di PanoramicaView. Le variabili gestiscono già il dark mode.
- **Do** preferisci hairline divider (`border-b border-border`, `divide-y divide-border`) ai cambi di background per separare aree.
- **Do** usa il marker romano italic (`I.` `II.` `III.`) come spina editoriale sulle section landing. Pattern: `text-2xl italic leading-none text-foreground/30 style={{ fontFamily: 'var(--font-serif)' }}`.
- **Do** lascia respirare il dashboard (px-6 py-4-6) e respira FORTE nella landing (`py-32`, hero a `100svh`).
- **Do** usa `waitUntil` da `@vercel/functions` per qualsiasi lavoro async in API route serverless. Fire-and-forget puro non funziona su Vercel.

### Don't:

- **Don't** usare `#000` né `#fff` (regola sistema). Il nero è `#111111` charcoal; il warm-near-black dark è `#0A0A0A`.
- **Don't** scrivere numeri KPI con `text-3xl font-bold` o classi sans equivalenti. Sempre serif.
- **Don't** mettere `oklch(...)` inline in `style={{ color: ... }}` o `background`. Usa classi Tailwind con `dark:` variants. (Eccezione: var() ai KPI tokens.)
- **Don't** usare side-stripe borders (`border-l-4 border-accent`) come accento. Vietato dal sistema (regola impeccable).
- **Don't** usare gradient text (`bg-clip-text` con gradient bg). Vietato.
- **Don't** usare em dashes (`—` `--`). Usa virgola, due punti, punto e virgola, parentesi.
- **Don't** usare glassmorphism come decorazione default. Glass è permesso solo nella nav scroll-aware della landing, dove serve funzionalmente.
- **Don't** creare dashboard SaaS generiche con metriche enormi + gradient accent + card identiche a griglia (anti-reference esplicito in PRODUCT.md).
- **Don't** ricreare "form grigiastre, bordi ovunque, nessuna gerarchia" stile gestionale anni 2000 (anti-reference esplicito in PRODUCT.md).
- **Don't** usare display fonts in UI labels, button text, data values del dashboard (regola product register: editorial serif → solo per page H1 e KPI numbers).
- **Don't** wrap ogni cosa in una card. Tante volte non serve nemmeno la card: usa hairline divider o solo spaziatura.
- **Don't** usare `rounded-lg` o `rounded-md` sul container di una card "vera" del prodotto. La card è `rounded-xl`. Solo i tooltip Recharts restano lg per dimensione contenuta.
- **Don't** mettere icone decorative nelle marketing landing section (Steps, Use Cases, Features). Niente lucide icons sopra i titoli serif. Solo affordance funzionali (CTA arrow, FAQ toggle, footer mailto).
- **Don't** usare il template "hero metric" (big number + small label + supporting stats + gradient accent + sparkles). Vietato dal sistema (regola impeccable). I nostri KPI sono compositi tipografici, non template SaaS.
