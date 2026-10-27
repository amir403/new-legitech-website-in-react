<?php

namespace Tests\Feature;

use App\Models\Enquiry;
use App\Models\Insight;
use App\Models\Service;
use App\Notifications\NewEnquiry;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use RuntimeException;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    private function validEnquiry(array $overrides = []): array
    {
        return [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'company' => '',
            'service' => 'Mobile app development',
            'budget' => 'Under £5,000',
            'timeline' => '6+ months',
            'idea' => 'A booking app for our studio.',
            ...$overrides,
        ];
    }

    public function test_services_are_listed_in_order_with_numbers(): void
    {
        $this->getJson('/api/services')
            ->assertOk()
            ->assertJsonCount(8, 'data')
            ->assertJsonPath('data.0.slug', 'custom-software')
            ->assertJsonPath('data.0.number', '01')
            ->assertJsonMissingPath('data.0.body');
    }

    public function test_service_detail_includes_related_names(): void
    {
        $this->getJson('/api/services/custom-software')
            ->assertOk()
            ->assertJsonPath('data.related.0', ['slug' => 'web-development', 'name' => 'Website & web app development'])
            ->assertJsonMissingPath('data.related_slugs');
    }

    public function test_unpublished_service_is_hidden_everywhere(): void
    {
        Service::where('slug', 'ecommerce')->update(['is_published' => false]);

        $this->getJson('/api/services')->assertJsonCount(7, 'data');
        $this->getJson('/api/services/ecommerce')->assertNotFound();
        // A hidden service can no longer be picked in the contact form either.
        $this->postJson('/api/enquiries', $this->validEnquiry(['service' => 'E-commerce development']))
            ->assertUnprocessable()->assertJsonValidationErrors('service');
    }

    public function test_draft_and_scheduled_insights_are_hidden(): void
    {
        Insight::where('slug', 'planning-your-mvp')->update(['published_at' => null]);
        Insight::where('slug', 'practical-automation')->update(['published_at' => now()->addDay()]);

        $this->getJson('/api/insights')->assertJsonCount(1, 'data');
        $this->getJson('/api/insights/planning-your-mvp')->assertNotFound();
        $this->getJson('/api/insights/design-before-development')->assertOk()->assertJsonCount(5, 'data.sections');
    }

    public function test_valid_enquiry_is_saved_and_emailed(): void
    {
        Notification::fake();

        $this->postJson('/api/enquiries', $this->validEnquiry())->assertCreated();

        $enquiry = Enquiry::sole();
        $this->assertSame('new', $enquiry->fresh()->status);
        $this->assertNull($enquiry->company);
        Notification::assertSentOnDemand(NewEnquiry::class);
    }

    public function test_invalid_enquiry_returns_field_errors(): void
    {
        $this->postJson('/api/enquiries', $this->validEnquiry(['email' => 'nope', 'budget' => '£1', 'idea' => 'short']))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'budget', 'idea']);

        $this->assertSame(0, Enquiry::count());
    }

    public function test_honeypot_blocks_bots(): void
    {
        $this->postJson('/api/enquiries', $this->validEnquiry(['website' => 'http://spam.example']))
            ->assertUnprocessable();

        $this->assertSame(0, Enquiry::count());
    }

    public function test_enquiries_are_rate_limited(): void
    {
        Notification::fake();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/enquiries', $this->validEnquiry())->assertCreated();
        }
        $this->postJson('/api/enquiries', $this->validEnquiry())->assertTooManyRequests();
    }

    public function test_mail_failure_still_keeps_the_enquiry(): void
    {
        Notification::shouldReceive('route->notify')->andThrow(new RuntimeException('SMTP down'));

        $this->postJson('/api/enquiries', $this->validEnquiry())->assertCreated();

        $this->assertSame(1, Enquiry::count());
    }

    public function test_enquiry_options_match_validation(): void
    {
        $options = $this->getJson('/api/enquiry-options')->assertOk()->json('data');

        $this->assertCount(9, $options['services']);
        $this->assertSame(Enquiry::BUDGETS, $options['budgets']);
        $this->assertSame(Enquiry::TIMELINES, $options['timelines']);
    }
}
