<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Review;
use Src\Models\User;

final class AdminController extends ApiController
{
    private User $userModel;
    private Review $reviewModel;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->userModel = new User($db);
        $this->reviewModel = new Review($db);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function listUsers(): array
    {
        return $this->safely(function (): array {
            $user = $this->authenticatedUser();

            if ($user === null) {
                return $this->error('Unauthorized.', 401);
            }

            if (($user['role'] ?? 'user') !== 'admin') {
                return $this->error('Forbidden. Admin only.', 403);
            }

            return $this->success($this->userModel->getAll());
        });
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function deleteCritique(int $critiqueId): array
    {
        return $this->deleteReview($critiqueId);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function deleteReview(int $reviewId): array
    {
        return $this->safely(function () use ($reviewId): array {
            $user = $this->authenticatedUser();

            if ($user === null) {
                return $this->error('Unauthorized.', 401);
            }

            if (($user['role'] ?? 'user') !== 'admin') {
                return $this->error('Forbidden. Admin only.', 403);
            }

            $review = $this->reviewModel->findRawById($reviewId);

            if ($review === null) {
                return $this->error('Review not found.', 404);
            }

            $this->reviewModel->delete($reviewId);

            return $this->success([
                'message' => 'Review deleted by admin.',
            ]);
        });
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function pinCritique(int $critiqueId): array
    {
        return $this->pinReview($critiqueId);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function pinReview(int $reviewId): array
    {
        return $this->safely(function () use ($reviewId): array {
            $user = $this->authenticatedUser();

            if ($user === null) {
                return $this->error('Unauthorized.', 401);
            }

            if (($user['role'] ?? 'user') !== 'admin') {
                return $this->error('Forbidden. Admin only.', 403);
            }

            $review = $this->reviewModel->findRawById($reviewId);

            if ($review === null) {
                return $this->error('Review not found.', 404);
            }

            $data = $this->readJsonBody();

            if (array_key_exists('is_pinned', $data)) {
                $isPinned = filter_var($data['is_pinned'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
                if ($isPinned === null) {
                    return $this->error('is_pinned must be a boolean.', 422);
                }
            } else {
                $isPinned = ((int) $review['is_pinned']) !== 1;
            }

            $this->reviewModel->setPinned($reviewId, (bool) $isPinned, (int) $user['id']);

            $updated = $this->reviewModel->getById($reviewId);

            if ($updated === null) {
                return $this->error('Review not found after pin update.', 404);
            }

            return $this->success($updated);
        });
    }
}
