<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class User
{
    private PDO $db;

    public function __construct(PDO $db)
    {
        $this->db = $db;
    }

    public function findByEmail(string $email): ?array
    {
        $query = 'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = :email LIMIT 1';
        $statement = $this->db->prepare($query);
        $statement->execute(['email' => $email]);
        $user = $statement->fetch();
        return $user === false ? null : $user;
    }

    public function findByUsername(string $username): ?array
    {
        $query = 'SELECT id, username, email, role, created_at FROM users WHERE username = :username LIMIT 1';
        $statement = $this->db->prepare($query);
        $statement->execute(['username' => $username]);
        $user = $statement->fetch();
        return $user === false ? null : $user;
    }

    public function findById(int $id): ?array
    {
        $query = 'SELECT id, username, email, role, created_at FROM users WHERE id = :id LIMIT 1';
        $statement = $this->db->prepare($query);
        $statement->execute(['id' => $id]);
        $user = $statement->fetch();
        return $user === false ? null : $user;
    }

    public function create(string $username, string $email, string $passwordHash, string $role = 'user'): ?array
    {
        $query = 'INSERT INTO users (username, email, password_hash, role) VALUES (:username, :email, :password_hash, :role)';
        $statement = $this->db->prepare($query);
        $statement->execute([
            'username' => $username,
            'email' => $email,
            'password_hash' => $passwordHash,
            'role' => $role,
        ]);
        return $this->findById((int) $this->db->lastInsertId());
    }

    public function getAll(): array
    {
        $query = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';
        $statement = $this->db->query($query);
        return $statement->fetchAll();
    }

    public function updateRole(int $id, string $role): bool
    {
        $query = 'UPDATE users SET role = :role WHERE id = :id';
        $statement = $this->db->prepare($query);
        return $statement->execute(['role' => $role, 'id' => $id]);
    }

    public function delete(int $id): bool
    {
        $query = 'DELETE FROM users WHERE id = :id';
        $statement = $this->db->prepare($query);
        return $statement->execute(['id' => $id]);
    }
}   