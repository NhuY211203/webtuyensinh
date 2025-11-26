<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cloudinary configuration
    |--------------------------------------------------------------------------
    |
    | This file maps environment variables into a structure the package expects.
    |
    */

    'cloud' => [
        'cloud_name' => env('CLOUDINARY_CLOUD_NAME', env('CLOUDINARY_URL') ? preg_replace('/.*@(.+)$/', '$1', env('CLOUDINARY_URL')) : null),
        'api_key'    => env('CLOUDINARY_API_KEY', env('CLOUDINARY_URL') ? preg_replace('/cloudinary:\/\/([^:]+):.*$/', '$1', env('CLOUDINARY_URL')) : null),
        'api_secret' => env('CLOUDINARY_API_SECRET', env('CLOUDINARY_URL') ? preg_replace('/cloudinary:\\/\\/[^:]+:([^@]+)@.*/', '$1', env('CLOUDINARY_URL')) : null),
    ],

    'cloud_url' => env('CLOUDINARY_URL'),
    'upload_preset' => env('CLOUDINARY_UPLOAD_PRESET'),
    'upload_route' => env('CLOUDINARY_UPLOAD_ROUTE'),
    'upload_action' => env('CLOUDINARY_UPLOAD_ACTION'),
    'notification_url' => env('CLOUDINARY_NOTIFICATION_URL'),

];
