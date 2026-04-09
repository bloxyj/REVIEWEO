<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Search
{
	private PDO $db;

	public function __construct(PDO $db)
	{
		$this->db = $db;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function searchArtists(string $query, int $limit = 20): array
	{
		$sql = '
			SELECT
				id,
				name,
				birth_location,
				current_location,
				work_location,
				followers,
				created_at
			FROM artists
			WHERE name LIKE :query
			ORDER BY followers DESC, name ASC
			LIMIT :limit
		';

		$statement = $this->db->prepare($sql);
		$statement->bindValue(':query', '%' . $query . '%', PDO::PARAM_STR);
		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function searchAlbums(string $query, int $limit = 20): array
	{
		$sql = '
			SELECT
				a.id,
				a.title,
				a.release_year,
				a.release_type,
				a.cover_image,
				a.average_rating,
				a.ratings_count,
				a.reviews_count,
				a.artist_id,
				ar.name AS artist_name
			FROM albums a
			INNER JOIN artists ar ON ar.id = a.artist_id
			WHERE a.title LIKE :query
				OR ar.name LIKE :query
				OR (a.collaborators IS NOT NULL AND a.collaborators LIKE :query)
			ORDER BY
				CASE WHEN a.title LIKE :starts_with THEN 0 ELSE 1 END,
				a.average_rating DESC,
				a.ratings_count DESC,
				a.release_year DESC,
				a.id DESC
			LIMIT :limit
		';

		$statement = $this->db->prepare($sql);
		$statement->bindValue(':query', '%' . $query . '%', PDO::PARAM_STR);
		$statement->bindValue(':starts_with', $query . '%', PDO::PARAM_STR);
		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function searchTracks(string $query, int $limit = 20): array
	{
		$sql = '
			SELECT
				t.id,
				t.title,
				t.track_order,
				t.popularity_score,
				t.listeners_k,
				t.has_lyrics,
				a.id AS album_id,
				a.title AS album_title,
				a.release_year,
				ar.id AS artist_id,
				ar.name AS artist_name
			FROM album_tracks t
			INNER JOIN albums a ON a.id = t.album_id
			INNER JOIN artists ar ON ar.id = a.artist_id
			WHERE t.title LIKE :query
				OR a.title LIKE :query
				OR ar.name LIKE :query
			ORDER BY
				CASE WHEN t.title LIKE :starts_with THEN 0 ELSE 1 END,
				COALESCE(t.popularity_score, 0) DESC,
				COALESCE(t.listeners_k, 0) DESC,
				a.release_year DESC,
				t.track_order ASC
			LIMIT :limit
		';

		$statement = $this->db->prepare($sql);
		$statement->bindValue(':query', '%' . $query . '%', PDO::PARAM_STR);
		$statement->bindValue(':starts_with', $query . '%', PDO::PARAM_STR);
		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}
}