<?php

namespace Database\Seeders;

use App\Models\Addon;
use App\Models\Bundle;
use App\Models\Package;
use App\Models\PricingCategory;
use Illuminate\Database\Seeder;

/**
 * Pricing page data. Like DatabaseSeeder, it uses firstOrCreate: re-running adds missing rows but never
 * overwrites prices or features edited in /admin. Feature rows and bundle items are only written for new rows.
 */
class PricingSeeder extends Seeder
{
    /** Columns: name, tier, description, min, max, delivery, revisions, support, maintenance min, maintenance max (null = "+"). */
    private const PACKAGES = [
        'website' => [
            ['Starter', 'starter', 'A clean, fast brochure site to get your business online.', 450, 700, '1.5 – 2 weeks', '2', '1 month', 25, 40],
            ['Standard', 'standard', 'A custom site you can update yourself, built to grow with you.', 1200, 1800, '3 – 4 weeks', '3', '2 months', 60, 100],
            ['Premium', 'premium', 'A fully custom, database-driven site with an advanced admin.', 3000, 4500, '6 – 8 weeks', '5', '3 months', 150, null],
        ],
        'e-commerce' => [
            ['Starter Store', 'starter', 'Launch a Shopify store quickly with the essentials set up.', 600, 900, '1.5 – 2 weeks', '2', '1 month', 30, 50],
            ['Standard Store', 'standard', 'A polished store with branded emails, shipping rules and tracking.', 1500, 2300, '3 – 4 weeks', '3', '2 months', 80, 120],
            ['Premium Store', 'premium', 'A custom, multi-region store built to scale.', 3500, 5000, '6 – 8 weeks', '5', '3 months', 200, null],
        ],
    ];

    /** Comparison rows: label => [starter, standard, premium]. Values starting with ✅/❌ render as icons. */
    private const FEATURES = [
        'website' => [
            'Pages' => ['5–7 pages (Home, About, Services, Contact, Privacy Policy, etc.)', 'Up to 8 pages (services, blog, case studies)', 'Custom pages, multi-section portal'],
            'Content' => ['Static: fixed text and images', 'Blog and services updated from the admin', 'Products, blog, team and testimonials from a database'],
            'Admin panel' => ['❌', '✅ Basic (blog, pages, contact messages)', '✅ Advanced (roles, SEO control, analytics)'],
            'Design' => ['Template-based, with your colours and logo', 'Custom responsive design', 'Fully custom UI/UX with animations'],
            'Responsive' => ['✅', '✅', '✅'],
            'SEO basics' => ['✅', '✅', '✅ Advanced + schema markup'],
            'Contact forms' => ['1 form', '2–3 forms + email notifications', 'Forms + CRM integration'],
            'Third-party integrations' => ['❌', '1–2 (WhatsApp, Google Maps)', 'Custom (API, payments, CRM)'],
            'Security' => ['✅', '✅', '✅ + backups'],
        ],
        'e-commerce' => [
            'Products' => ['Up to 25', 'Up to 100', '100+, with variants and bulk import'],
            'Theme' => ['Free or low-cost theme with your colours and logo', 'Premium theme customisation', 'Fully custom theme (Liquid)'],
            'Store setup' => ['Basic (currency, shipping, tax, payments)', 'Advanced shipping rules and discount codes', 'Multi-currency, multi-region, complex tax'],
            'Payment gateways' => ['1', '2', 'Multiple + custom checkout'],
            'Product listing help' => ['❌', 'Basic (titles, descriptions, SEO)', 'Full catalogue with SEO and tags'],
            'App integrations' => ['1–2 essential apps', '3–5 apps', 'Custom apps and API'],
            'Email notifications' => ['Default', 'Custom branded', 'Custom + automated flows'],
            'Analytics' => ['Basic', 'Enhanced, with conversion tracking', 'Advanced, with events and dashboards'],
            'Admin training' => ['30 minutes', '1 hour + guide', '2 sessions + video guide'],
        ],
    ];

