<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'icon', 'name', 'summary', 'hero_title', 'heading', 'body', 'features', 'deliverables', 'related_slugs', 'sort_order', 'is_published'])]
class Service extends Model
{
    protected function casts(): array
    {
        return [
            'features' => 'array',
            'deliverables' => 'array',
            'related_slugs' => 'array',
            'is_published' => 'boolean',
        ];
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true)->orderBy('sort_order');
    }
}
