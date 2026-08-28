<?php

declare(strict_types=1);

namespace Fincontrol\Config;

use InvalidArgumentException;

final readonly class DatabaseConfig
{
    public function __construct(
        public string $host,
        public int $port,
        public string $database,
        public string $username,
        public string $password,
    ) {
        if ($port < 1 || $port > 65535) {
            throw new InvalidArgumentException('DB_PORT must be between 1 and 65535.');
        }
    }

    public static function fromEnvironment(): self
    {
        return new self(
            host: Env::required('DB_HOST'),
            port: (int) Env::required('DB_PORT'),
            database: Env::required('DB_DATABASE'),
            username: Env::required('DB_USERNAME'),
            password: Env::get('DB_PASSWORD', '') ?? '',
        );
    }

    public function dsn(): string
    {
        return sprintf(
            'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
            $this->host,
            $this->port,
            $this->database,
        );
    }
}
