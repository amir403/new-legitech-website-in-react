<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AddonRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            ...PriceRequest::COMMON,
            'pricing_category_id' => ['nullable', 'integer', 'exists:pricing_categories,id'],
            'sort_order' => [...PriceRequest::COMMON['sort_order'], PriceRequest::uniqueSortOrder('addons', 'pricing_category_id', $this->input('pricing_category_id'), $this->route('addon'))],
        ];
    }
}
