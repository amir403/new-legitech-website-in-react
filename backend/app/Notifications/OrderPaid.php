<?php

namespace App\Notifications;

use App\Models\Order;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/** Sent once Stripe confirms a payment: a confirmation to the customer, and the order details to the team. */
class OrderPaid extends Notification
{
    public function __construct(public Order $order, public bool $forCustomer) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $o = $this->order;
        $amount = '£'.number_format((float) $o->amount, 2);

        if ($this->forCustomer) {
            return (new MailMessage)
                ->subject("Payment received: {$o->item_name} ({$o->reference})")
                ->greeting("Thank you, {$o->customer_name}.")
                ->line("We have received your payment of {$amount} for the {$o->item_name}.")
                ->line("Your order reference is **{$o->reference}**.")
                ->line('We will be in touch by email to plan the next steps.');
        }

        return (new MailMessage)
            ->subject("New order paid: {$o->item_name} ({$amount})")
            ->replyTo($o->customer_email, $o->customer_name)
            ->line("**Reference:** {$o->reference}")
            ->line("**Item:** {$o->item_name}")
            ->line("**Amount:** {$amount}")
            ->line("**Name:** {$o->customer_name}")
            ->line("**Email:** {$o->customer_email}")
            ->line('**Company:** '.($o->company ?: 'Not provided'))
            ->line('**Notes:** '.($o->notes ?: 'None'))
            ->action('Open orders in admin', config('services.stripe.site_url').'/admin/orders');
    }
}
