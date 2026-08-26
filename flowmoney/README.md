# Flowmoney

Tracker personale delle spese (settimana / mese / anno) con login WebAuthn (passkey).

## Stack

- Frontend: React + Vite + Tailwind
- Backend: Express (locale e su Vercel)
- DB: Supabase Postgres (solo `service_role` dal backend)

## Setup locale

1. Copia `.env.example` in `.env` e compila i secret.
2. Applica le migration in `supabase/migrations/` sul progetto Supabase (già applicate sul DB collegato).
3. In due terminali:

```bash
npm run server
npm run dev
```

Frontend: `http://localhost:5173` · API: `http://localhost:3000`

## Variabili d'ambiente

| Variabile | Ruolo |
|-----------|--------|
| `SETUP_SECRET` | Serve per registrare nuovi dispositivi |
| `SESSION_SECRET` | Firma cookie di sessione e challenge |
| `FRONTEND_ORIGIN` | Origin CORS / cookie |
| `WEBAUTHN_RP_*` | Relying Party WebAuthn |
| `SUPABASE_URL` | URL progetto |
| `SUPABASE_SERVICE_ROLE_KEY` | Chiave service role (**mai** nel frontend) |
| `DEV_BYPASS_AUTH` / `VITE_DEV_BYPASS_AUTH` | Solo locale: salta WebAuthn |

In production: `NODE_ENV=production`, bypass **disattivato**, `SESSION_SECRET` distinto da `SETUP_SECRET`, RP/origin allineati al dominio reale.

## Sicurezza (modello)

- Il browser non parla con Supabase: solo cookie di sessione verso l’API.
- Tabelle con RLS attivo e **nessuna policy** + `REVOKE` su `anon`/`authenticated`: deny-by-default sulla Data API.
- Challenge WebAuthn e sessione firmati con HMAC.
- Rate limit su login/registrazione.
- Non puoi rimuovere l’ultimo dispositivo registrato.

## Funzionalità

- Aggiungi / modifica / elimina spese
- Totali e grafici per periodo
- Alert settimanale
- Gestione dispositivi (passkey) in Impostazioni
