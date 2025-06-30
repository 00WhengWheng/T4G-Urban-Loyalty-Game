# T4G Platform - Social Gamification Monorepo

T4G è una piattaforma di social gamification urbana dove gli utenti vincono premi reali (drink, sconti, cibo) partecipando a sfide nei locali fisici e online. 

## 🧱 Architettura

La piattaforma è composta da un **monorepo modulare** basato su **Turborepo** e `pnpm`, con separazione dei carichi di lavoro su più backend e frontend indipendenti.

### 📦 Repository Structure

```
/ (root)
├── apps/
│   ├── frontend-users/       # React + Vite: utenti, giochi, mappa, sfide
│   ├── frontend-tenant/      # Grafana dashboard embed per i commercianti
│   ├── frontend-mobile/      # React Native app (expo)
│   ├── backend-user/         # NestJS: utenti, badge, sfide, giochi
│   ├── backend-merchant/     # NestJS: gestione sfide, premi, vincitori
│   ├── backend-admin/        # NestJS: gestione admin, merchant, logs
├── packages/                 # Shared libs, types, utils
├── docker-compose.yml
├── .github/workflows/
└── README.md
```

## 🔧 Tecnologie Principali

### Backend (NestJS modulari)
- **@nestjs/schedule**: gestione cron job (sfide, premi, leaderboard)
- **JWT + OAuth2**: autenticazione utenti e merchant (Google/Facebook)
- **PostgreSQL (Neon)**: database con **Row-Level Security** abilitata
- **Redis (Upstash)**: caching, leaderboard in-memory, job queue
- **PostHog**: analytics e eventi custom user/merchant
- **Sentry**: monitoraggio e tracing errori

### Frontend
- `frontend-users`: React + Vite + Framer Motion + OpenLayers/Three.js + Phaser.js
- `frontend-tenant`: React + Grafana embedded dashboard
- `frontend-mobile`: React Native (Expo) con supporto NFC/QR su Android

### Common Tools
- **Turborepo**: workspace monorepo
- **pnpm**: package manager veloce e scalabile
- **Docker Compose**: sviluppo locale containerizzato
- **GitHub Actions**: CI/CD per build, test e deploy automatici
- **Cloudflare CDN/Pages**: hosting giochi, asset, immagini badge

## ⚙️ Deploy & CI/CD

### GitHub Actions Workflow
- CI lint + test su PR
- Build Docker per ogni backend
- Deploy automatico:
  - **frontend-users**: Vercel
  - **frontend-tenant**: Vercel
  - **frontend-mobile**: Expo EAS
  - **backend-user**: Fly.io o Railway
  - **backend-merchant**: Railway
  - **backend-admin**: Fly.io

### Infrastruttura Esterna
| Servizio        | Provider         |
|----------------|------------------|
| CDN giochi      | Cloudflare Pages |
| PostgreSQL      | Neon DB          |
| Redis           | Upstash          |
| Analytics       | PostHog Cloud    |
| Logging/Error   | Sentry           |
| Dashboard dati  | Grafana Cloud    |

## 🧩 Funzionalità Core

- **Tag NFC/QR** in locale (via Web NFC / scan QR code)
- **Giochi** semplici (quiz, reaction, puzzle) integrati via Phaser.js
- **Sfide** pubbliche dei locali con badge e leaderboard
- **Premi reali** con validazione e gestione vincitori
- **Leaderboard** globale, per utente e per sfida
- **Mappa interattiva** con challenge attivi (OpenLayers + 3D layer)
- **Social Sharing** & badge progress

## 🛠️ Dev & Run

```bash
pnpm install -r
pnpm dev        # Avvia frontend + backend in modalità sviluppo
pnpm build -r   # Builda tutto in produzione
pnpm lint -r    # Lint dell’intero monorepo
```

### Docker Local
```bash
docker-compose up --build
```

## ✅ Best Practices
- Multi-backend per diversificazione carichi e contesto logico
- DB con RLS per sicurezza tenant
- Code splitting e shared packages in `packages/`
- CI/CD modulare per deploy selettivi
- Redis e PostgreSQL gestiti via cloud (zero-ops)

## 📍 Note Finali
> La piattaforma è progettata per **scalabilità orizzontale**, alta disponibilità e facilità di manutenzione in ambienti multi-tenant.

---

Per richieste, apri un issue o contatta il team T4G.
