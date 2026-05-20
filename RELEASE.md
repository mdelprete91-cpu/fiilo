# Release Playbook — filo

Procedura pragmatica di rilascio per un team da una persona. Da usare come
checklist a ogni cambiamento che va in produzione su `fiilo.it`.

> Stack: Next.js 16 + Supabase + Vercel. Codice su GitHub, deploy automatico
> Vercel su `main`, anteprime preview su ogni PR.

---

## 1. Branch workflow

- `main` è la produzione. Non committi mai direttamente.
- Tutto passa da un **feature branch**.

Convenzioni di naming (case in kebab-case):

| Tipo            | Prefisso     | Esempio                              |
| --------------- | ------------ | ------------------------------------ |
| Nuova feature   | `feature/`   | `feature/whatsapp-reminders`         |
| Bug fix         | `fix/`       | `fix/login-redirect-loop`            |
| Refactor / chore| `chore/`     | `chore/upgrade-supabase-ssr`         |
| Migration DB    | `db/`        | `db/025-add-orders-status-column`    |

```bash
git checkout main
git pull
git checkout -b feature/nome-corto-descrittivo
# ... lavora, commit piccoli e leggibili ...
git push -u origin feature/nome-corto-descrittivo
```

---

## 2. Procedura PR

1. Apri PR su GitHub verso `main`.
2. Aspetta il check **CI** verde (`Typecheck, lint, build`). Se rosso → fix
   prima di chiedere review/merge.
3. Aspetta che Vercel pubblichi la **Preview**. Apri l'URL `*.vercel.app` dal
   commento del bot Vercel.
4. Testa la preview almeno sui **5 flussi golden** (vedi sezione 6).
5. **Merge** (Squash and merge consigliato per mantenere lineare `main`).
6. Cancella il branch remoto subito dopo il merge.

---

## 3. Procedura migration DB

> Le migration vivono in `supabase/migrations/NNN_nome.sql`. Numerazione
> progressiva a 3 cifre, mai riusare un numero.

### Numerazione

Ultimo numero in uso: `024_newsletter_templates.sql` → prossimo `025_*.sql`.

### Backward compatibility (expand / contract)

Una migration NON deve mai rompere la versione precedente del codice già in
prod. Mario fa deploy del DB **prima** del deploy del codice; per quei pochi
secondi il vecchio codice deve continuare a funzionare.

| Operazione               | Sicuro?                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| `ADD COLUMN ... NULL`    | Sì in singolo step.                                                           |
| `ADD COLUMN ... NOT NULL`| Solo se aggiungi DEFAULT. Altrimenti: step 1 nullable + backfill, step 2 NOT NULL. |
| `DROP COLUMN`            | 2 step: (1) deploy codice che non la legge più; (2) migration che la droppa. |
| Rename column            | 2 step: (1) `ADD COLUMN nuova` + dual-write nel codice + backfill; (2) deploy codice che usa solo `nuova`; (3) migration drop colonna vecchia. |
| Add index                | Sicuro, ma in tabelle grandi usa `CREATE INDEX CONCURRENTLY`.                 |
| Cambio tipo colonna      | 2 step: nuova colonna + cast + drop vecchia.                                  |

### Workflow operativo

1. Scrivi `supabase/migrations/025_nome.sql` nel feature branch.
2. **Prima del merge**: apri Supabase → SQL Editor → incolla il contenuto del
   `.sql` → esegui sul progetto prod (`qzalumxqwwywbvddkyzx`).
3. Se la migration cambia lo schema visibile a TypeScript: rigenera i tipi:

   ```bash
   npx supabase gen types typescript --project-id qzalumxqwwywbvddkyzx > src/types/database.ts
   ```

   Committa `src/types/database.ts` aggiornato nel PR.
4. Verifica `npx tsc --noEmit` locale.
5. Procedi col merge.

Se la migration **rompe** qualcosa: vedi sezione 8 (Rollback DB).

---

## 4. Deploy in produzione

- Merge su `main` → Vercel deploya automaticamente.
- Aspetta che il deploy passi a stato **Ready** sulla dashboard Vercel.
- Aspetta che la URL `https://fiilo.it` serva il nuovo build (force-refresh
  con `Cmd+Shift+R`).

Se il build fallisce su Vercel: il rollback è automatico, l'ultimo deploy
Ready resta attivo. Apri i log, sistema, riprova.

---

## 5. Skew Protection

**Da attivare una sola volta** dalla dashboard Vercel:

> Project → Settings → Functions → **Skew Protection** → ON.

Cosa fa: durante un deploy, i client già caricati continuano a chiamare la
loro versione delle Server Actions/API per ~24h, anche dopo che il nuovo
deploy è in produzione. Evita errori "function not found" durante il rolling.

---

## 6. Post-deploy checklist

Dopo ogni merge su `main` che tocca codice non banale:

### 5 flussi golden (testare in ordine)

1. **Login**: apri `https://fiilo.it` in incognito, fai login.
2. **Lista clienti**: vai a `/clienti`, la lista deve caricare in <2s e
   mostrare almeno il cliente di test.
3. **Crea cliente**: clicca "+ Nuovo cliente", compila i campi minimi, salva,
   verifica che appaia in lista.
4. **Configura abito**: apri un cliente esistente → "Nuova commessa" /
   configuratore, vai fino alla conferma, verifica che si salvi.
5. **Scheda cliente**: torna al cliente, controlla che misure, ordini e
   storico WhatsApp siano visibili.
