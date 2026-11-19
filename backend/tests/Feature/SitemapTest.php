<?php

namespace Tests\Feature;

use App\Models\Insight;
use App\Models\Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SitemapTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function test_sitemap_lists_pages_and_only_published_content(): void
    {
        config(['app.site_url' => 'https://legitech.io']);
        Service::where('slug', 'mobile-apps')->update(['is_published' => false]);
        Insight::where('slug', 'planning-your-mvp')->update(['published_at' => null]);

        $xml = $this->get('/sitemap.xml')->assertOk()->assertHeader('Content-Type', 'application/xml; charset=UTF-8')->getContent();

        $this->assertNotFalse(simplexml_load_string($xml), 'sitemap is valid XML');
        $this->assertStringContainsString('<loc>https://legitech.io/</loc>', $xml);
        $this->assertStringContainsString('<loc>https://legitech.io/pricing</loc>', $xml);
        $this->assertStringContainsString('<loc>https://legitech.io/services/web-development</loc>', $xml);
        $this->assertStringContainsString('<loc>https://legitech.io/insights/practical-automation</loc>', $xml);
        $this->assertStringNotContainsString('/services/mobile-apps', $xml);
        $this->assertStringNotContainsString('/insights/planning-your-mvp', $xml);
        $this->assertStringNotContainsString('/admin', $xml);
        $this->assertStringNotContainsString('/checkout', $xml);
    }
}
