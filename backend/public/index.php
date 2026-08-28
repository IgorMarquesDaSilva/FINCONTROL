<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

if ($path === '/health') {
    http_response_code(200);
    echo json_encode([
        'status' => 'ok',
        'service' => 'FINCONTROL API',
        'timestamp' => gmdate(DATE_ATOM),
    ], JSON_UNESCAPED_SLASHES);
    exit;
}

http_response_code(404);
echo json_encode([
    'error' => 'not_found',
    'message' => 'Route not found.',
]);
