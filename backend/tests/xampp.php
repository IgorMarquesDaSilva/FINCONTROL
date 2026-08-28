<?php

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = 0;

$tests = [];
$tests['root index.php exists'] = static fn () => assertTrue(is_file($root . '/index.php'), 'index.php must exist at project root');
$tests['root assets exist'] = static fn () => assertTrue(
    is_file($root . '/assets/css/style.css') && is_file($root . '/assets/js/app.js'),
    'assets must live at project root',
);
$tests['legacy frontend entrypoint is removed'] = static fn () => assertTrue(
    !is_file($root . '/frontend/index.html'),
    'frontend/index.html should be removed',
);
$tests['XAMPP URL is the default'] = static fn () => assertContains(
    'APP_URL=http://localhost/FINCONTROL',
    (string) file_get_contents($root . '/.env.example'),
);
$tests['XAMPP MySQL root user is the default'] = static fn () => assertContains(
    "DB_USERNAME=root\nDB_PASSWORD=",
    (string) file_get_contents($root . '/.env.example'),
);
$tests['phpMyAdmin setup SQL creates and selects database'] = static function () use ($root): void {
    $sql = @file_get_contents($root . '/database/fincontrol_xampp.sql');
    assertTrue(is_string($sql), 'database/fincontrol_xampp.sql must exist');
    assertContains('CREATE DATABASE IF NOT EXISTS fincontrol', $sql);
    assertContains('USE fincontrol;', $sql);
};
$tests['Apache defaults to root index'] = static function () use ($root): void {
    $config = @file_get_contents($root . '/.htaccess');
    assertTrue(is_string($config), '.htaccess must exist');
    assertContains('DirectoryIndex index.php', $config);
};

foreach ($tests as $name => $test) {
    try {
        $test();
        echo "[PASS] {$name}\n";
    } catch (Throwable $exception) {
        $failures++;
        fwrite(STDERR, "[FAIL] {$name}: {$exception->getMessage()}\n");
    }
}

exit($failures === 0 ? 0 : 1);

function assertTrue(bool $condition, string $message): void
{
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

function assertContains(string $needle, string $haystack): void
{
    if (!str_contains($haystack, $needle)) {
        throw new RuntimeException("Missing expected text: {$needle}");
    }
}
