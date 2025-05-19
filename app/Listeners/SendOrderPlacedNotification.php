<?php
namespace App\Listeners;

use App\Events\OrderPlaced;
use Illuminate\Support\Facades\Log;

class SendOrderPlacedNotification
{
    public function handle(OrderPlaced $event)
    {
        // Simulate sending email to admin
        Log::info('Order placed: ' . $event->order->id);
    }
}
