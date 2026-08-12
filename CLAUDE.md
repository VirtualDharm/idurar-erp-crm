# CLAUDE.md — IDURAR ERP/CRM — Project Knowledge Base

Read this first. It records everything a previous Claude session did to run this
project locally and deploy it live. Continue from "Pending / Next steps".

## What this is

Open-source ERP/CRM (fork of idurar/idurar-erp-crm v4.1.0), MERN stack:
- `backend/` — Express + Mongoose (Node 20), port 8888. Routes are auto-generated:
  every model in `backend/src/models/appModels/` gets full CRUD API at
  `/api/<modelname-lowercase>/*` via `createCRUDController` unless a custom
  controller dir exists in `src/controllers/appControllers/`.
- `frontend/` — React 18 + Vite + Ant Design, dev port 3000. Redux CRUD panels.

## Repo quirk — trimmed upstream (IMPORTANT)

This copy of the repo is TRIMMED vs upstream. The git history itself lacks files
upstream has. Symptoms already fixed:

1. `npm run setup` crashed — missing models. FIXED: created
   `backend/src/models/appModels/PaymentMode.js` and `Taxes.js` (upstream schema).
2. Frontend crashed blank with `ReferenceError: Quote is not defined` —
   `routes.jsx` referenced pages that don't exist. FIXED:
   - Removed 4 `/quote*` routes from `frontend/src/router/routes.jsx` and the
     quote menu item from `frontend/src/apps/Navigation/NavigationContainer.jsx`.
   - Rebuilt `frontend/src/pages/PaymentMode/index.jsx` and
     `frontend/src/pages/Taxes/index.jsx` as thin wrappers over existing
     `CrudModule` + `forms/PaymentModeForm.jsx` / `forms/TaxForm.jsx`, with lazy
     imports added in `routes.jsx`.
3. Quote feature: frontend `modules/QuoteModule/` exists but pages + backend
   model/controller are gone. To restore Quote fully you must recreate
   `backend/src/models/appModels/Quote.js` + custom `quoteController`
   (convert/mail endpoints) + `frontend/src/pages/Quote/*`.

## Database — MongoDB Atlas

- URI (also in `backend/.env` locally and on the server):
  `mongodb+srv://personal:Zlg30dbchOvEwICyezvYIOxAwUls@personal.pujzfsc.mongodb.net/solarprimary?retryWrites=true&w=majority&appName=personal`
- Database name: `solarprimary`. Seeded via `npm run setup` (Admin, Settings,
  Taxes "Tax 0%", PaymentMode "Default Payment").
- Login: `admin@admin.com` / `admin123`.
- Atlas CLI at `~/bin/atlas` (account mdharm4air.fm@gmail.com; session expires,
  re-auth with `~/bin/atlas auth login`). Atlas allows connections from the OCI
  server already (verified working).
- A local mongod 7.0.14 also exists at `~/mongodb-local/` (was used before
  Atlas; currently unused). Start:
  `~/mongodb-local/mongodb-macos-x86_64-7.0.14/bin/mongod --dbpath ~/mongodb-local/data --logpath ~/mongodb-local/logs/mongod.log --fork`

## Local dev

```bash
cd backend  && npm install && npm run dev   # port 8888
cd frontend && npm install && npm run dev   # port 3000
```
`backend/.env` currently points at Atlas `solarprimary`.

## Production deployment (DONE except DNS)

Target: **http://urjacrm.scalepartner.store** — frontend Vercel, backend OCI.

### Backend — OCI VM
- SSH: `ssh -i ~/.ssh/personal_oci ubuntu@140.245.221.31` (Ubuntu 24.04,
  passwordless sudo, host named `personal`).
- Code at `/home/ubuntu/urjacrm-backend/` (rsynced, prod `.env` created there
  with Atlas URI, fresh random JWT_SECRET, NODE_ENV=production,
  PUBLIC_SERVER_FILE=https://api.urjacrm.scalepartner.store/).
- Runs under pm2: process `urjacrm-api`, Node 20 (system, NodeSource),
  `pm2 save` done, systemd `pm2-ubuntu` enabled (survives reboot).
- Reverse proxy: **Caddy** (NOT nginx — nginx is installed but disabled; Caddy
  already owned ports 80/443 serving pre-existing `api.scalepartner.store` →
  localhost:8000, do not break it). `/etc/caddy/Caddyfile` has appended block:
  `api.urjacrm.scalepartner.store { reverse_proxy localhost:8888 }`.
  Caddy auto-issues TLS once DNS resolves.
- iptables already accepts 80/443. Verified: `curl -X POST
  http://localhost:8888/api/login` on the server returns success against Atlas.
- To redeploy backend:
  `rsync -az --delete -e "ssh -i ~/.ssh/personal_oci" --exclude node_modules --exclude .env backend/ ubuntu@140.245.221.31:/home/ubuntu/urjacrm-backend/`
  then `ssh ... 'cd urjacrm-backend && npm install --omit=dev && pm2 restart urjacrm-api'`

### Frontend — Vercel
- CLI logged in as `virtualdharm` (team virtualdharms-projects).
- Project `urjacrm`, linked from `frontend/` (`.vercel/` dir present).
- Production env vars set: `VITE_BACKEND_SERVER=https://api.urjacrm.scalepartner.store/`
  and `VITE_FILE_BASE_URL` same value.
- `frontend/vercel.json` added: SPA rewrite all → /index.html.
- Deployed: https://urjacrm-ga8zct9xk-virtualdharms-projects.vercel.app (Ready).
- Custom domain `urjacrm.scalepartner.store` attached, awaiting DNS.
- Redeploy: `cd frontend && vercel deploy --prod --yes`.

### Pending / Next steps (THE ONLY BLOCKER)
DNS at Namecheap (scalepartner.store uses dns1/dns2.registrar-servers.com):

| Type | Host | Value |
|------|------|-------|
| A | `urjacrm` | `76.76.21.21` |
| A | `api.urjacrm` | `140.245.221.31` |

User must add these (no Namecheap API access in session). After propagation:
1. `vercel domains verify urjacrm.scalepartner.store` (or it auto-verifies).
2. Check `https://api.urjacrm.scalepartner.store/api/` returns 401 (Caddy cert OK).
3. Open site, login, verify Taxes + Payment Mode pages list seeded rows.

## Security notes
- Atlas password is in this file and `.env`s — user was warned to rotate.
- Local dev `JWT_SECRET` in `backend/.env` is a placeholder; prod one on server
  is random (in `/home/ubuntu/urjacrm-backend/.env` only).
