<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Search;

final class SearchController extends ApiController
{
	private Search $searchModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->searchModel = new Search($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function index(): array
	{
		return $this->safely(function (): array {
			$query = trim((string) ($_GET['q'] ?? ''));
			if ($query === '') {
				return $this->error('q query parameter is required.', 422);
			}

			$type = strtolower(trim((string) ($_GET['type'] ?? 'all')));
			if (!in_array($type, ['all', 'artists', 'albums'], true)) {
				return $this->error('type must be one of: all, artists, albums.', 422);
			}

			$limit = filter_var($_GET['limit'] ?? 20, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 100) {
				return $this->error('limit must be an integer between 1 and 100.', 422);
			}

			$artists = [];
			$albums = [];

			if ($type === 'all' || $type === 'artists') {
				$artists = $this->searchModel->searchArtists($query, (int) $limit);
			}

			if ($type === 'all' || $type === 'albums') {
				$albums = $this->searchModel->searchAlbums($query, (int) $limit);
				$albums = $this->withAlbumCoverUrls($albums);
			}

			return $this->success([
				'query' => $query,
				'type' => $type,
				'artists' => $artists,
				'albums' => $albums,
			]);
		});
	}
}