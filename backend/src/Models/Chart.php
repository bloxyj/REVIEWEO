<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Chart
{
	private PDO $db;

	public function __construct(PDO $db)
	{
		$this->db = $db;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function topRated(
		?int $year = null,
		?string $genre = null,
		?string $releaseType = null,
		int $limit = 50,
		int $minRatings = 1
	): array {
		$query = '
			SELECT
				a.id,
				a.title,
				a.release_year,
				a.release_type,
				a.average_rating,
				a.ratings_count,
				a.reviews_count,
				a.artist_id,
				ar.name AS artist_name,
				GROUP_CONCAT(DISTINCT g.name ORDER BY g.name SEPARATOR ", ") AS genres
			FROM albums a
			INNER JOIN artists ar ON ar.id = a.artist_id
			LEFT JOIN artist_genres ag ON ag.artist_id = ar.id
			LEFT JOIN music_genres g ON g.id = ag.genre_id
			WHERE a.average_rating IS NOT NULL
				AND a.ratings_count >= :min_ratings
		';

		if ($year !== null) {
			$query .= ' AND a.release_year = :year';
		}

		if ($releaseType !== null) {
			$query .= ' AND a.release_type = :release_type';
		}

		if ($genre !== null) {
			$query .= ' AND g.name = :genre';
		}

		$query .= '
			GROUP BY
				a.id,
				a.title,
				a.release_year,
				a.release_type,
				a.average_rating,
				a.ratings_count,
				a.reviews_count,
				a.artist_id,
				ar.name
			ORDER BY
				a.average_rating DESC,
				a.ratings_count DESC,
				a.reviews_count DESC,
				a.release_year DESC,
				a.id DESC
			LIMIT :limit
		';

		$statement = $this->db->prepare($query);
		$statement->bindValue(':min_ratings', $minRatings, PDO::PARAM_INT);

		if ($year !== null) {
			$statement->bindValue(':year', $year, PDO::PARAM_INT);
		}

		if ($releaseType !== null) {
			$statement->bindValue(':release_type', $releaseType, PDO::PARAM_STR);
		}

		if ($genre !== null) {
			$statement->bindValue(':genre', $genre, PDO::PARAM_STR);
		}

		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		$items = $statement->fetchAll();

		foreach ($items as $index => &$item) {
			$item['rank'] = $index + 1;
			$item['genres'] = $item['genres'] === null || trim((string) $item['genres']) === ''
				? []
				: array_values(array_filter(array_map('trim', explode(',', (string) $item['genres']))));
		}

		unset($item);

		return $items;
	}
}