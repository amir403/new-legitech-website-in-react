# Pricing + checkout — work plan

## Status

| Part | Status |
|---|---|
| Pricing data (DB, seeder, public API, admin API, cache, tests) | **Done** |
| Pricing page `/pricing` (tabs, packages, comparison table, add-ons, bundles) | **Done** |
| "Get started" → contact form pre-filled with service + package | **Done** |
| Admin screens: Pricing → Packages, Add-ons, Bundles in `/admin` | **Done** |
| Home page band with starting prices, linking to `/pricing` | **Done** |
| Online checkout (Stripe Checkout + Klarna), orders in `/admin/orders` | **Built, test mode only** — needs Stripe keys, see "Checkout" |

## How pricing works

- Prices are **indicative ranges** (`min_price`–`max_price`, GBP, `decimal(10,2)`), shown as "£450 – £700". The "Get started" buttons lead to the contact form; the final quote is agreed per project.
- Tables: `pricing_categories` → `packages` (+ `package_features` comparison rows) and `addons`; `bundles` link to add-ons (`addon_bundle`) and optionally one package. Null category = shown in every tab.
- Feature rows share one label order per category; delivery time, revisions, support and monthly maintenance are package columns, appended to the comparison table by the frontend.
- `GET /api/pricing` is cached for an hour. Every save/delete of a pricing model flushes it (`App\Models\Concerns\FlushesPricingCache`), so admin edits show immediately.
- Seed data: `database/seeders/PricingSeeder.php`. Like the content seeder it never overwrites rows edited in the admin.

## API

```
GET /api/pricing                      categories (packages + features, add-ons), general_addons, bundles
GET /api/pricing/packages?category=   website | e-commerce
GET /api/pricing/addons?category=
GET /api/pricing/bundles?category=

# admin (session auth, same as the rest of /api/admin)
GET|POST /api/admin/pricing/{packages|addons|bundles}
GET|PUT|DELETE /api/admin/pricing/{packages|addons|bundles}/{id}
PATCH /api/admin/pricing/{packages|addons|bundles}/{id}/price   { min_price, max_price }
```

Package PUT/POST takes `features: [{label, value}]` (replaced as a whole, in that order). Bundle PUT/POST takes `addon_ids`.
Validation: `max_price >= min_price`; `sort_order` unique within the same category (null category is its own group).

## Checkout

- **What is charged:** the item's "from" price (`min_price`), in full, in GBP, no VAT. Packages, bundles and add-ons can all be bought, one item per checkout.
- **Flow:** `/pricing` → "Buy now" → `/checkout/{package|bundle|addon}/{id}` (name, email, company, notes, terms) → `POST /api/checkout` creates a pending order and a Stripe Checkout Session → Stripe's hosted page → `/checkout/success?session_id=…` or `/checkout/cancelled`.
- **Paid only via webhook:** `POST /api/stripe/webhook` (signature-verified) marks the order paid on `checkout.session.completed` (when `payment_status = paid`) or `async_payment_succeeded`; also handles `async_payment_failed`, `expired` and full `charge.refunded`. It is idempotent: a pending order is paid and emailed once.
- **Emails:** `OrderPaid` to the team (`MAIL_ENQUIRIES_TO`) and a confirmation to the customer.
- **Payment methods** are not hard-coded: Checkout shows what is switched on in the Stripe Dashboard (cards, Apple Pay, Google Pay, Klarna) and suits the amount.
- **Off switch:** with `STRIPE_SECRET` or `STRIPE_WEBHOOK_SECRET` empty, `POST /api/checkout` answers 503 and the page shows a "get in touch" message.
- Code: `App\Services\StripeCheckout` (the only Stripe caller), `Api\CheckoutController`, `App\Models\Order`, `tests/Feature/CheckoutTest.php`.

### To switch on test mode

1. Create a Stripe account, stay in **Test mode**, and copy the secret key (`sk_test_…`) into `backend/.env` as `STRIPE_SECRET`.
2. Dashboard → Settings → Payment methods: switch on Klarna (and Apple Pay / Google Pay). Klarna needs a UK business address and has minimum/maximum amounts.
3. Install the Stripe CLI and run `stripe listen --forward-to localhost:8000/api/stripe/webhook`. Copy the `whsec_…` it prints into `STRIPE_WEBHOOK_SECRET`.
4. `SITE_URL=http://localhost:5173` in `.env` (where Stripe sends people back to). Then `php artisan config:clear`.
5. Pay with test card `4242 4242 4242 4242`, any future date, any CVC.

### Before taking real payments

- Cancellation and refund terms on `/terms` (TODO in `pages/legal.tsx`; UK 14-day cancellation right for services bought online). Get them checked.
- Live keys and a live webhook endpoint (`https://<domain>/api/stripe/webhook`, same events as above) in the Stripe Dashboard; `SITE_URL` = the live site.
- A real mail driver, so the confirmation emails actually send.

## Open questions

- Brand Starter Bundle: £250–£350 costs **more** at the midpoint (£300) than its four add-ons bought separately (£287.50 midpoint; £215–£360 range), so no "Save" badge is shown. Lower the bundle price if it should read as a saving.
- WhatsApp number, if the CTA should also offer WhatsApp.
