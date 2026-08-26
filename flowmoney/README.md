# Flowmoney

Demo portfolio di un tracker personale delle spese (settimana / mese / anno).

Nato come **progetto personale** per gestire le proprie uscite; questa versione è adattata per il portfolio: **solo frontend**, senza backend né database. Spese e impostazioni restano nel browser via `localStorage`.

## Versione originale (autenticazione)

Nell’app personale l’accesso era protetto con **WebAuthn (passkey)**:

1. **Registrazione dispositivo** — con un setup secret lato server si registrava una passkey sul browser/dispositivo (API SimpleWebAuthn).
2. **Login** — challenge firmato dal backend → asserzione WebAuthn sul dispositivo → verifica server-side → cookie di sessione HMAC.
3. **API** — Express esponeva `/api/auth`, `/api/expenses`, `/api/settings`; il frontend non parlava mai direttamente col database.
4. **Persistenza** — Postgres su Supabase, raggiunto solo dal backend con `service_role` (RLS deny-by-default sulla Data API).
5. **Dispositivi** — in Impostazioni si potevano elencare e revocare le passkey (senza rimuovere l’ultimo dispositivo).

In production: bypass di sviluppo disattivato, secret di sessione distinti, Relying Party WebAuthn allineato al dominio reale.

Questa demo **non** include login, backend né Supabase: serve a mostrare UX e logica del tracker senza infrastruttura.

## Stack (demo)

- React 19 + Vite
- Tailwind CSS 4
- Motion (animazioni menu)
- React Charts (grafici)
- Persistenza: `localStorage`

## Funzionalità

- Totali e riepilogo spese per periodo (settimana / mese / anno)
- Aggiungi, modifica ed elimina spese
- Grafici di dettaglio e storico
- Alert settimanale configurabile
- Dati di esempio al primo avvio e ripristino da Impostazioni

## Setup

Dalla cartella `flowmoney/`:

```bash
npm install
npm run dev
```

Apri `http://localhost:5173`.

Build di produzione:

```bash
npm run build
npm run preview
```

## Deploy

App statica: build → cartella `dist`. Su Vercel i rewrite SPA sono già in `vercel.json` (root del repo e cartella app).

Non servono variabili d’ambiente.

## Note demo

- Nessun login: chiunque può usare l’app nel proprio browser
- I dati non vengono sincronizzati tra dispositivi
- In Impostazioni → **Ripristina dati demo** si tornano ai dati di esempio
