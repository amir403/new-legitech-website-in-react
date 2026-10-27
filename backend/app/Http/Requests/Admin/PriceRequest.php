<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/** PATCH …/price. Its rules and helpers are shared by the full package, add-on and bundle forms. */
class PriceRequest extends FormRequest
{
    public const PRICE = [
        'min_price' => ['required', 'numeric', 'min:0', 'max:99999999'],
        'max_price' => ['required', 'numeric', 'gte:min_price', 'max:99999999'],
    ];

    public const COMMON = [
        ...self::PRICE,
        'name' => ['required', 'string', 'max:255'],
        'description' => ['nullable', 'string', 'max:500'],
        'is_active' => ['required', 'boolean'],
        'sort_order' => ['required', 'integer', 'min:0', 'max:999'],
    ];

    public function rules(): array
    {
        return self::PRICE;
    }

    /** sort_order must be unique among rows with the same parent; a null parent is its own group. */
    public static function uniqueSortOrder(string $table, string $parentColumn, mixed $parentId, mixed $ignore): Unique
    {
        return Rule::unique($table, 'sort_order')
            ->where(fn ($q) => $parentId === null ? $q->whereNull($parentColumn) : $q->where($parentColumn, $parentId))
            ->ignore($ignore);
    }
}
