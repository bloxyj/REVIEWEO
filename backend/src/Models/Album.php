<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Album
{
	private PDO $db;

	public function __construct(PDO $db)
	{
		$this->db = $db;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getAll(?int $artistId = null, ?string $releaseType = null, int $limit = 100): array
	{
		$query = '
			SELECT
				a.id,
				a.title,
				a.artist_id,
				ar.name AS artist_name,
				a.release_year,
				a.release_type,
				a.collaborators,
				a.cover_image,
				a.average_rating,
				a.ratings_count,
				a.reviews_count,
				a.issues_count
			FROM albums a
			INNER JOIN artists ar ON ar.id = a.artist_id
			WHERE 1 = 1
		';

		if ($artistId !== null) {
			$query .= ' AND a.artist_id = :artist_id';
		}

		if ($releaseType !== null) {
			$query .= ' AND a.release_type = :release_type';
		}

		$query .= ' ORDER BY a.release_year DESC, a.id DESC LIMIT :limit';

		$statement = $this->db->prepare($query);
		if ($artistId !== null) {
			$statement->bindValue(':artist_id', $artistId, PDO::PARAM_INT);
		}
		if ($releaseType !== null) {
			$statement->bindValue(':release_type', $releaseType, PDO::PARAM_STR);
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
				a.id,
				a.title,
				a.artist_id,
				ar.name AS artist_name,
				a.release_year,
				a.release_type,
				a.collaborators,
				a.cover_image,
				a.average_rating,
				a.ratings_count,
				a.reviews_count,
				a.issues_count,
				a.created_at
			FROM albums a
			INNER JOIN artists ar ON ar.id = a.artist_id
			WHERE a.id = :id
			LIMIT 1
		';

		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$album = $statement->fetch();

		return $album === false ? null : $album;
	}

	public function getCoverImageById(int $id): ?string
	{
		$query = 'SELECT cover_image FROM albums WHERE id = :id LIMIT 1';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$value = $statement->fetchColumn();

		if ($value === false) {
			return null;
		}

		$coverImage = trim((string) $value);
		return $coverImage === '' ? null : $coverImage;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getTracks(int $albumId): array
	{
		$query = '
			SELECT
				id,
				title,
				track_order,
				popularity_score,
				listeners_k,
				has_lyrics
			FROM album_tracks
			WHERE album_id = :album_id
			ORDER BY track_order ASC, id ASC
		';

		$statement = $this->db->prepare($query);
		$statement->execute(['album_id' => $albumId]);

		return $statement->fetchAll();
	}
}
