# Pricing + checkout — work plan

## Status

| Part | Status |
|---|---|
| Pricing data (DB, seeder, public API, admin API, cache, tests) | **Done** |
| Pricing page `/pricing` (tabs, packages, comparison table, add-ons, bundles) | **Done** |
| "Get started" → contact form pre-filled with service + package | **Done** |
| Admin screens for editing prices (the admin API exists; no UI yet) | Not started |
| Online checkout (Stripe Checkout + Klarna) | Not started — see "Checkout (later)" |

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

## Next steps

1. **Admin screens** for packages, add-ons and bundles (price edit at minimum) in `src/admin/`.
2. **Home page teaser**: a short "Pricing from £450" block linking to `/pricing`.
3. **Checkout (later)**, only if fixed prices are wanted. Ranges can't be charged, so this needs either a fixed price per package or a deposit:
   - Stripe Checkout (hosted page; cards, Apple Pay, Google Pay). Klarna is switched on in the Stripe Dashboard, with no separate integration; confirm the account is eligible first.
   - The server sets the amount from the DB (never from the browser); an `orders` table; the order is marked paid only by the Stripe webhook (`checkout.session.completed`, `async_payment_succeeded/failed`, `expired`).
   - Terms of sale + refund/cancellation policy (UK 14-day cancellation right for online services), privacy update, VAT decision.

## Open questions

- Brand Starter Bundle: £250–£350 costs **more** at the midpoint (£300) than its four add-ons bought separately (£287.50 midpoint; £215–£360 range), so no "Save" badge is shown. Lower the bundle price if it should read as a saving.
- Are prices shown incl. or excl. VAT?
- WhatsApp number, if the CTA should also offer WhatsApp.