    /** name, description, min, max */
    private const ADDONS = [
        'website' => [
            ['Logo design', '3 concepts, 2 revisions, final files', 120, 200],
            ['Brand identity kit', 'Logo, colours, fonts and brand guidelines', 250, 400],
            ['Letterhead design', null, 40, 70],
            ['Business card design', null, 30, 50],
            ['Email signature design', null, 25, 40],
            ['Social media post templates', 'Set of 5', 50, 80],
            ['Extra page', 'Per page', 30, 50],
            ['Blog setup', null, 120, 200],
            ['Multi-language support', 'Per language', 150, 300],
            ['Hosting and domain setup', 'Hosting setup and domain configuration', 40, 60],
            ['Google Business Profile setup', null, 30, 50],
            ['Content writing', 'Per page', 30, 60],
            ['Stock photos and graphics', 'Sourcing', 15, 40],
        ],
        'e-commerce' => [
            ['Product listing', 'Per product', 8, 15],
            ['Product photo editing', 'Per image', 3, 6],
            ['Custom Shopify theme section', null, 100, 180],
            ['Abandoned cart email flow', null, 120, 200],
            ['Discount, bundle or upsell app setup', null, 60, 120],
            ['Shipping integration', 'Courier API', 150, 300],
            ['Multi-currency setup', null, 100, 180],
            ['Store migration', 'From WooCommerce or another platform', 300, 600],
            ['Logo + brand kit', null, 120, 400],
            ['Email signature, letterhead or business card', 'Each', 25, 70],
        ],
    ];

    public function run(): void
    {
        $categories = [];
        foreach ([['Website', 'website'], ['E-commerce', 'e-commerce']] as $i => [$name, $slug]) {
            $categories[$slug] = PricingCategory::firstOrCreate(['slug' => $slug], ['name' => $name, 'sort_order' => $i + 1]);
        }

        foreach (self::PACKAGES as $slug => $packages) {
            foreach ($packages as $i => [$name, $tier, $description, $min, $max, $delivery, $revisions, $support, $mMin, $mMax]) {
                $package = Package::firstOrCreate(
                    ['pricing_category_id' => $categories[$slug]->id, 'name' => $name],
                    [
                        'tier' => $tier, 'description' => $description, 'min_price' => $min, 'max_price' => $max,
                        'delivery_time' => $delivery, 'revisions' => $revisions, 'support_period' => $support,
                        'monthly_maintenance_min' => $mMin, 'monthly_maintenance_max' => $mMax, 'sort_order' => $i + 1,
                    ],
                );
                if ($package->wasRecentlyCreated) {
                    $order = 0;
                    foreach (self::FEATURES[$slug] as $label => $values) {
                        $package->features()->create(['label' => $label, 'value' => $values[$i], 'sort_order' => ++$order]);
                    }
                }
            }
        }

        foreach (self::ADDONS as $slug => $addons) {
            foreach ($addons as $i => [$name, $description, $min, $max]) {
                Addon::firstOrCreate(
                    ['pricing_category_id' => $categories[$slug]->id, 'name' => $name],
                    ['description' => $description, 'min_price' => $min, 'max_price' => $max, 'sort_order' => $i + 1],
                );
            }
        }

        $addon = fn (string $slug, string $name) => Addon::where('pricing_category_id', $categories[$slug]->id)->where('name', $name)->value('id');

        $this->bundle(
            ['name' => 'Brand Starter Bundle', 'description' => 'Everything for a consistent brand from day one.', 'min_price' => 250, 'max_price' => 350, 'sort_order' => 1],
            array_map(fn ($n) => $addon('website', $n), ['Logo design', 'Letterhead design', 'Business card design', 'Email signature design']),
        );
        $this->bundle(
            [
                'name' => 'Brand + Store Bundle', 'description' => 'A full brand kit and a ready-to-sell Shopify store.',
                'pricing_category_id' => $categories['e-commerce']->id,
                'package_id' => Package::where('pricing_category_id', $categories['e-commerce']->id)->where('name', 'Starter Store')->value('id'),
                'min_price' => 800, 'max_price' => 1100, 'sort_order' => 2,
            ],
            [$addon('e-commerce', 'Logo + brand kit')],
        );
    }

    private function bundle(array $attributes, array $addonIds): void
    {
        $bundle = Bundle::firstOrCreate(['name' => $attributes['name']], $attributes);
        if ($bundle->wasRecentlyCreated) {
            $bundle->addons()->attach(array_filter($addonIds));
        }
    }
}
