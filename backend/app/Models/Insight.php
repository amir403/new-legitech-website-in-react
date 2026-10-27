<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['slug', 'category', 'read_minutes', 'title', 'intro', 'teaser_art', 'sections', 'published_at'])]
class Insight extends Model
{
    protected function casts(): array
    {
        return [
            'sections' => 'array',
            'published_at' => 'datetime',
        ];
    }

    /** Drafts have no published_at; scheduled posts stay hidden until their date. */
    #[Scope]
    protected function published(Builder $query): void
    {
        $query->whereNotNull('published_at')->where('published_at', '<=', now())->latest('published_at');
    }
}
