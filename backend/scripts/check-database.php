<?php

declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

use Fincontrol\Config\Env;
use Fincontrol\Database\Connection;

$root = dirname(__DIR__, 2);
Env::load($root . '/.env');

try {
    $pdo = Connection::create();
    $pdo->query('SELECT 1');
    fwrite(STDOUT, "Database connection successful.\n");
    exit(0);
} catch (Throwable $exception) {
    fwrite(STDERR, "Database connection failed: {$exception->getMessage()}\n");
    exit(1);
}
