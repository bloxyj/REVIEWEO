<?php

declare(strict_types=1);

namespace Src\Core;

use PDO;
use Src\Models\TokenBlacklist;
use Src\Models\User;
use Throwable;

abstract class ApiController
{
    protected PDO $db;
    protected JwtService $jwtService;

    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->jwtService = new JwtService();
    }

    /**
     * @param array<string, mixed> $data
     * @return array{0:int,1:array<string, mixed>}
     */
    protected function success(array $data, int $statusCode = 200): array
    {
        return [$statusCode, [
            'success' => true,
            'data' => $data,
        ]];
    }

    /**
     * @param array<string, mixed> $errors
     * @return array{0:int,1:array<string, mixed>}
     */
    protected function error(string $message, int $statusCode = 400, array $errors = []): array
    {
        $payload = [
            'success' => false,
            'message' => $message,
        ];

        if ($errors !== []) {
            $payload['errors'] = $errors;
        }

        return [$statusCode, $payload];
    }

    /**
     * @return array<string, mixed>
     */
    protected function readJsonBody(): array
    {
        $raw = file_get_contents('php://input');

        if ($raw === false || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (!is_array($decoded)) {
            throw new \InvalidArgumentException('Invalid JSON payload.');
        }

        return $decoded;
    }

    protected function getBearerToken(): ?string
    {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if ($header === '' && function_exists('apache_request_headers')) {
            $headers = apache_request_headers();
            if (is_array($headers)) {
                $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
            }
        }

        if ($header === '' || stripos($header, 'Bearer ') !== 0) {
            return null;
        }

        return trim(substr($header, 7));
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function authenticatedUser(): ?array
    {
        $token = $this->getBearerToken();
        if ($token === null) {
            return null;
        }

        $payload = $this->jwtService->decodeToken($token);
        if ($payload === null) {
            return null;
        }

        $jti = (string) ($payload['jti'] ?? '');
        if ($jti === '') {
            return null;
        }

        $blacklist = new TokenBlacklist($this->db);
        if ($blacklist->isBlacklisted($jti)) {
            return null;
        }

        $userId = (int) ($payload['sub'] ?? 0);
        if ($userId <= 0) {
            return null;
        }

        $userModel = new User($this->db);

        return $userModel->findById($userId);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}|null
     */
    protected function requireAuth(): ?array
    {
        $user = $this->authenticatedUser();

        if ($user === null) {
            return $this->error('Unauthorized.', 401);
        }

        return null;
    }

    /**
     * @return array{0:int,1:array<string,mixed>}|null
     */
    protected function requireAdmin(array $user): ?array
    {
        if (($user['role'] ?? 'user') !== 'admin') {
            return $this->error('Forbidden. Admin only.', 403);
        }

        return null;
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    protected function withAlbumCoverUrl(array $row, string $albumIdKey = 'id'): array
    {
        $coverImage = isset($row['cover_image']) ? trim((string) $row['cover_image']) : '';
        $albumId = (int) ($row[$albumIdKey] ?? 0);

        $row['cover_image_url'] = null;
        if ($coverImage !== '' && $albumId > 0) {
            $row['cover_image_url'] = $this->publicBaseUrl() . '/api/images/albums/' . $albumId;
        }

        return $row;
    }

    /**
     * @param array<int, array<string, mixed>> $rows
     * @return array<int, array<string, mixed>>
     */
    protected function withAlbumCoverUrls(array $rows, string $albumIdKey = 'id'): array
    {
        return array_map(
            fn (array $row): array => $this->withAlbumCoverUrl($row, $albumIdKey),
            $rows
        );
    }

    protected function publicBaseUrl(): string
    {
        $scheme = (string) ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '');
        if ($scheme === '') {
            $https = (string) ($_SERVER['HTTPS'] ?? '');
            $scheme = ($https !== '' && strtolower($https) !== 'off') ? 'https' : 'http';
        }

        $host = (string) ($_SERVER['HTTP_X_FORWARDED_HOST'] ?? ($_SERVER['HTTP_HOST'] ?? 'localhost'));
        if ($host === '') {
            $host = 'localhost';
        }

        return $scheme . '://' . $host;
    }

    /**
     * @template T
     * @param callable():T $callback
     * @return array{0:int,1:array<string,mixed>|list<mixed>|T}
     */
    protected function safely(callable $callback): array
    {
        try {
            $result = $callback();

            if (is_array($result) && isset($result[0], $result[1]) && is_int($result[0])) {
                return $result;
            }

            return [200, [
                'success' => true,
                'data' => $result,
            ]];
        } catch (\InvalidArgumentException $exception) {
            return $this->error($exception->getMessage(), 400);
        } catch (Throwable $exception) {
            return $this->error('Internal server error.', 500);
        }
    }
}
