<?php

declare(strict_types=1);

require dirname(__DIR__) . '/bootstrap.php';

use Fincontrol\Config\DatabaseConfig;
use Fincontrol\Config\Env;

$tests = [];

$tests['Env loads values from file without overwriting existing environment'] = static function (): void {
    $file = tempnam(sys_get_temp_dir(), 'fincontrol-env-');
    file_put_contents($file, "FINCONTROL_TEST_VALUE=file-value\nFINCONTROL_EXISTING=file-value\n");
    putenv('FINCONTROL_EXISTING=environment-value');
    $_ENV['FINCONTROL_EXISTING'] = 'environment-value';

    Env::load($file);

    assertSame('file-value', Env::get('FINCONTROL_TEST_VALUE'));
    assertSame('environment-value', Env::get('FINCONTROL_EXISTING'));
    unlink($file);
};

$tests['Env required throws when variable is missing'] = static function (): void {
    $key = 'FINCONTROL_MISSING_' . bin2hex(random_bytes(4));
    assertThrows(static fn () => Env::required($key), RuntimeException::class);
};

$tests['DatabaseConfig builds a utf8mb4 MySQL DSN'] = static function (): void {
    putenv('DB_HOST=127.0.0.1');
    putenv('DB_PORT=3306');
    putenv('DB_DATABASE=fincontrol');
    putenv('DB_USERNAME=fincontrol');
    putenv('DB_PASSWORD=secret');

    $config = DatabaseConfig::fromEnvironment();

    assertSame('mysql:host=127.0.0.1;port=3306;dbname=fincontrol;charset=utf8mb4', $config->dsn());
};

$tests['DatabaseConfig rejects invalid port'] = static function (): void {
    putenv('DB_HOST=127.0.0.1');
    putenv('DB_PORT=99999');
    putenv('DB_DATABASE=fincontrol');
    putenv('DB_USERNAME=fincontrol');
    putenv('DB_PASSWORD=secret');

    assertThrows(static fn () => DatabaseConfig::fromEnvironment(), InvalidArgumentException::class);
};

$failures = 0;
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

function assertSame(mixed $expected, mixed $actual): void
{
    if ($expected !== $actual) {
        throw new RuntimeException('Expected ' . var_export($expected, true) . ', got ' . var_export($actual, true));
    }
}

function assertThrows(callable $callback, string $expectedClass): void
{
    try {
        $callback();
    } catch (Throwable $exception) {
        if ($exception instanceof $expectedClass) {
            return;
        }

        throw new RuntimeException("Expected {$expectedClass}, got " . $exception::class);
    }

    throw new RuntimeException("Expected exception {$expectedClass} was not thrown");
}
