<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Like;

final class LikeController extends ApiController
{
    private Like $likeModel;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->likeModel = new Like($db);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function toggle(int $reviewId): array
    {
        return $this->safely(function () use ($reviewId): array {
            $user = $this->authenticatedUser();

            if ($user === null) {
                return $this->error('Unauthorized.', 401);
            }

            $result = $this->likeModel->toggle((int) $user['id'], $reviewId);

            if ($result === null) {
                return $this->error('Review not found.', 404);
            }

            return $this->success($result);
        });
    }
}
