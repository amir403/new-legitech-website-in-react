# LegiTech.io — React + Laravel rebuild

Goal: the same site, with the same content and the same look (the design in `legacy-static/`), rebuilt as a React SPA (shadcn/ui) backed by a Laravel JSON API, with a React + shadcn admin panel to manage content and enquiries.

## Layout

```
legitech-new/
  legacy-static/   old static site, kept as the design + content reference
  frontend/        Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + react-router
  backend/         Laravel + MySQL (XAMPP), session-auth admin API
```

## Decisions

- **Admin: React + shadcn at `/admin`, in the same app (lazy-loaded).** Laravel session login, with no Filament and no Sanctum.
- **Design fidelity: the original `style.css` is reused, scoped under `.site`**, and the JSX reproduces the original markup. shadcn supplies the interactive parts (Button, Accordion, Select, Input, Textarea, Label).
- **Public API is read-only except `POST /api/enquiries`**, so it needs no API tokens. The enquiry endpoint is validated and rate limited.
- **Content in MySQL, seeded from the legacy pages**, so the first run shows exactly today's content.
- **Work-page mockup visuals stay as React components**, picked by the concept's `slug`. They are bespoke markup, not content.
- **Contact form now really sends.** It saves to the DB and emails the team. Copy/download of the brief stays as a bonus. Privacy page copy must be updated to match.

## Data model

| Table | Fields |
|---|---|
| services | slug, number, name, hero_title, intro, heading, body, features (json), deliverables (json), related_slugs (json), sort_order, is_published |
| insights | slug, category, read_minutes, title, intro, sections (json: heading, body), published_at |
| work_concepts | slug, tags, title, summary, opportunity, includes (json), sort_order |
| industries | slug, name, summary, sort_order |
| enquiries | name, email, company, service, budget, timeline, idea, status (new/contacted/closed), timestamps |
| users | admin logins (`php artisan admin:create`) |

## API

```
GET  /api/services            GET /api/services/{slug}
GET  /api/insights            GET /api/insights/{slug}
GET  /api/work-concepts
GET  /api/industries
POST /api/enquiries           throttle 5/min per IP, returns 201

# admin (session + CSRF; auth required except me/login)
GET  /api/admin/me            POST /api/admin/login (throttle 5/min)   POST /api/admin/logout
GET|POST /api/admin/{type}    GET|PUT|DELETE /api/admin/{type}/{id}   type = services|insights|work-concepts|industries
GET  /api/admin/enquiries     PATCH|DELETE /api/admin/enquiries/{id}  (status only)
```

## Phases

1. **Scaffold** (done) — move static site to `legacy-static/`, create `frontend/` (Vite, Tailwind, shadcn init + base components) and `backend/` (Laravel, MySQL `legitech` DB).
2. **Backend API** (done) — migrations, models, JSON resources, controllers, routes, enquiry validation + throttle + mail notification. Seeders from legacy content. Feature tests for each endpoint, especially enquiry validation and throttling.
3. **Admin** — the admin:create command, admin API with tests, and React + shadcn admin pages (login, enquiries, CRUD for the four content types). Done.
4. **Frontend shell** (done) — the original stylesheet scoped as `site.css`, header with mobile menu, theme toggle, CTA band, footer, routes, and legacy `.html` redirects.
5. **Frontend pages** (done) — every page, compared pixel by pixel with the original at 1440, 860 and 390px in both themes.
6. **Contact form** (done) — shadcn Input/Select/Textarea, client validation matching server rules, POST to API, status line, show server 422 errors on fields, keep copy/download brief.
7. **SEO + polish** — per-route `<title>`/meta description, 404 page, keep the old `*.html` URLs working through redirects to the new routes, accessibility pass (skip link, focus, ARIA), 1180/900/680px breakpoints.
8. **Deploy** — `npm run build` output served by Apache with an SPA fallback `.htaccess`; Laravel `public/` serving `/api` (the React app serves `/admin`); production `.env`, mail driver, `php artisan optimize`.

9. **Pricing + checkout** — pricing page with DB-driven packages, add-ons and bundles (done); admin screens and Stripe/Klarna checkout later. See `PRICING-CHECKOUT-PLAN.md`.

## Dev commands

```
cd backend  && php artisan serve          # http://127.0.0.1:8000  (API)
cd frontend && npm run dev                # http://localhost:5173  (site + /admin; /api proxied to :8000)
cd backend  && php artisan test
cd frontend && npm run build
```

## Open questions

- Which email address should receive enquiries, and which mail provider in production (SMTP, Postmark, ...)?
- Hosting target: same Apache server for both, or separate (for example Vercel for the frontend and a VPS for Laravel)?
