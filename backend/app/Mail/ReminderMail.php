<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;
use Illuminate\Contracts\Queue\ShouldQueue;
use Carbon\Carbon;

class ReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $topic;
    public string $expertName;
    public Carbon $startAt;
    public string $platform;
    public string $joinUrl;
    public string $manageUrl;

    public function __construct(string $topic, string $expertName, Carbon $startAt, string $platform = '', string $joinUrl = '', string $manageUrl = '')
    {
        $this->topic = $topic;
        $this->expertName = $expertName;
        $this->startAt = $startAt;
        $this->platform = $platform;
        $this->joinUrl = $joinUrl;
        $this->manageUrl = $manageUrl;
    }

    public function build()
    {
        return $this->subject('Nhắc lịch tư vấn')
            ->view('emails.reminder');
    }
}

























