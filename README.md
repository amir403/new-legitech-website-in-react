# LegiTech.io website

React SPA (`frontend/`) + Laravel API (`backend/`). Project guidance: `AGENTS.md`. Plans: `WORKPLAN.md`, `PRICING-CHECKOUT-PLAN.md`.

## Setup

Needs PHP 8.3+, Composer, Node 20+, and MySQL (XAMPP) with a `legitech` database.

```
cd backend
composer install
cp .env.example .env          # set DB_DATABASE=legitech and the DB user/password
php artisan key:generate
php artisan migrate --seed    # content + pricing data
php artisan admin:create you@example.com "Your Name"
php artisan serve             # http://127.0.0.1:8000

cd frontend
npm install
npm run dev                   # http://localhost:5173 (site + /admin, proxies /api to :8000)
```

Online checkout is off until Stripe test keys are in `backend/.env`; see "To switch on test mode" in `PRICING-CHECKOUT-PLAN.md`.

## Checks

```
cd backend  && php artisan test
cd frontend && npm run build && npm run lint
```
