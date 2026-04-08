<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Like
{
	private PDO $db;

	public function __construct(PDO $db)
	{
		$this->db = $db;
	}

	public function reviewExists(int $reviewId): bool
	{
		$query = 'SELECT id FROM album_reviews WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $reviewId]);

		return (bool) $statement->fetch();
	}

	public function hasLike(int $userId, int $reviewId): bool
	{
		$query = 'SELECT id FROM review_likes WHERE user_id = :user_id AND review_id = :review_id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute([
			'user_id' => $userId,
			'review_id' => $reviewId,
		]);

		return (bool) $statement->fetch();
	}

	public function addLike(int $userId, int $reviewId): bool
	{
		$query = 'INSERT INTO review_likes (user_id, review_id) VALUES (:user_id, :review_id)';
		$statement = $this->db->prepare($query);

		return $statement->execute([
			'user_id' => $userId,
			'review_id' => $reviewId,
		]);
	}

	public function removeLike(int $userId, int $reviewId): bool
	{
		$query = 'DELETE FROM review_likes WHERE user_id = :user_id AND review_id = :review_id';
		$statement = $this->db->prepare($query);

		return $statement->execute([
			'user_id' => $userId,
			'review_id' => $reviewId,
		]);
	}

	public function countByReview(int $reviewId): int
	{
		$query = 'SELECT COUNT(*) AS total FROM review_likes WHERE review_id = :review_id';
		$statement = $this->db->prepare($query);
		$statement->execute(['review_id' => $reviewId]);
		$result = $statement->fetch();

		return (int) ($result['total'] ?? 0);
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function toggle(int $userId, int $reviewId): ?array
	{
		if (!$this->reviewExists($reviewId)) {
			return null;
		}

		$liked = !$this->hasLike($userId, $reviewId);

		if ($liked) {
			$this->addLike($userId, $reviewId);
		} else {
			$this->removeLike($userId, $reviewId);
		}

		return [
			'review_id' => $reviewId,
			'liked' => $liked,
			'total_likes' => $this->countByReview($reviewId),
		];
	}
}
