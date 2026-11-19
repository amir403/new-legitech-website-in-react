<?php

namespace App\Http\Controllers;

use App\Models\Insight;
use App\Models\Service;
use Illuminate\Http\Response;

/** sitemap.xml for the React site: fixed pages plus every published service and insight, so new content is listed automatically. */
class SitemapController extends Controller
{
    private const PAGES = ['/', '/services', '/pricing', '/work', '/about', '/industries', '/insights', '/contact', '/privacy', '/terms'];

    public function __invoke(): Response
    {
        $site = config('app.site_url');
        $urls = [
            ...array_map(fn ($path) => ['loc' => $site.$path], self::PAGES),
            ...Service::published()->get(['slug', 'updated_at'])->map(fn ($s) => ['loc' => "$site/services/$s->slug", 'lastmod' => $s->updated_at]),
            ...Insight::published()->get(['slug', 'published_at', 'updated_at'])->map(fn ($i) => ['loc' => "$site/insights/$i->slug", 'lastmod' => $i->updated_at ?? $i->published_at]),
        ];

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'."\n".'<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'."\n";
        foreach ($urls as $url) {
            $xml .= '  <url><loc>'.e($url['loc']).'</loc>'.(isset($url['lastmod']) ? '<lastmod>'.$url['lastmod']->toDateString().'</lastmod>' : '')."</url>\n";
        }

        return response($xml.'</urlset>'."\n", 200, ['Content-Type' => 'application/xml; charset=UTF-8']);
    }
}
