<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Review;

final class ReviewController extends ApiController
{
	private Review $reviewModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->reviewModel = new Review($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function index(): array
	{
		return $this->safely(function (): array {
			$albumId = null;
			if (isset($_GET['album_id'])) {
				$albumIdValue = filter_var($_GET['album_id'], FILTER_VALIDATE_INT);
				if ($albumIdValue === false || $albumIdValue < 1) {
					return $this->error('album_id must be a positive integer.', 422);
				}
				$albumId = (int) $albumIdValue;
			}

			$userId = null;
			if (isset($_GET['user_id'])) {
				$userIdValue = filter_var($_GET['user_id'], FILTER_VALIDATE_INT);
				if ($userIdValue === false || $userIdValue < 1) {
					return $this->error('user_id must be a positive integer.', 422);
				}
				$userId = (int) $userIdValue;
			}

			$limit = filter_var($_GET['limit'] ?? 100, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 500) {
				return $this->error('limit must be an integer between 1 and 500.', 422);
			}

			$reviews = $this->reviewModel->getAll($albumId, $userId, (int) $limit);

			return $this->success($this->withAlbumCoverUrls($reviews, 'album_id'));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function forAlbum(int $albumId): array
	{
		return $this->safely(function () use ($albumId): array {
			if (!$this->reviewModel->albumExists($albumId)) {
				return $this->error('Album not found.', 404);
			}

			$limit = filter_var($_GET['limit'] ?? 100, FILTER_VALIDATE_INT);
			if ($limit === false || $limit < 1 || $limit > 500) {
				return $this->error('limit must be an integer between 1 and 500.', 422);
			}

			$reviews = $this->reviewModel->getAll($albumId, null, (int) $limit);

			return $this->success($this->withAlbumCoverUrls($reviews, 'album_id'));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function show(int $id): array
	{
		return $this->safely(function () use ($id): array {
			$review = $this->reviewModel->getById($id);

			if ($review === null) {
				return $this->error('Review not found.', 404);
			}

			return $this->success($this->withAlbumCoverUrl($review, 'album_id'));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function store(): array
	{
		return $this->safely(function (): array {
			$user = $this->authenticatedUser();

			if ($user === null) {
				return $this->error('Unauthorized.', 401);
			}

			$data = $this->readJsonBody();
			$albumIdValue = filter_var($data['album_id'] ?? null, FILTER_VALIDATE_INT);
			$rating = filter_var($data['rating'] ?? null, FILTER_VALIDATE_INT);
			$title = trim((string) ($data['title'] ?? ''));
			$content = array_key_exists('content', $data) ? trim((string) $data['content']) : '';

			if ($albumIdValue === false || $albumIdValue < 1 || $rating === false) {
				return $this->error('album_id and rating are required.', 422);
			}

			if ($rating < 1 || $rating > 5) {
				return $this->error('rating must be between 1 and 5.', 422);
			}

			$albumId = (int) $albumIdValue;
			$userId = (int) $user['id'];

			if (!$this->reviewModel->albumExists($albumId)) {
				return $this->error('Album not found.', 404);
			}

			if ($this->reviewModel->findRawByAlbumAndUser($albumId, $userId) !== null) {
				return $this->error('You already reviewed this album.', 409);
			}

			$reviewId = $this->reviewModel->create(
				$userId,
				$albumId,
				(int) $rating,
				$title,
				$content === '' ? null : $content
			);

			$review = $this->reviewModel->getById($reviewId);

			if ($review === null) {
				return $this->error('Review could not be created.', 500);
			}

			return $this->success($this->withAlbumCoverUrl($review, 'album_id'), 201);
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function storeForAlbum(int $albumId): array
	{
		return $this->safely(function () use ($albumId): array {
			$user = $this->authenticatedUser();

			if ($user === null) {
				return $this->error('Unauthorized.', 401);
			}

			if (!$this->reviewModel->albumExists($albumId)) {
				return $this->error('Album not found.', 404);
			}

			$data = $this->readJsonBody();
			$rating = filter_var($data['rating'] ?? null, FILTER_VALIDATE_INT);
			$title = trim((string) ($data['title'] ?? ''));
			$content = array_key_exists('content', $data) ? trim((string) $data['content']) : '';

			if ($rating === false) {
				return $this->error('rating is required.', 422);
			}

			if ($rating < 1 || $rating > 5) {
				return $this->error('rating must be between 1 and 5.', 422);
			}

			$userId = (int) $user['id'];

			if ($this->reviewModel->findRawByAlbumAndUser($albumId, $userId) !== null) {
				return $this->error('You already reviewed this album.', 409);
			}

			$reviewId = $this->reviewModel->create(
				$userId,
				$albumId,
				(int) $rating,
				$title,
				$content === '' ? null : $content
			);

			$review = $this->reviewModel->getById($reviewId);

			if ($review === null) {
				return $this->error('Review could not be created.', 500);
			}

			return $this->success($this->withAlbumCoverUrl($review, 'album_id'), 201);
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function update(int $id): array
	{
		return $this->safely(function () use ($id): array {
			$user = $this->authenticatedUser();

			if ($user === null) {
				return $this->error('Unauthorized.', 401);
			}

			$existing = $this->reviewModel->findRawById($id);

			if ($existing === null) {
				return $this->error('Review not found.', 404);
			}

			$isOwner = (int) $existing['user_id'] === (int) $user['id'];
			$isAdmin = ($user['role'] ?? 'user') === 'admin';

			if (!$isOwner && !$isAdmin) {
				return $this->error('Forbidden.', 403);
			}

			$data = $this->readJsonBody();
			$rating = filter_var($data['rating'] ?? $existing['rating'], FILTER_VALIDATE_INT);
			$title = trim((string) ($data['title'] ?? $existing['title']));

			$contentSource = array_key_exists('content', $data)
				? (string) $data['content']
				: (string) ($existing['content'] ?? '');
			$content = trim($contentSource);

			if ($rating === false) {
				return $this->error('rating is required.', 422);
			}

			if ($rating < 1 || $rating > 5) {
				return $this->error('rating must be between 1 and 5.', 422);
			}

			$this->reviewModel->update(
				$id,
				(int) $rating,
				$title,
				$content === '' ? null : $content
			);

			$updated = $this->reviewModel->getById($id);

			if ($updated === null) {
				return $this->error('Review not found after update.', 404);
			}

			return $this->success($this->withAlbumCoverUrl($updated, 'album_id'));
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function destroy(int $id): array
	{
		return $this->safely(function () use ($id): array {
			$user = $this->authenticatedUser();

			if ($user === null) {
				return $this->error('Unauthorized.', 401);
			}

			$existing = $this->reviewModel->findRawById($id);

			if ($existing === null) {
				return $this->error('Review not found.', 404);
			}

			$isOwner = (int) $existing['user_id'] === (int) $user['id'];
			$isAdmin = ($user['role'] ?? 'user') === 'admin';

			if (!$isOwner && !$isAdmin) {
				return $this->error('Forbidden.', 403);
			}

			$this->reviewModel->delete($id);

			return $this->success([
				'message' => 'Review deleted.',
			]);
		});
	}
}