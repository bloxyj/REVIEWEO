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

	/**
	 * @return array<string, mixed>|null
	 */
	public function findByEmail(string $email): ?array
	{
		$query = 'SELECT id, username, email, password_hash, role, created_at FROM users WHERE email = :email LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['email' => $email]);
		$user = $statement->fetch();

		return $user === false ? null : $user;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function findByUsername(string $username): ?array
	{
		$query = 'SELECT id, username, email, role, created_at FROM users WHERE username = :username LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['username' => $username]);
		$user = $statement->fetch();

		return $user === false ? null : $user;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function findById(int $id): ?array
	{
		$query = 'SELECT id, username, email, role, created_at FROM users WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$user = $statement->fetch();

		return $user === false ? null : $user;
	}

	/**
	 * @return array<string, mixed>|null
	 */
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

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getAll(): array
	{
		$query = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';
		$statement = $this->db->query($query);

		return $statement->fetchAll();
	}
}
