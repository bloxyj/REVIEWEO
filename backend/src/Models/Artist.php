<?php

declare(strict_types=1);

namespace Src\Models;

use PDO;

final class Artist
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
		$query = '
			SELECT id, name, birth_date, birth_location, current_location, work_location, followers, created_at
			FROM artists
			ORDER BY followers DESC, name ASC
		';
		$statement = $this->db->query($query);

		return $statement->fetchAll();
	}

	/**
	 * @return array<string, mixed>|null
	 */
	public function getById(int $id): ?array
	{
		$query = '
			SELECT id, name, birth_date, birth_location, current_location, work_location, notes, followers, created_at
			FROM artists
			WHERE id = :id
			LIMIT 1
		';
		$statement = $this->db->prepare($query);
		$statement->execute(['id' => $id]);
		$artist = $statement->fetch();

		return $artist === false ? null : $artist;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getAliases(int $artistId): array
	{
		$query = '
			SELECT id, alias_name
			FROM artist_aliases
			WHERE artist_id = :artist_id
			ORDER BY alias_name ASC
		';
		$statement = $this->db->prepare($query);
		$statement->execute(['artist_id' => $artistId]);

		return $statement->fetchAll();
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getMemberships(int $artistId): array
	{
		$query = '
			SELECT id, group_name
			FROM artist_memberships
			WHERE artist_id = :artist_id
			ORDER BY group_name ASC
		';
		$statement = $this->db->prepare($query);
		$statement->execute(['artist_id' => $artistId]);

		return $statement->fetchAll();
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getGenres(int $artistId): array
	{
		$query = '
			SELECT g.id, g.name
			FROM music_genres g
			INNER JOIN artist_genres ag ON ag.genre_id = g.id
			WHERE ag.artist_id = :artist_id
			ORDER BY g.name ASC
		';
		$statement = $this->db->prepare($query);
		$statement->execute(['artist_id' => $artistId]);

		return $statement->fetchAll();
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getRelatedArtists(int $artistId): array
	{
		$query = '
			SELECT a.id, a.name, a.followers
			FROM artists a
			INNER JOIN artist_related ar ON ar.related_artist_id = a.id
			WHERE ar.artist_id = :artist_id
			ORDER BY a.followers DESC, a.name ASC
		';
		$statement = $this->db->prepare($query);
		$statement->execute(['artist_id' => $artistId]);

		return $statement->fetchAll();
	}

	/**
	 * @return array<string, mixed>
	 */
	public function getDiscographySummary(int $artistId): array
	{
		$query = '
			SELECT
				COUNT(*) AS total_releases,
				SUM(CASE WHEN release_type = "album" THEN 1 ELSE 0 END) AS albums,
				SUM(CASE WHEN release_type = "live_album" THEN 1 ELSE 0 END) AS live_albums,
				SUM(CASE WHEN release_type = "mixtape" THEN 1 ELSE 0 END) AS mixtapes,
				SUM(CASE WHEN release_type = "ep" THEN 1 ELSE 0 END) AS eps,
				SUM(CASE WHEN release_type = "single" THEN 1 ELSE 0 END) AS singles,
				SUM(CASE WHEN release_type = "music_video" THEN 1 ELSE 0 END) AS music_videos,
				SUM(CASE WHEN release_type = "dj_mix" THEN 1 ELSE 0 END) AS dj_mixes,
				SUM(CASE WHEN release_type = "appears_on" THEN 1 ELSE 0 END) AS appears_on,
				SUM(CASE WHEN release_type = "compilation" THEN 1 ELSE 0 END) AS compilations,
				SUM(CASE WHEN release_type = "bootleg" THEN 1 ELSE 0 END) AS bootlegs,
				SUM(CASE WHEN release_type = "video" THEN 1 ELSE 0 END) AS videos,
				SUM(CASE WHEN release_type = "additional" THEN 1 ELSE 0 END) AS additional
			FROM albums
			WHERE artist_id = :artist_id
		';
		$statement = $this->db->prepare($query);
		$statement->execute(['artist_id' => $artistId]);
		$summary = $statement->fetch();

		return $summary === false ? [] : $summary;
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getAlbumsByArtist(int $artistId, ?string $releaseType = null, int $limit = 100): array
	{
		$query = '
			SELECT
				id,
				title,
				release_year,
				release_type,
				collaborators,
				average_rating,
				ratings_count,
				reviews_count,
				issues_count
			FROM albums
			WHERE artist_id = :artist_id
		';

		if ($releaseType !== null) {
			$query .= ' AND release_type = :release_type';
		}

		$query .= ' ORDER BY release_year DESC, id DESC LIMIT :limit';

		$statement = $this->db->prepare($query);
		$statement->bindValue(':artist_id', $artistId, PDO::PARAM_INT);
		if ($releaseType !== null) {
			$statement->bindValue(':release_type', $releaseType, PDO::PARAM_STR);
		}
		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}

	/**
	 * @return array<int, array<string, mixed>>
	 */
	public function getTopTracks(int $artistId, int $limit = 15): array
	{
		$query = '
			SELECT
				t.id,
				t.title,
				t.track_order,
				t.popularity_score,
				t.listeners_k,
				a.id AS album_id,
				a.title AS album_title,
				a.release_year
			FROM album_tracks t
			INNER JOIN albums a ON a.id = t.album_id
			WHERE a.artist_id = :artist_id
			ORDER BY t.popularity_score DESC, t.listeners_k DESC, t.id ASC
			LIMIT :limit
		';

		$statement = $this->db->prepare($query);
		$statement->bindValue(':artist_id', $artistId, PDO::PARAM_INT);
		$statement->bindValue(':limit', $limit, PDO::PARAM_INT);
		$statement->execute();

		return $statement->fetchAll();
	}
}
