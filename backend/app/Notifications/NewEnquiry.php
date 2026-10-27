<?php

namespace App\Notifications;

use App\Models\Enquiry;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewEnquiry extends Notification
{
    public function __construct(public Enquiry $enquiry) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $e = $this->enquiry;

        return (new MailMessage)
            ->subject("New project enquiry: {$e->service}")
            ->replyTo($e->email, $e->name)
            ->line("**Name:** {$e->name}")
            ->line("**Email:** {$e->email}")
            ->line('**Company:** '.($e->company ?: 'Not provided'))
            ->line("**Service:** {$e->service}")
            ->line("**Budget:** {$e->budget}")
            ->line("**Timeline:** {$e->timeline}")
            ->line('**Project idea:**')
            ->line($e->idea)
            ->action('Open in admin', url("/admin/enquiries/{$e->id}"));
    }
}
