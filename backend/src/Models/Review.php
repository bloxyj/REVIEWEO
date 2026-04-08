<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Review
{
	private PDO $db;

	public function __construct(PDO $db)
	{
		$this->db = $db;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getAll(?int $albumId = null, ?int $userId = null, int $limit = 100): array
	{
		$query = '
			SELECT
				r.id,
				r.album_id,
				a.title AS album_title,
				a.release_year,
				a.release_type,
				a.artist_id,
				ar.name AS artist_name,
				r.user_id,
				u.username AS author,
				r.title,
				r.content,
				r.rating,
				r.is_pinned,
				r.created_at,
				r.updated_at,
				COUNT(rl.id) AS likes_count
			FROM album_reviews r
			INNER JOIN users u ON u.id = r.user_id
			INNER JOIN albums a ON a.id = r.album_id
			INNER JOIN artists ar ON ar.id = a.artist_id
			LEFT JOIN review_likes rl ON rl.review_id = r.id
			WHERE 1 = 1
		';

		if ($albumId !== null) {
			$query .= ' AND r.album_id = :album_id';
		}

		if ($userId !== null) {
			$query .= ' AND r.user_id = :user_id';
		}

		$query .= '
			GROUP BY
				r.id,
				r.album_id,
				a.title,
				a.release_year,
				a.release_type,
				a.artist_id,
				ar.name,
				r.user_id,
				u.username,
				r.title,
				r.content,
				r.rating,
				r.is_pinned,
				r.created_at,
				r.updated_at
			ORDER BY r.is_pinned DESC, r.created_at DESC
			LIMIT :limit
		';

		$statement = $this->db->prepare($query);

		if ($albumId !== null) {
			$statement->bindValue(':album_id', $albumId, PDO::PARAM_INT);
		}

		if ($userId !== null) {
			$statement->bindValue(':user_id', $userId, PDO::PARAM_INT);
		}

		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function getById(int $id): ?array
	{
		$query = '
			SELECT
				r.id,
				r.album_id,
				a.title AS album_title,
				a.release_year,
				a.release_type,
				a.artist_id,
				ar.name AS artist_name,
				r.user_id,
				u.username AS author,
				r.title,
				r.content,
				r.rating,
				r.is_pinned,
				r.created_at,
				r.updated_at,
				COUNT(rl.id) AS likes_count
			FROM album_reviews r
			INNER JOIN users u ON u.id = r.user_id
			INNER JOIN albums a ON a.id = r.album_id
			INNER JOIN artists ar ON ar.id = a.artist_id
			LEFT JOIN review_likes rl ON rl.review_id = r.id
			WHERE r.id = :id
			GROUP BY
				r.id,
				r.album_id,
				a.title,
				a.release_year,
				a.release_type,
				a.artist_id,
				ar.name,
				r.user_id,
				u.username,
				r.title,
				r.content,
				r.rating,
				r.is_pinned,
				r.created_at,
				r.updated_at
			LIMIT 1
		';

		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$review = $statement->fetch();

		return $review === false ? null : $review;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function findRawById(int $id): ?array
	{
		$query = 'SELECT * FROM album_reviews WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$review = $statement->fetch();

		return $review === false ? null : $review;
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function findRawByAlbumAndUser(int $albumId, int $userId): ?array
	{
		$query = 'SELECT * FROM album_reviews WHERE album_id = :album_id AND user_id = :user_id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute([
			'album_id' => $albumId,
			'user_id' => $userId,
		]);
		$review = $statement->fetch();

		return $review === false ? null : $review;
	}

	public function albumExists(int $albumId): bool
	{
		$query = 'SELECT id FROM albums WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $albumId]);

		return (bool) $statement->fetch();
	}

	public function create(int $userId, int $albumId, int $rating, string $title, ?string $content): int
	{
		$query = '
			INSERT INTO album_reviews (user_id, album_id, rating, title, content)
			VALUES (:user_id, :album_id, :rating, :title, :content)
		';
		$statement = $this->db->prepare($query);
		$statement->execute([
			'user_id' => $userId,
			'album_id' => $albumId,
			'rating' => $rating,
			'title' => $title,
			'content' => $content,
		]);

		$reviewId = (int) $this->db->lastInsertId();
		$this->refreshAlbumAggregates($albumId);

		return $reviewId;
	}

	public function update(int $id, int $rating, string $title, ?string $content): bool
	{
		$existing = $this->findRawById($id);

		if ($existing === null) {
			return false;
		}

		$query = '
			UPDATE album_reviews
			SET rating = :rating, title = :title, content = :content
			WHERE id = :id
		';

		$statement = $this->db->prepare($query);
		$updated = $statement->execute([
			'id' => $id,
			'rating' => $rating,
			'title' => $title,
			'content' => $content,
		]);

		$this->refreshAlbumAggregates((int) $existing['album_id']);

		return $updated;
	}

	public function delete(int $id): bool
	{
		$existing = $this->findRawById($id);

		if ($existing === null) {
			return false;
		}

		$query = 'DELETE FROM album_reviews WHERE id = :id';
		$statement = $this->db->prepare($query);
		$deleted = $statement->execute(['id' => $id]);

		$this->refreshAlbumAggregates((int) $existing['album_id']);

		return $deleted;
	}

	public function setPinned(int $id, bool $isPinned, int $adminUserId): bool
	{
		$query = '
			UPDATE album_reviews
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

	public function refreshAlbumAggregates(int $albumId): bool
	{
		$aggregateQuery = '
			SELECT
				ROUND(AVG(rating), 2) AS average_rating,
				COUNT(*) AS ratings_count,
				SUM(CASE WHEN content IS NOT NULL AND TRIM(content) <> "" THEN 1 ELSE 0 END) AS reviews_count
			FROM album_reviews
			WHERE album_id = :album_id
		';

		$aggregateStatement = $this->db->prepare($aggregateQuery);
		$aggregateStatement->execute(['album_id' => $albumId]);
		$aggregate = $aggregateStatement->fetch();

		$averageRating = $aggregate['average_rating'] ?? null;
		$ratingsCount = (int) ($aggregate['ratings_count'] ?? 0);
		$reviewsCount = (int) ($aggregate['reviews_count'] ?? 0);

		$updateQuery = '
			UPDATE albums
			SET average_rating = :average_rating,
				ratings_count = :ratings_count,
				reviews_count = :reviews_count
			WHERE id = :album_id
		';

		$updateStatement = $this->db->prepare($updateQuery);
		$updateStatement->bindValue(':album_id', $albumId, PDO::PARAM_INT);
		$updateStatement->bindValue(':ratings_count', $ratingsCount, PDO::PARAM_INT);
		$updateStatement->bindValue(':reviews_count', $reviewsCount, PDO::PARAM_INT);

		if ($averageRating === null) {
			$updateStatement->bindValue(':average_rating', null, PDO::PARAM_NULL);
		} else {
			$updateStatement->bindValue(':average_rating', (float) $averageRating);
		}

		return $updateStatement->execute();
	}
}