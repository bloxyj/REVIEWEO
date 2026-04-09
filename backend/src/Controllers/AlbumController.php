<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Album;

final class AlbumController extends ApiController
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

	private Album $albumModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->albumModel = new Album($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function index(): array
	{
		return $this->safely(function (): array {
			$artistId = null;
			if (isset($_GET['artist_id'])) {
				$artistIdValue = filter_var($_GET['artist_id'], FILTER_VALIDATE_INT);
				if ($artistIdValue === false || $artistIdValue < 1) {
					return $this->error('artist_id must be a positive integer.', 422);
				}
				$artistId = (int) $artistIdValue;
			}

			$releaseType = isset($_GET['release_type']) ? (string) $_GET['release_type'] : null;
			if ($releaseType !== null && !in_array($releaseType, self::RELEASE_TYPES, true)) {
				return $this->error('Invalid release_type filter.', 422);
			}

			$limit = filter_var($_GET['limit'] ?? 100, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 500) {
				return $this->error('limit must be an integer between 1 and 500.', 422);
			}

			$albums = $this->albumModel->getAll($artistId, $releaseType, (int) $limit);

			return $this->success($this->withAlbumCoverUrls($albums));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function show(int $albumId): array
	{
		return $this->safely(function () use ($albumId): array {
			$album = $this->albumModel->getById($albumId);

			if ($album === null) {
				return $this->error('Album not found.', 404);
			}

			return $this->success($this->withAlbumCoverUrl($album));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function tracks(int $albumId): array
	{
		return $this->safely(function () use ($albumId): array {
			$album = $this->albumModel->getById($albumId);

			if ($album === null) {
				return $this->error('Album not found.', 404);
			}

			return $this->success($this->albumModel->getTracks($albumId));
		});
	}
}
