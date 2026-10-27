<?php

namespace App\Support;

class Price
{
    /** "£450 – £700", "£150+" when max is null, "£50" when min = max. Pence only shown when not whole pounds. */
    public static function range(string|float|null $min, string|float|null $max): ?string
    {
        if ($min === null) {
            return null;
        }
        if ($max === null) {
            return self::format($min).'+';
        }

        return (float) $min === (float) $max ? self::format($min) : self::format($min).' – '.self::format($max);
    }

    private static function format(string|float $amount): string
    {
        $amount = (float) $amount;

        return '£'.number_format($amount, fmod($amount, 1.0) == 0.0 ? 0 : 2);
    }
}
