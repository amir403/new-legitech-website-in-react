<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

/** Create/replace a package together with its comparison rows (features are replaced as a whole, in the order sent). */
class PackageRequest extends FormRequest
{
    public function rules(): array
    {
        $text = ['required', 'string', 'max:255'];

        return [
            ...PriceRequest::COMMON,
            'pricing_category_id' => ['required', 'integer', 'exists:pricing_categories,id'],
            'tier' => ['required', 'in:starter,standard,premium'],
            'currency' => ['sometimes', 'string', 'size:3'],
            'delivery_time' => $text, 'revisions' => $text, 'support_period' => $text,
            'monthly_maintenance_min' => ['nullable', 'required_with:monthly_maintenance_max', 'numeric', 'min:0', 'max:99999999'],
            'monthly_maintenance_max' => ['nullable', 'numeric', 'gte:monthly_maintenance_min'],
            'sort_order' => [...PriceRequest::COMMON['sort_order'], PriceRequest::uniqueSortOrder('packages', 'pricing_category_id', $this->input('pricing_category_id'), $this->route('package'))],
            'features' => ['present', 'array', 'max:40'],
            'features.*.label' => [...$text, 'distinct'],
            'features.*.value' => $text,
        ];
    }
}
