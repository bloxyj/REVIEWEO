<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Categorie
{
	private PDO $db;

	public function __construct(PDO $db)
	{
		$this->db = $db;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getAll(): array
	{
		$query = 'SELECT id, name, created_at FROM categories ORDER BY name ASC';
		$statement = $this->db->query($query);

		return $statement->fetchAll();
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function getById(int $id): ?array
	{
		$query = 'SELECT id, name, created_at FROM categories WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$category = $statement->fetch();

		return $category === false ? null : $category;
	}
}
