<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Critique
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
		$query = "
			SELECT
				c.id,
				c.title,
				c.content,
				c.rating,
				c.is_pinned,
				c.created_at,
				c.updated_at,
				c.user_id,
				u.username AS author,
				COUNT(l.id) AS likes_count
			FROM critiques c
			INNER JOIN users u ON u.id = c.user_id
			LEFT JOIN likes l ON l.critique_id = c.id
			GROUP BY c.id, c.title, c.content, c.rating, c.is_pinned, c.created_at, c.updated_at, c.user_id, u.username
			ORDER BY c.is_pinned DESC, c.created_at DESC
		";

		$statement = $this->db->query($query);

		return $statement->fetchAll();
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function getById(int $id): ?array
	{
		$query = "
			SELECT
				c.id,
				c.title,
				c.content,
				c.rating,
				c.is_pinned,
				c.created_at,
				c.updated_at,
				c.user_id,
				u.username AS author,
				COUNT(l.id) AS likes_count
			FROM critiques c
			INNER JOIN users u ON u.id = c.user_id
			LEFT JOIN likes l ON l.critique_id = c.id
			WHERE c.id = :id
			GROUP BY c.id, c.title, c.content, c.rating, c.is_pinned, c.created_at, c.updated_at, c.user_id, u.username
			LIMIT 1
		";

		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$critique = $statement->fetch();

		return $critique === false ? null : $critique;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function findRawById(int $id): ?array
	{
		$query = 'SELECT * FROM critiques WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$critique = $statement->fetch();

		return $critique === false ? null : $critique;
	}

	public function create(int $userId, string $title, string $content, int $rating): int
	{
		$query = 'INSERT INTO critiques (user_id, title, content, rating) VALUES (:user_id, :title, :content, :rating)';
		$statement = $this->db->prepare($query);
		$statement->execute([
			'user_id' => $userId,
			'title' => $title,
			'content' => $content,
			'rating' => $rating,
		]);

		return (int) $this->db->lastInsertId();
	}

	public function update(int $id, string $title, string $content, int $rating): bool
	{
		$query = '
			UPDATE critiques
			SET title = :title, content = :content, rating = :rating
			WHERE id = :id
		';

		$statement = $this->db->prepare($query);

		return $statement->execute([
			'id' => $id,
			'title' => $title,
			'content' => $content,
			'rating' => $rating,
		]);
	}

	public function delete(int $id): bool
	{
		$query = 'DELETE FROM critiques WHERE id = :id';
		$statement = $this->db->prepare($query);

		return $statement->execute(['id' => $id]);
	}

	public function setPinned(int $id, bool $isPinned, int $adminUserId): bool
	{
		$query = '
			UPDATE critiques
			SET is_pinned = :is_pinned,
				pinned_at = :pinned_at,
				pinned_by_user_id = :pinned_by_user_id
			WHERE id = :id
		';

		$statement = $this->db->prepare($query);

		return $statement->execute([
			'id' => $id,
			'is_pinned' => $isPinned ? 1 : 0,
			'pinned_at' => $isPinned ? date('Y-m-d H:i:s') : null,
			'pinned_by_user_id' => $isPinned ? $adminUserId : null,
		]);
	}
}
