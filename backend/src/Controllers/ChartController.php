<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Chart;

final class ChartController extends ApiController
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

	private Chart $chartModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->chartModel = new Chart($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function index(): array
	{
		return $this->safely(function (): array {
			$year = null;
			if (isset($_GET['year'])) {
				$yearValue = filter_var($_GET['year'], FILTER_VALIDATE_INT);
				$currentYear = (int) date('Y') + 1;
				if ($yearValue === false || $yearValue < 1900 || $yearValue > $currentYear) {
					return $this->error('year must be a valid year.', 422);
				}
				$year = (int) $yearValue;
			}

			$genre = isset($_GET['genre']) ? trim((string) $_GET['genre']) : null;
			if ($genre === '') {
				$genre = null;
			}

			$releaseType = isset($_GET['release_type']) ? (string) $_GET['release_type'] : null;
			if ($releaseType !== null && !in_array($releaseType, self::RELEASE_TYPES, true)) {
				return $this->error('Invalid release_type filter.', 422);
			}

			$limit = filter_var($_GET['limit'] ?? 50, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 100) {
				return $this->error('limit must be an integer between 1 and 100.', 422);
			}

			$minRatings = filter_var($_GET['min_ratings'] ?? 1, FILTER_VALIDATE_INT);
			if ($minRatings === false || $minRatings < 1 || $minRatings > 1000000) {
				return $this->error('min_ratings must be an integer between 1 and 1000000.', 422);
			}

			$items = $this->chartModel->topRated(
				$year,
				$genre,
				$releaseType,
				(int) $limit,
				(int) $minRatings
			);

			return $this->success([
				'filters' => [
					'year' => $year,
					'genre' => $genre,
					'release_type' => $releaseType,
					'limit' => (int) $limit,
					'min_ratings' => (int) $minRatings,
				],
				'items' => $items,
			]);
		});
	}
}