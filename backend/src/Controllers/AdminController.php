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

    public function listUsers(): array
    {
        return $this->safely(function (): array {
            $user = $this->authenticatedUser();
            if ($user === null) return $this->error('Unauthorized.', 401);
            if (($user['role'] ?? 'user') !== 'admin') return $this->error('Forbidden. Admin only.', 403);

            return $this->success($this->userModel->getAll());
        });
    }

    /**
     * Met à jour le rôle d'un utilisateur
     */
    public function updateUserRole(int $userId): array
    {
        return $this->safely(function () use ($userId): array {
            $admin = $this->authenticatedUser();
            if ($admin === null) return $this->error('Unauthorized.', 401);
            if (($admin['role'] ?? 'user') !== 'admin') return $this->error('Forbidden.', 403);

            // SÉCURITÉ : Empêcher l'admin de changer son propre rôle
            if ((int)$admin['id'] === $userId) {
                return $this->error('Forbidden: You cannot change your own role.', 403);
            }

            $targetUser = $this->userModel->findById($userId);
            if (!$targetUser) return $this->error('User not found.', 404);

            // SÉCURITÉ : Protection du compte critique officiel
            if ($targetUser['email'] === 'critique@revieweo.com') {
                return $this->error('Forbidden: Cannot modify official critique.', 403);
            }

            $data = $this->readJsonBody();
            $newRole = $data['role'] ?? null;

            if (!in_array($newRole, ['user', 'critique', 'admin'])) {
                return $this->error('Invalid role value.', 422);
            }

            $this->userModel->updateRole($userId, $newRole);
            return $this->success($this->userModel->findById($userId));
        });
    }

    /**
     * Supprime un utilisateur
     */
    public function deleteUser(int $userId): array
    {
        return $this->safely(function () use ($userId): array {
            $admin = $this->authenticatedUser();
            if ($admin === null) return $this->error('Unauthorized.', 401);
            if (($admin['role'] ?? 'user') !== 'admin') return $this->error('Forbidden.', 403);

            // SÉCURITÉ : Empêcher l'admin de se supprimer lui-même
            if ((int)$admin['id'] === $userId) {
                return $this->error('Forbidden: You cannot delete your own account.', 403);
            }

            $targetUser = $this->userModel->findById($userId);
            if (!$targetUser) return $this->error('User not found.', 404);

            // SÉCURITÉ : Protection du compte critique officiel
            if ($targetUser['email'] === 'critique@revieweo.com') {
                return $this->error('Forbidden: Cannot delete official critique.', 403);
            }

            $this->userModel->delete($userId);
            return $this->success(['message' => 'User deleted successfully.']);
        });
    }

    public function deleteReview(int $reviewId): array
    {
        return $this->safely(function () use ($reviewId): array {
            $user = $this->authenticatedUser();
            if ($user === null) return $this->error('Unauthorized.', 401);
            if (($user['role'] ?? 'user') !== 'admin') return $this->error('Forbidden.', 403);

            $this->reviewModel->delete($reviewId);
            return $this->success(['message' => 'Review deleted by admin.']);
        });
    }

    public function pinReview(int $reviewId): array
    {
        return $this->safely(function () use ($reviewId): array {
            $user = $this->authenticatedUser();
            if ($user === null) return $this->error('Unauthorized.', 401);
            if (($user['role'] ?? 'user') !== 'admin') return $this->error('Forbidden.', 403);

            $data = $this->readJsonBody();
            $isPinned = filter_var($data['is_pinned'] ?? true, FILTER_VALIDATE_BOOLEAN);
            
            $this->reviewModel->setPinned($reviewId, $isPinned, (int)$user['id']);
            return $this->success($this->reviewModel->getById($reviewId));
        });
    }

    public function deleteCritique(int $id): array { return $this->deleteReview($id); }
    public function pinCritique(int $id): array { return $this->pinReview($id); }
}