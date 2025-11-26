<?php
require __DIR__ . '/vendor/autoload.php';

$client = new \Cloudinary\Cloudinary([
    'cloud' => [
        'cloud_name' => 'dmbsmwwtf',
        'api_key'    => '789878793788939',
        'api_secret' => 'mWNwf7TVzcUbOBTnrxusBk0HLCw',
    ],
]);

$result = $client->uploadApi()->upload(
    'C:/Users/HP/Downloads/Bước 1.jpg',
    [
        'folder' => 'Tracuutuyensinh', // 👈 Thêm dòng này để lưu vào folder đó
        'use_filename' => true,
        'unique_filename' => false
    ]
);

print_r($result);
