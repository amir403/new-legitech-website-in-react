<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

#[Fillable(['name', 'email', 'company', 'service', 'budget', 'timeline', 'idea', 'status'])]
class Enquiry extends Model
{
    public const SERVICE_UNSURE = 'More than one service / not sure yet';

    public const BUDGETS = ['Not decided yet', 'Under £5,000', '£5,000–£15,000', '£15,000–£50,000', '£50,000+'];

    public const TIMELINES = ['Flexible / exploring', 'Within 1–3 months', 'Within 3–6 months', '6+ months'];

    public const STATUSES = ['new' => 'New', 'contacted' => 'Contacted', 'closed' => 'Closed'];

    /** Service choices = published service names plus the "not sure" option, so the form and validation never drift. */
    public static function serviceOptions(): array
    {
        return [...Service::published()->pluck('name')->all(), self::SERVICE_UNSURE];
    }
}
