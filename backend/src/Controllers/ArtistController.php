<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Artist;

final class ArtistController extends ApiController
{
	private const RELEASE_TYPES = [
		'album',
		'live_album',
		'mixtape',
		'ep',
		'single',
		'music_video',
		'dj_mix',
		'appears_on',
		'compilation',
		'bootleg',
		'video',
		'additional',
	];

	private Artist $artistModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->artistModel = new Artist($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function index(): array
	{
		return $this->safely(function (): array {
			return $this->success($this->artistModel->getAll());
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function show(int $artistId): array
	{
		return $this->safely(function () use ($artistId): array {
			$artist = $this->artistModel->getById($artistId);

			if ($artist === null) {
				return $this->error('Artist not found.', 404);
			}

			$artist['aliases'] = $this->artistModel->getAliases($artistId);
			$artist['memberships'] = $this->artistModel->getMemberships($artistId);
			$artist['genres'] = $this->artistModel->getGenres($artistId);
			$artist['related_artists'] = $this->artistModel->getRelatedArtists($artistId);
			$artist['discography_summary'] = $this->artistModel->getDiscographySummary($artistId);

			return $this->success($artist);
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function albums(int $artistId): array
	{
		return $this->safely(function () use ($artistId): array {
			if ($this->artistModel->getById($artistId) === null) {
				return $this->error('Artist not found.', 404);
			}

			$releaseType = isset($_GET['release_type']) ? (string) $_GET['release_type'] : null;
			if ($releaseType !== null && !in_array($releaseType, self::RELEASE_TYPES, true)) {
				return $this->error('Invalid release_type filter.', 422);
			}

			$limit = filter_var($_GET['limit'] ?? 100, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 500) {
				return $this->error('limit must be an integer between 1 and 500.', 422);
			}

			$albums = $this->artistModel->getAlbumsByArtist($artistId, $releaseType, (int) $limit);

			return $this->success($albums);
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function genres(int $artistId): array
	{
		return $this->safely(function () use ($artistId): array {
			if ($this->artistModel->getById($artistId) === null) {
				return $this->error('Artist not found.', 404);
			}

			return $this->success($this->artistModel->getGenres($artistId));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function related(int $artistId): array
	{
		return $this->safely(function () use ($artistId): array {
			if ($this->artistModel->getById($artistId) === null) {
				return $this->error('Artist not found.', 404);
			}

			return $this->success($this->artistModel->getRelatedArtists($artistId));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function topTracks(int $artistId): array
	{
		return $this->safely(function () use ($artistId): array {
			if ($this->artistModel->getById($artistId) === null) {
				return $this->error('Artist not found.', 404);
			}

			$limit = filter_var($_GET['limit'] ?? 15, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 100) {
				return $this->error('limit must be an integer between 1 and 100.', 422);
			}

			return $this->success($this->artistModel->getTopTracks($artistId, (int) $limit));
		});
	}
}
