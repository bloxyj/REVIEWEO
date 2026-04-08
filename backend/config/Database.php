<?php

declare(strict_types=1);

class Database
{
    private string $host;
    private string $user;
    private string $password;
    private string $database;
    private ?PDO $conn = null;

    public function __construct()
    {
        $this->host = $this->readEnv(['DB_HOST', 'MYSQL_HOST'], 'mysql');
        $this->user = $this->readEnv(['DB_USER', 'MYSQL_USER'], 'revieweo');
        $this->password = $this->readEnv(['DB_PASS', 'MYSQL_PASSWORD'], 'revieweo_password');
        $this->database = $this->readEnv(['DB_NAME', 'MYSQL_DATABASE', 'MYSQL_DB'], 'revieweo');
    }

    public function connect(): ?PDO
    {
        try {
            $dsn = sprintf('mysql:host=%s;dbname=%s;charset=utf8mb4', $this->host, $this->database);
            $this->conn = new PDO($dsn, $this->user, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log(
                sprintf('[%s] O no! Connection failed: %s%s', date('Y-m-d H:i:s'), $e->getMessage(), PHP_EOL),
                3,
                __DIR__ . '/../logs/error.log'
            );
            $this->conn = null;
        }

        return $this->conn;
    }

    private function readEnv(array $keys, string $default = ''): string
    {
        foreach ($keys as $key) {
            $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
            if ($value !== false && $value !== null && $value !== '') {
                return (string) $value;
            }
        }

        return $default;
    }
}