<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Critique;

final class CritiqueController extends ApiController
{
	private Critique $critiqueModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->critiqueModel = new Critique($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function index(): array
	{
		return $this->safely(function (): array {
			return $this->success($this->critiqueModel->getAll());
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function show(int $id): array
	{
		return $this->safely(function () use ($id): array {
			$critique = $this->critiqueModel->getById($id);

			if ($critique === null) {
				return $this->error('Critique not found.', 404);
			}

			return $this->success($critique);
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
			$title = trim((string) ($data['title'] ?? ''));
			$content = trim((string) ($data['content'] ?? ''));
			$rating = filter_var($data['rating'] ?? null, FILTER_VALIDATE_INT);

			if ($title === '' || $content === '' || $rating === false) {
				return $this->error('title, content and rating are required.', 422);
			}

			if ($rating < 1 || $rating > 5) {
				return $this->error('rating must be between 1 and 5.', 422);
			}

			$id = $this->critiqueModel->create((int) $user['id'], $title, $content, (int) $rating);
			$critique = $this->critiqueModel->getById($id);

			if ($critique === null) {
				return $this->error('Critique could not be created.', 500);
			}

			return $this->success($critique, 201);
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

			$existing = $this->critiqueModel->findRawById($id);

			if ($existing === null) {
				return $this->error('Critique not found.', 404);
			}

			$isOwner = (int) $existing['user_id'] === (int) $user['id'];
			$isAdmin = ($user['role'] ?? 'user') === 'admin';

			if (!$isOwner && !$isAdmin) {
				return $this->error('Forbidden.', 403);
			}

			$data = $this->readJsonBody();

			$title = trim((string) ($data['title'] ?? $existing['title']));
			$content = trim((string) ($data['content'] ?? $existing['content']));
			$rating = filter_var($data['rating'] ?? $existing['rating'], FILTER_VALIDATE_INT);

			if ($title === '' || $content === '' || $rating === false) {
				return $this->error('title, content and rating are required.', 422);
			}

			if ($rating < 1 || $rating > 5) {
				return $this->error('rating must be between 1 and 5.', 422);
			}

			$this->critiqueModel->update($id, $title, $content, (int) $rating);

			$updated = $this->critiqueModel->getById($id);

			if ($updated === null) {
				return $this->error('Critique not found after update.', 404);
			}

			return $this->success($updated);
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

			$existing = $this->critiqueModel->findRawById($id);

			if ($existing === null) {
				return $this->error('Critique not found.', 404);
			}

			$isOwner = (int) $existing['user_id'] === (int) $user['id'];
			$isAdmin = ($user['role'] ?? 'user') === 'admin';

			if (!$isOwner && !$isAdmin) {
				return $this->error('Forbidden.', 403);
			}

			$this->critiqueModel->delete($id);

			return $this->success([
				'message' => 'Critique deleted.',
			]);
		});
	}
}
