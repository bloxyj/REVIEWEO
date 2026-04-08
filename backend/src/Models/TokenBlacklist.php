<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;
use PDOException;

final class TokenBlacklist
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function isBlacklisted(string $jti): bool
    {
        try {
            $query = 'SELECT id FROM token_blacklist WHERE token_jti = :token_jti AND expires_at > NOW() LIMIT 1';
            $statement = $this->db->prepare($query);
            $statement->execute(['token_jti' => $jti]);

            return (bool) $statement->fetch();
        } catch (PDOException $exception) {
            return false;
        }
    }

    public function add(string $jti, string $expiresAt): bool
    {
        try {
            $query = 'INSERT INTO token_blacklist (token_jti, expires_at) VALUES (:token_jti, :expires_at)';
            $statement = $this->db->prepare($query);

            return $statement->execute([
                'token_jti' => $jti,
                'expires_at' => $expiresAt,
            ]);
        } catch (PDOException $exception) {
            return false;
        }
    }
}