6. **Settings**: vai a `/settings`, prova a cambiare un dato del profilo
   sartoria e salvare.

### Monitoring

- **Sentry**: apri dashboard Sentry, tienila aperta per 30 minuti. Watch per
  spike di errori nuovi (≠ rumore preesistente).
- **Vercel Logs**: `Project → Logs → Runtime` per i primi 10 minuti.
- **Supabase Logs**: solo se ci sono errori 500 sospetti (Database / API
  logs).

### CHANGELOG

Aggiungi una riga in `CHANGELOG.md` sotto `[Unreleased]` con cosa è cambiato.
Esempio:

```md
### Aggiunto
- Reminder WhatsApp automatici 3 giorni prima della prova.

### Fixato
- Loop redirect su /login per platform_owner.
```

Quando fai il "bump" della versione, rinomina la sezione in `[0.1.x] — YYYY-MM-DD`.

---

## 7. Rollback codice

Vercel salva ogni deploy. In caso di regressione:

1. Vercel → Project → **Deployments**.
2. Trova l'ultimo deploy **Ready** noto-buono (riga sopra al rotto).
3. Tre puntini → **Promote to Production**.
4. Il dominio `fiilo.it` torna su quella versione in <30s.

Poi, sul branch:

```bash
git checkout main
git pull
git revert <hash-commit-rotto>
git push
```

Questo crea un nuovo commit "revert" che, al merge, riallinea il codice al
deploy promosso.

---

## 8. Rollback DB

Supabase fa backup giornalieri automatici (Project → Database → **Backups**).

### Scenario A — migration ha solo aggiunto (es. `ADD COLUMN`)

Niente rollback. Lascia la colonna lì, è innocua. Sistema il codice.

### Scenario B — migration ha cambiato/cancellato dati

1. Supabase → Database → Backups → scegli il backup pre-migration → **Restore**.
2. ⚠️ Il restore crea un nuovo progetto Supabase. Devi:
   - aggiornare le env vars Vercel sul nuovo project ref, **oppure**
3. Per restore in-place (più rischioso): scarica il backup `.sql.gz` e:

   ```bash
   gunzip -c backup.sql.gz | psql "$DATABASE_URL_PROD"
   ```

Tieni a portata di mano l'URL del backup più recente prima di applicare
migration distruttive.

---

## 9. Maintenance mode

Quando devi fare un'operazione invasiva (restore DB, migration lunga, fix
manuale dati): metti la sartoria in manutenzione.

### Attivare

1. Vercel → Project → **Settings → Environment Variables**.
2. Aggiungi o aggiorna `NEXT_PUBLIC_MAINTENANCE_MODE=1` (Production).
3. Vercel → **Deployments → Redeploy** dell'ultimo deploy (senza cache).
4. Verifica `https://fiilo.it`: deve apparire la pagina "Stiamo migliorando
   filo". Status HTTP deve essere `503` (controlla in Devtools → Network).
5. I webhook `/api/webhooks/*` continuano a rispondere normalmente — questo è
   importante perché Meta WhatsApp ha retry policy aggressive.

### Disattivare

1. Vercel → Env Variables → cambia `NEXT_PUBLIC_MAINTENANCE_MODE` a `0` o
   rimuovi la variabile.
2. Redeploy.
3. Verifica che `fiilo.it` torni alla landing/dashboard normale.

---

## 10. Status banner

Per messaggi temporanei in cima alla dashboard ("Appena aggiornato a v0.2",
"Lavori in corso su WhatsApp dalle 14 alle 16", "Manutenzione programmata
domenica mattina"):

1. Vercel → Settings → Env Variables.
2. `NEXT_PUBLIC_STATUS_MESSAGE` = testo da mostrare (max ~120 char).
3. `NEXT_PUBLIC_STATUS_LEVEL` = `info` | `warning` | `success` (default `info`).
4. Redeploy.
5. Per rimuoverlo: svuota il valore e redeploy.

Note:
- Il banner appare solo nelle pagine dashboard.
- Ogni utente può chiuderlo (X) — la chiusura vale per la sessione corrente.
- Cambiare il testo del messaggio genera un nuovo banner (la dismissione
  precedente non si applica al testo nuovo).

---

## 11. Branch protection consigliata (GitHub)

Da attivare una volta sola:

> Repo → **Settings → Branches → Add rule → Branch name pattern: `main`**.

Spunta almeno:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass before merging
  - Aggiungi il check `Typecheck, lint, build` (il job di `ci.yml`)
- ✅ Require branches to be up to date before merging
- ✅ Do not allow bypassing the above settings

---

## 12. Quick reference

| Cosa                      | Dove                                                   |
| ------------------------- | ------------------------------------------------------ |
| Deploy logs               | Vercel → Deployments → Logs                            |
| Runtime logs              | Vercel → Logs                                          |
| Sentry                    | https://sentry.io → progetto `filo`                    |
| Backup DB                 | Supabase → Database → Backups                          |
| SQL editor                | Supabase → SQL Editor                                  |
| Env vars                  | Vercel → Settings → Environment Variables              |
| Maintenance toggle        | Env var `NEXT_PUBLIC_MAINTENANCE_MODE`                 |
| Status banner             | Env vars `NEXT_PUBLIC_STATUS_MESSAGE` + `_STATUS_LEVEL`|
| Skew Protection           | Vercel → Settings → Functions                          |
| Branch protection         | GitHub → Settings → Branches                           |
