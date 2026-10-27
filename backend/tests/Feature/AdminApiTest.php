<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\Industry;
use App\Models\Insight;
use App\Models\Service;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function admin(): static
    {
        return $this->actingAs(User::factory()->create());
    }

    private function serviceData(array $overrides = []): array
    {
        return [
            'slug' => 'data-engineering', 'icon' => '◎', 'name' => 'Data engineering', 'summary' => 'Pipelines and reporting.',
            'hero_title' => 'Data you can trust.', 'heading' => "Built around\nyour data.", 'body' => 'We design data platforms.',
            'features' => ['Pipelines'], 'deliverables' => ['Architecture'], 'related_slugs' => ['web-development'],
            'sort_order' => 9, 'is_published' => false,
            ...$overrides,
        ];
    }

    public function test_everything_except_login_and_me_requires_auth(): void
    {
        $this->getJson('/api/admin/me')->assertOk()->assertJsonPath('data', null);
        foreach (['/api/admin/services', '/api/admin/insights', '/api/admin/enquiries'] as $url) {
            $this->getJson($url)->assertUnauthorized();
        }
        $this->postJson('/api/admin/services', $this->serviceData())->assertUnauthorized();
        $this->deleteJson('/api/admin/services/1')->assertUnauthorized();
    }

    public function test_login_with_correct_password_only(): void
    {
        $user = User::factory()->create(['email' => 'admin@example.com', 'password' => 'correct-horse-battery']);

        $this->postJson('/api/admin/login', ['email' => 'admin@example.com', 'password' => 'wrong'])
            ->assertUnprocessable()->assertJsonValidationErrors('email');
        $this->assertGuest();

        $this->postJson('/api/admin/login', ['email' => 'admin@example.com', 'password' => 'correct-horse-battery'])
            ->assertOk()->assertJsonPath('data.email', 'admin@example.com');
        $this->assertAuthenticatedAs($user);
    }

    public function test_login_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/admin/login', ['email' => 'x@example.com', 'password' => 'guess'.$i]);
        }
        $this->postJson('/api/admin/login', ['email' => 'x@example.com', 'password' => 'guess'])->assertTooManyRequests();
    }

    public function test_admin_sees_unpublished_content(): void
    {
        Service::where('slug', 'ecommerce')->update(['is_published' => false]);

        $this->admin()->getJson('/api/admin/services')->assertOk()->assertJsonCount(8, 'data');
    }

    public function test_create_service_and_it_stays_hidden_until_published(): void
    {
        $this->admin()->postJson('/api/admin/services', $this->serviceData())->assertCreated()->assertJsonPath('data.slug', 'data-engineering');

        $this->getJson('/api/services/data-engineering')->assertNotFound();
        $this->postJson('/api/admin/services', $this->serviceData())->assertUnprocessable()->assertJsonValidationErrors('slug');
    }

    public function test_create_validates_fields(): void
    {
        $this->admin()->postJson('/api/admin/services', $this->serviceData([
            'slug' => 'Bad Slug', 'features' => [], 'related_slugs' => ['does-not-exist'], 'is_published' => 'maybe',
        ]))->assertUnprocessable()->assertJsonValidationErrors(['slug', 'features', 'related_slugs.0', 'is_published']);
    }

    public function test_update_keeps_the_slug(): void
    {
        $service = Service::where('slug', 'mobile-apps')->firstOrFail();

        $this->admin()->putJson("/api/admin/services/{$service->id}", $this->serviceData(['slug' => 'renamed', 'name' => 'Apps']))
            ->assertOk()->assertJsonPath('data.slug', 'mobile-apps')->assertJsonPath('data.name', 'Apps');
    }

    public function test_service_cannot_relate_to_itself(): void
    {
        $service = Service::where('slug', 'mobile-apps')->firstOrFail();

        $this->admin()->putJson("/api/admin/services/{$service->id}", $this->serviceData(['related_slugs' => ['mobile-apps']]))
            ->assertUnprocessable()->assertJsonValidationErrors('related_slugs');
    }

    public function test_deleting_a_service_removes_links_to_it(): void
    {
        $service = Service::where('slug', 'saas-products')->firstOrFail();

        $this->admin()->deleteJson("/api/admin/services/{$service->id}")->assertNoContent();

        $this->assertSame(0, Industry::where('service_slug', 'saas-products')->count());
        $this->assertSame(0, Service::whereJsonContains('related_slugs', 'saas-products')->count());
    }

    public function test_insight_draft_and_teaser_art_can_be_empty(): void
    {
        $insight = Insight::firstOrFail();

        $this->admin()->putJson("/api/admin/insights/{$insight->id}", [
            'category' => 'Product', 'read_minutes' => 3, 'title' => 'T', 'intro' => 'I', 'teaser_art' => '',
            'sections' => [['heading' => 'H', 'body' => 'B']], 'published_at' => null,
        ])->assertOk()->assertJsonPath('data.published_at', null);

        $this->getJson("/api/insights/{$insight->slug}")->assertNotFound();
    }

    public function test_enquiry_status_can_change_but_content_cannot(): void
    {
        $enquiry = Enquiry::create(['name' => 'Ada', 'email' => 'ada@example.com', 'service' => 'x', 'budget' => 'x', 'timeline' => 'x', 'idea' => 'Original idea']);

        $this->admin()->patchJson("/api/admin/enquiries/{$enquiry->id}", ['status' => 'contacted', 'idea' => 'Changed'])->assertOk();
        $this->patchJson("/api/admin/enquiries/{$enquiry->id}", ['status' => 'bogus'])->assertUnprocessable();

        $enquiry->refresh();
        $this->assertSame('contacted', $enquiry->status);
        $this->assertSame('Original idea', $enquiry->idea);
        $this->getJson('/api/admin/enquiries?status=contacted')->assertJsonPath('total', 1);
    }

    public function test_unknown_type_is_404(): void
    {
        $this->admin()->getJson('/api/admin/users')->assertNotFound();
    }
}
