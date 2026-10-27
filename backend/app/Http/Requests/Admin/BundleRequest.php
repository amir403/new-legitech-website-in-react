<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class BundleRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            ...PriceRequest::COMMON,
            'pricing_category_id' => ['nullable', 'integer', 'exists:pricing_categories,id'],
            'package_id' => ['nullable', 'integer', 'exists:packages,id'],
            'sort_order' => [...PriceRequest::COMMON['sort_order'], PriceRequest::uniqueSortOrder('bundles', 'pricing_category_id', $this->input('pricing_category_id'), $this->route('bundle'))],
            'addon_ids' => ['present', 'array', 'max:20'],
            'addon_ids.*' => ['integer', 'distinct', 'exists:addons,id'],
        ];
    }
}
