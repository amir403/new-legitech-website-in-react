# Project guidance

## Structure and stack

The LegiTech.io marketing website is being rebuilt from a static site into a React SPA with a Laravel API. See `WORKPLAN.md` for phases and status.

- `frontend/`: Vite, React 19, TypeScript, Tailwind v4, shadcn/ui (radix-nova), react-router (data mode: loaders plus `errorElement`).
  - `src/router.tsx` lists every route, including redirects from the old `*.html` URLs.
  - `src/pages/*` holds one file per route. A page that fetches data exports `loader` plus a default component.
  - `src/components/ui/*` is shadcn-generated. Add components with `npx shadcn@latest add <name>` and avoid hand-editing them.
  - Public pages reproduce the markup and class names of `legacy-static/*.html`. Their look comes from `src/styles/site.css`, the original stylesheet scoped under `.site` and left unlayered so it wins over shadcn utilities. A "shadcn adapters" block at its end styles the shadcn components used there. `components/blocks.tsx` has the shared content grids.
  - `src/admin/*` is the admin (lazy-loaded at `/admin`). It uses plain shadcn styling. Its field definitions in `content-types.ts` must match the rules in `backend/app/Http/Controllers/Admin/ContentController.php`.
  - `src/lib/api.ts` has the API types and fetch helpers. Keep the types in step with `backend/app/Http/Controllers/Api/*`.
  - shadcn theme tokens live in `src/index.css` (`:root` is light, `.dark` is dark). In `site.css`, lime text uses `--lime-text`, which is olive in light mode for contrast.
- `backend/`: Laravel 13 with MySQL (`legitech` database on XAMPP MariaDB). No admin package: the admin is part of the React app.
  - The public JSON API is in `routes/api.php`. It is read-only, except the throttled `POST /api/enquiries`.
  - The admin API is in `routes/admin.php`, under `/api/admin` with `web` middleware (session cookie + CSRF via the `XSRF-TOKEN` cookie). There are no tokens and no Sanctum; it relies on the SPA and API sharing an origin.
  - Create an admin login with `php artisan admin:create <email> <name>`.
  - Pricing (`/api/pricing*`, `/api/admin/pricing/*`) uses API Resources and Form Requests, unlike the content endpoints. `GET /api/pricing` is cached; pricing models flush it on save/delete via `FlushesPricingCache`. Only `is_active` rows are public. See `PRICING-CHECKOUT-PLAN.md`.
  - Only published content is returned. Each model has a `published` scope; always use it in public endpoints.
  - Seed content lives in `database/seeders/content.json`. It was extracted from `legacy-static/`. The seeder never overwrites admin edits.
- `legacy-static/`: the original static site. It is a read-only reference for design and copy; do not edit it.

## Local development

```
cd backend  && php artisan serve          # http://127.0.0.1:8000  (API)
cd frontend && npm run dev                # http://localhost:5173  (site + /admin; proxies /api to :8000)
```

The PHP CLI is `C:\php-8.3.35`, not XAMPP's PHP. `intl`, `zip`, `pdo_sqlite`, `sqlite3` and OPcache were enabled in its `php.ini` (backup: `php.ini.bak-legitech`). MySQL comes from XAMPP and must be running.

## Editing conventions

- Keep changes focused. Do not add state or data-fetching libraries; use router loaders and `useLoaderData`.
- Set page `<title>` and `<meta name="description">` inside each page component. React 19 hoists them into the head.
- Contact-form options (services, budgets, timelines) come from `GET /api/enquiry-options`, backed by `App\Models\Enquiry`. Never hard-code them in the frontend.
- The theme preference is stored under `legitech-theme` in localStorage. `index.html` applies it before first paint, and the toggle in `site-header.tsx` flips the `dark` class on `<html>`.
- Preserve the skip link, semantic headings, image alternatives, form labels, keyboard access, and `aria-current` on nav links (NavLink sets this).
- Read and write files as UTF-8.

## Verification

- Backend: `cd backend && php artisan test` (feature tests in `tests/Feature/ApiTest.php` and `AdminApiTest.php`).
- Frontend: `cd frontend && npm run build` (type-check plus build) and `npm run lint`.
- In the browser, check desktop and mobile widths (about 1180px, 900px and 680px), light and dark themes, the mobile menu, and the console for errors. Compare public pages against `legacy-static/` (open it at http://localhost/legitech-new/legacy-static/).
- Report which checks were performed and any behavior that could not be verified.

## Workspace state

This directory is not a Git repository. Do not initialize Git unless requested.
