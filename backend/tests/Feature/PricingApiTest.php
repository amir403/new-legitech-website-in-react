<?php

namespace Tests\Feature;

use App\Models\Addon;
use App\Models\Bundle;
use App\Models\Package;
use App\Models\PackageFeature;
use App\Models\PricingCategory;
use App\Models\User;
use Database\Seeders\PricingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PricingApiTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function admin(): static
    {
        return $this->actingAs(User::factory()->create());
    }

    private function packageData(array $overrides = []): array
    {
        return [
            'pricing_category_id' => PricingCategory::where('slug', 'website')->value('id'),
            'name' => 'Enterprise', 'tier' => 'premium', 'description' => null,
            'min_price' => 6000, 'max_price' => 9000,
            'delivery_time' => '10 weeks', 'revisions' => '6', 'support_period' => '6 months',
            'monthly_maintenance_min' => 300, 'monthly_maintenance_max' => null,
            'is_active' => true, 'sort_order' => 9,
            'features' => [['label' => 'Pages', 'value' => 'Unlimited'], ['label' => 'Responsive', 'value' => '✅']],
            ...$overrides,
        ];
    }

    public function test_seeder_creates_the_expected_rows_and_is_idempotent(): void
    {
        $counts = fn () => [Package::count(), Addon::count(), Bundle::count(), PackageFeature::count()];
        $this->assertSame([6, 23, 2, 54], $counts());

        Package::where('name', 'Starter')->update(['min_price' => 499]);
        $this->seed(PricingSeeder::class);

        $this->assertSame([6, 23, 2, 54], $counts());
        $this->assertEquals(499, Package::where('name', 'Starter')->value('min_price'));
    }

    public function test_pricing_returns_categories_packages_addons_and_bundles(): void
    {
        $this->getJson('/api/pricing')
            ->assertOk()
            ->assertJsonCount(2, 'data.categories')
            ->assertJsonPath('data.categories.0.slug', 'website')
            ->assertJsonCount(3, 'data.categories.0.packages')
            ->assertJsonPath('data.categories.0.packages.0.name', 'Starter')
            ->assertJsonPath('data.categories.0.packages.0.min_price', 450)
            ->assertJsonPath('data.categories.0.packages.0.price_display', '£450 – £700')
            ->assertJsonPath('data.categories.0.packages.1.price_display', '£1,200 – £1,800')
            ->assertJsonPath('data.categories.0.packages.2.monthly_maintenance_display', '£150+')
            ->assertJsonPath('data.categories.0.packages.0.features.0', ['label' => 'Pages', 'value' => '5–7 pages (Home, About, Services, Contact, Privacy Policy, etc.)'])
            ->assertJsonCount(13, 'data.categories.0.addons')
            ->assertJsonCount(10, 'data.categories.1.addons')
            ->assertJsonCount(2, 'data.bundles')
            ->assertJsonPath('data.bundles.0.addons.0.name', 'Logo design')
            ->assertJsonPath('data.bundles.1.package.name', 'Starter Store')
            ->assertJsonStructure(['data' => ['categories' => [['id', 'name', 'slug', 'packages' => [[
                'id', 'name', 'tier', 'description', 'min_price', 'max_price', 'currency', 'price_display',
                'delivery_time', 'revisions', 'support_period', 'monthly_maintenance_display', 'features',
            ]], 'addons' => [['id', 'name', 'description', 'min_price', 'max_price', 'price_display']]]], 'general_addons', 'bundles']]);
    }

    public function test_feature_rows_share_the_same_label_order_within_a_category(): void
    {
        foreach (PricingCategory::with('packages.features')->get() as $category) {
            $labels = $category->packages->map(fn ($p) => $p->features->pluck('label')->all())->unique(fn ($l) => implode('|', $l));
            $this->assertCount(1, $labels, $category->slug);
        }
    }

    public function test_filters_by_category(): void
    {
        $this->getJson('/api/pricing/packages?category=e-commerce')->assertOk()->assertJsonCount(3, 'data')->assertJsonPath('data.0.name', 'Starter Store');
        $this->getJson('/api/pricing/addons?category=website')->assertOk()->assertJsonCount(13, 'data');
        $this->getJson('/api/pricing/addons')->assertOk()->assertJsonCount(23, 'data');
        $this->getJson('/api/pricing/bundles?category=e-commerce')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/pricing/packages?category=nope')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_inactive_items_are_hidden(): void
    {
        Package::where('name', 'Premium')->update(['is_active' => false]);
        Addon::where('name', 'Blog setup')->update(['is_active' => false]);
        Bundle::where('name', 'Brand Starter Bundle')->update(['is_active' => false]);

        $this->getJson('/api/pricing')
            ->assertJsonCount(2, 'data.categories.0.packages')
            ->assertJsonCount(12, 'data.categories.0.addons')
            ->assertJsonCount(1, 'data.bundles');
        $this->getJson('/api/pricing/packages?category=website')->assertJsonCount(2, 'data');
    }

    public function test_admin_endpoints_require_auth(): void
    {
        $id = Package::value('id');
        $this->getJson('/api/admin/pricing/packages')->assertUnauthorized();
        $this->patchJson("/api/admin/pricing/packages/$id/price", ['min_price' => 1, 'max_price' => 2])->assertUnauthorized();
        $this->deleteJson('/api/admin/pricing/addons/'.Addon::value('id'))->assertUnauthorized();
    }

    public function test_price_update_flushes_the_cache(): void
    {
        $this->getJson('/api/pricing')->assertJsonPath('data.categories.0.packages.0.price_display', '£450 – £700');

        $id = Package::where('name', 'Starter')->value('id');
        $this->admin()->patchJson("/api/admin/pricing/packages/$id/price", ['min_price' => 500, 'max_price' => 750.5])->assertOk();

        $this->getJson('/api/pricing')->assertJsonPath('data.categories.0.packages.0.price_display', '£500 – £750.50');
    }

    public function test_cached_response_survives_a_serializing_cache_store(): void
    {
        config(['cache.default' => 'database']);

        $this->getJson('/api/pricing')->assertOk();
        $this->getJson('/api/pricing')
            ->assertOk()
            ->assertJsonCount(3, 'data.categories.0.packages')
            ->assertJsonPath('data.categories.0.packages.0.features.0.label', 'Pages')
            ->assertJsonPath('data.bundles.1.package.name', 'Starter Store');
    }

    public function test_min_price_cannot_exceed_max_price(): void
    {
        $id = Addon::value('id');
        $this->admin()->patchJson("/api/admin/pricing/addons/$id/price", ['min_price' => 300, 'max_price' => 200])
            ->assertUnprocessable()->assertJsonValidationErrors('max_price');
        $this->postJson('/api/admin/pricing/packages', $this->packageData(['min_price' => 9500]))
            ->assertUnprocessable()->assertJsonValidationErrors('max_price');
    }

    public function test_sort_order_is_unique_per_parent(): void
    {
        $this->admin()->postJson('/api/admin/pricing/packages', $this->packageData(['sort_order' => 1]))
            ->assertUnprocessable()->assertJsonValidationErrors('sort_order');
        $this->postJson('/api/admin/pricing/packages', $this->packageData())->assertCreated();
        // Same sort_order in another category is fine.
        $this->postJson('/api/admin/pricing/packages', $this->packageData(['pricing_category_id' => PricingCategory::where('slug', 'e-commerce')->value('id')]))
            ->assertCreated();
        // A general add-on (no category) only clashes with other general add-ons.
        $addon = ['pricing_category_id' => null, 'name' => 'Rush delivery', 'description' => null, 'min_price' => 100, 'max_price' => 200, 'is_active' => true, 'sort_order' => 1];
        $this->postJson('/api/admin/pricing/addons', $addon)->assertCreated();
        $this->postJson('/api/admin/pricing/addons', $addon)->assertUnprocessable()->assertJsonValidationErrors('sort_order');
    }

    public function test_package_update_replaces_features_in_order(): void
    {
        $package = Package::where('name', 'Starter')->first();
        $data = $this->packageData([
            'name' => 'Starter', 'sort_order' => $package->sort_order,
            'features' => [['label' => 'Responsive', 'value' => '✅'], ['label' => 'Pages', 'value' => '3 pages']],
        ]);

        $this->admin()->putJson("/api/admin/pricing/packages/{$package->id}", $data)
            ->assertOk()
            ->assertJsonCount(2, 'data.features')
            ->assertJsonPath('data.features.0.label', 'Responsive')
            ->assertJsonPath('data.features.1.value', '3 pages');

        $this->putJson("/api/admin/pricing/packages/{$package->id}", [...$data, 'features' => [['label' => 'A', 'value' => '1'], ['label' => 'A', 'value' => '2']]])
            ->assertUnprocessable()->assertJsonValidationErrors('features.0.label');
    }

    public function test_bundle_addons_are_synced(): void
    {
        $bundle = Bundle::where('name', 'Brand Starter Bundle')->first();
        $logo = Addon::where('name', 'Logo design')->value('id');

        $this->admin()->putJson("/api/admin/pricing/bundles/{$bundle->id}", [
            'pricing_category_id' => null, 'package_id' => null, 'name' => $bundle->name, 'description' => null,
            'min_price' => 100, 'max_price' => 150, 'is_active' => true, 'sort_order' => $bundle->sort_order, 'addon_ids' => [$logo],
        ])->assertOk()->assertJsonCount(1, 'data.addons');

        $this->getJson('/api/pricing/bundles')->assertJsonPath('data.0.price_display', '£100 – £150')->assertJsonCount(1, 'data.0.addons');
    }
}
