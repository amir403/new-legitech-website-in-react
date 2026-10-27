<?php

namespace Database\Seeders;

use App\Models\Industry;
use App\Models\Insight;
use App\Models\Service;
use App\Models\WorkConcept;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed site content from content.json (extracted from legacy-static/).
     * firstOrCreate by slug: re-running adds missing rows but never overwrites edits made in /admin.
     * Admin logins are not seeded; create one with `php artisan make:filament-user`.
     */
    public function run(): void
    {
        $content = json_decode(file_get_contents(__DIR__.'/content.json'), true, flags: JSON_THROW_ON_ERROR);

        $models = [
            'services' => Service::class,
            'insights' => Insight::class,
            'work_concepts' => WorkConcept::class,
            'industries' => Industry::class,
        ];

        foreach ($models as $key => $model) {
            foreach ($content[$key] as $row) {
                $model::firstOrCreate(['slug' => $row['slug']], $row);
            }
        }
    }
}
