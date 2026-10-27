<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Industry;
use App\Models\Insight;
use App\Models\Service;
use App\Models\WorkConcept;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

/** Read-only public content for the React site. Only published rows are ever returned. */
class ContentController extends Controller
{
    private const SERVICE_CARD = ['slug', 'icon', 'name', 'summary', 'sort_order'];

    private const INSIGHT_CARD = ['slug', 'category', 'read_minutes', 'title', 'intro', 'teaser_art', 'published_at'];

    public function services(): JsonResponse
    {
        return $this->data(Service::published()->get(self::SERVICE_CARD)->map($this->numbered(...)));
    }

    public function service(string $slug): JsonResponse
    {
        $service = Service::published()->where('slug', $slug)->firstOrFail();
        $related = Service::published()->whereIn('slug', $service->related_slugs)->get(['slug', 'name']);

        return $this->data([
            ...$this->numbered($service->makeHidden(['id', 'related_slugs', 'is_published', 'created_at', 'updated_at'])),
            'related' => $related,
        ]);
    }

    public function insights(): JsonResponse
    {
        return $this->data(Insight::published()->get(self::INSIGHT_CARD));
    }

    public function insight(string $slug): JsonResponse
    {
        return $this->data(Insight::published()->where('slug', $slug)->firstOrFail(
            [...self::INSIGHT_CARD, 'sections'],
        ));
    }

    public function workConcepts(): JsonResponse
    {
        return $this->data(WorkConcept::published()->get(['slug', 'name', 'tags', 'title', 'summary', 'opportunity', 'includes']));
    }

    public function industries(): JsonResponse
    {
        return $this->data(Industry::published()->get(['slug', 'name', 'summary', 'service_slug']));
    }

    /** "01".."08" labels shown on cards come from sort_order, so reordering in the admin renumbers them. */
    private function numbered(Service $service): array
    {
        return [...$service->makeHidden('sort_order')->toArray(), 'number' => str_pad((string) $service->sort_order, 2, '0', STR_PAD_LEFT)];
    }

    private function data(array|Collection|Model $data): JsonResponse
    {
        return response()->json(['data' => $data]);
    }
}
