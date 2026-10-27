<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'name', 'tags', 'title', 'summary', 'opportunity', 'includes', 'sort_order', 'is_published'])]
class WorkConcept extends Model
{
    protected function casts(): array
    {
        return [
            'includes' => 'array',
            'is_published' => 'boolean',
        ];
    }

    #[Scope]
    protected function published(Builder $query): void
    {
        $query->where('is_published', true)->orderBy('sort_order');
    }
}
