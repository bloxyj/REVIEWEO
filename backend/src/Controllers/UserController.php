<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;

final class UserController extends ApiController
{
	public function __construct(PDO $db)
	{
		parent::__construct($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function me(): array
	{
		return $this->safely(function (): array {
			$user = $this->authenticatedUser();

			if ($user === null) {
				return $this->error('Unauthorized.', 401);
			}

			return $this->success($user);
		});
	}
}
