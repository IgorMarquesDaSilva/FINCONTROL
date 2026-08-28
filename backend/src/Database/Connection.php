<?php

declare(strict_types=1);

namespace Fincontrol\Database;

use Fincontrol\Config\DatabaseConfig;
use PDO;

final class Connection
{
    public static function create(?DatabaseConfig $config = null): PDO
    {
        $config ??= DatabaseConfig::fromEnvironment();

        return new PDO(
            $config->dsn(),
            $config->username,
            $config->password,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );
    }
}
