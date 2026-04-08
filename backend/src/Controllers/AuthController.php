<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\TokenBlacklist;
use Src\Models\User;

final class AuthController extends ApiController
{
	private User $userModel;

	public function __construct(PDO $db)
	{
		parent::__construct($db);
		$this->userModel = new User($db);
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function register(): array
	{
		return $this->safely(function (): array {
			$data = $this->readJsonBody();

			$username = trim((string) ($data['username'] ?? ''));
			$email = strtolower(trim((string) ($data['email'] ?? '')));
			$password = (string) ($data['password'] ?? '');

			if ($username === '' || $email === '' || $password === '') {
				return $this->error('username, email and password are required.', 422);
			}

			if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
				return $this->error('Invalid email address.', 422);
			}

			if (strlen($password) < 6) {
				return $this->error('Password must be at least 6 characters.', 422);
			}

			if ($this->userModel->findByUsername($username) !== null) {
				return $this->error('Username is already taken.', 409);
			}

			if ($this->userModel->findByEmail($email) !== null) {
				return $this->error('Email is already registered.', 409);
			}

			$passwordHash = password_hash($password, PASSWORD_DEFAULT);
			$user = $this->userModel->create($username, $email, $passwordHash);

			if ($user === null) {
				return $this->error('User could not be created.', 500);
			}

			$tokenData = $this->jwtService->generateToken([
				'sub' => (int) $user['id'],
				'role' => (string) ($user['role'] ?? 'user'),
			]);

			return $this->success([
				'token' => $tokenData['token'],
				'expires_in' => $tokenData['expires_in'],
				'user' => $user,
			], 201);
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function login(): array
	{
		return $this->safely(function (): array {
			$data = $this->readJsonBody();

			$email = strtolower(trim((string) ($data['email'] ?? '')));
			$password = (string) ($data['password'] ?? '');

			if ($email === '' || $password === '') {
				return $this->error('email and password are required.', 422);
			}

			$userWithPassword = $this->userModel->findByEmail($email);

			if ($userWithPassword === null) {
				return $this->error('Invalid credentials.', 401);
			}

			if (!password_verify($password, (string) $userWithPassword['password_hash'])) {
				return $this->error('Invalid credentials.', 401);
			}

			$tokenData = $this->jwtService->generateToken([
				'sub' => (int) $userWithPassword['id'],
				'role' => (string) ($userWithPassword['role'] ?? 'user'),
			]);

			$user = [
				'id' => (int) $userWithPassword['id'],
				'username' => (string) $userWithPassword['username'],
				'email' => (string) $userWithPassword['email'],
				'role' => (string) $userWithPassword['role'],
				'created_at' => (string) $userWithPassword['created_at'],
			];

			return $this->success([
				'token' => $tokenData['token'],
				'expires_in' => $tokenData['expires_in'],
				'user' => $user,
			]);
		});
	}

	/**
	 * @return array{0:int,1:array<string,mixed>}
	 */
	public function logout(): array
	{
		return $this->safely(function (): array {
			$token = $this->getBearerToken();

			if ($token === null) {
				return $this->error('Unauthorized.', 401);
			}

			$payload = $this->jwtService->decodeToken($token, false);

			if ($payload === null) {
				return $this->error('Invalid token.', 401);
			}

			$jti = (string) ($payload['jti'] ?? '');
			$exp = (int) ($payload['exp'] ?? 0);

			if ($jti !== '' && $exp > 0) {
				$blacklist = new TokenBlacklist($this->db);
				$blacklist->add($jti, date('Y-m-d H:i:s', $exp));
			}

			return $this->success([
				'message' => 'Logged out successfully.',
			]);
		});
	}
}
