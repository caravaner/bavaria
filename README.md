# Bavaria

An npm-workspaces monorepo for the Bavaria career-restart site.

## Layout

```
apps/
  web/      Public marketing + booking site (Next.js). Holds NO database access.
  admin/    Admin dashboard + the API that owns the database (Next.js).
packages/
  db/       Prisma schema, generated client, data-access repos, seed (shared by admin only).
scripts/
  with-env.mjs   Loads the repo-root .env.local/.env, then runs a command.
```

### Data flow

The **web** app never touches Postgres. It reads services and drives the
booking/payment flow over HTTP from the **admin** app:

- `GET /api/services`, `GET /api/services/[slug]` — public, read-only.
- `POST /api/orders`, `GET /api/orders/[id]`, `POST /api/orders/[id]/capture` —
  internal; gated by the shared `API_INTERNAL_SECRET` the web server sends.
- `POST /api/paypal/webhook` — PayPal calls the admin app directly.

The PayPal Smart Buttons in the browser post to the web app's same-origin
`/api/paypal/capture-order`, which forwards to the admin API server-to-server.
So the browser stays same-origin and the web app holds no DB credentials.

### Admin auth

No auth library. Passwords are scrypt hashes (`packages/db/src/password.js`);
sessions are stateless HMAC-signed cookies (`apps/admin/lib/session.ts`). There
is no public sign-up — the first account is created by the seed. Signed-in
admins can change their own password under **Account** (email-based reset waits
for the mailing service).

## Setup

```bash
npm install
cp .env.example .env.local   # then fill in values
npm run db:generate          # generate the Prisma client
npm run db:migrate           # apply migrations (dev: prisma migrate dev)
npm run db:seed              # create the superuser admin + import services
```

The seed creates an admin user (default `superuser` / `password` — override with
`SEED_ADMIN_USERNAME` / `SEED_ADMIN_PASSWORD`) and imports the initial services.

## Develop

```bash
npm run dev:web      # public site  → http://localhost:3000
npm run dev:admin    # admin + API  → http://localhost:3001
```

Run both (in separate terminals) so the web app can reach the admin API.

## Build

```bash
npm run build        # db generate + migrate deploy, then build admin + web
```

## Deployment

Deploy `apps/admin` and `apps/web` as two separate apps. Point the admin app at
its own subdomain (e.g. `admin.yoursite.com`) and set the web app's
`ADMIN_API_URL` to that origin. Register the PayPal webhook against
`https://admin.yoursite.com/api/paypal/webhook`.

## Notes

This repo uses Next.js 16 with breaking changes from older versions (e.g.
middleware is now `proxy.ts`). See `AGENTS.md` and `node_modules/next/dist/docs/`
before changing framework-level code.
