<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Industry;
use App\Models\Insight;
use App\Models\Service;
use App\Models\WorkConcept;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/**
 * CRUD for the four content types, driven by one rules table so they can't drift apart.
 * Admins see unpublished rows too. Slugs are set on create and never change: the site's links and redirects depend on them.
 */
class ContentController extends Controller
{
    private const PUBLISH = ['sort_order' => ['required', 'integer', 'min:0', 'max:999'], 'is_published' => ['required', 'boolean']];

    /** @return array{0: class-string<Model>, 1: array<string, array>, 2: string} model, rules, order column */
    private function type(string $type): array
    {
        $text = ['required', 'string', 'max:255'];
        $long = ['required', 'string', 'max:5000'];
        $list = ['required', 'array', 'min:1', 'max:20'];
        $item = ['required', 'string', 'max:255', 'distinct'];

        return match ($type) {
            'services' => [Service::class, [
                'icon' => ['required', 'string', 'max:8'],
                'name' => $text, 'summary' => $long, 'hero_title' => $text, 'heading' => $text, 'body' => $long,
                'features' => $list, 'features.*' => $item,
                'deliverables' => $list, 'deliverables.*' => $item,
                'related_slugs' => ['present', 'array', 'max:4'], 'related_slugs.*' => ['string', 'distinct', Rule::exists('services', 'slug')],
                ...self::PUBLISH,
            ], 'sort_order'],
            'insights' => [Insight::class, [
                'category' => $text, 'read_minutes' => ['required', 'integer', 'min:1', 'max:120'],
                'title' => $text, 'intro' => $long, 'teaser_art' => ['nullable', 'string', 'max:40'],
                'sections' => $list, 'sections.*.heading' => $text, 'sections.*.body' => $long,
                // Empty = draft. A future date schedules the article.
                'published_at' => ['nullable', 'date'],
            ], 'published_at'],
            'work-concepts' => [WorkConcept::class, [
                'name' => $text, 'tags' => $text, 'title' => $text, 'summary' => $long, 'opportunity' => $long,
                'includes' => $list, 'includes.*' => $item,
                ...self::PUBLISH,
            ], 'sort_order'],
            'industries' => [Industry::class, [
                'name' => $text, 'summary' => $long,
                'service_slug' => ['nullable', 'string', Rule::exists('services', 'slug')],
                ...self::PUBLISH,
            ], 'sort_order'],
            default => abort(404),
        };
    }

    public function index(string $type): JsonResponse
    {
        [$model, , $order] = $this->type($type);

        return response()->json(['data' => $model::orderBy($order, $order === 'published_at' ? 'desc' : 'asc')->get()]);
    }

    public function show(string $type, int $id): JsonResponse
    {
        [$model] = $this->type($type);

        return response()->json(['data' => $model::findOrFail($id)]);
    }

    public function store(Request $request, string $type): JsonResponse
    {
        [$model, $rules] = $this->type($type);
        $table = (new $model)->getTable();
        $data = $request->validate([
            'slug' => ['required', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', Rule::unique($table, 'slug')],
            ...$rules,
        ]);

        return response()->json(['data' => $model::create($data)], 201);
    }

    public function update(Request $request, string $type, int $id): JsonResponse
    {
        [$model, $rules] = $this->type($type);
        $row = $model::findOrFail($id);
        $data = $request->validate($rules);

        if ($type === 'services' && in_array($row->slug, $data['related_slugs'], true)) {
            return response()->json(['message' => 'A service cannot be related to itself.', 'errors' => ['related_slugs' => ['A service cannot be related to itself.']]], 422);
        }

        $row->update($data);

        return response()->json(['data' => $row]);
    }

    public function destroy(string $type, int $id): JsonResponse
    {
        [$model] = $this->type($type);
        $row = $model::findOrFail($id);

        DB::transaction(function () use ($row) {
            // Don't leave links to a deleted service on industries or in other services' "Keep exploring".
            if ($row instanceof Service) {
                Industry::where('service_slug', $row->slug)->update(['service_slug' => null]);
                Service::whereJsonContains('related_slugs', $row->slug)->get()->each(
                    fn (Service $s) => $s->update(['related_slugs' => array_values(array_diff($s->related_slugs, [$row->slug]))]),
                );
            }
            $row->delete();
        });

        return response()->json(null, 204);
    }
}
