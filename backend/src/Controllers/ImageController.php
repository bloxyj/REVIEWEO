<?php

declare(strict_types=1);

namespace Src\Controllers;

use PDO;
use Src\Core\ApiController;
use Src\Models\Album;

final class ImageController extends ApiController
{
    private string $kanyeDir;
    private Album $albumModel;

    public function __construct(PDO $db)
    {
        parent::__construct($db);
        $this->albumModel = new Album($db);
        $resolvedKanyeDir = realpath(__DIR__ . '/../../public/imgs/kanye');
        $this->kanyeDir = $resolvedKanyeDir === false ? '' : $resolvedKanyeDir;
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function album(int $albumId): array
    {
        $album = $this->albumModel->getById($albumId);
        if ($album === null) {
            return $this->error('Album not found.', 404);
        }

        $coverImage = trim((string) ($album['cover_image'] ?? ''));
        if ($coverImage === '') {
            return $this->error('Album cover not configured.', 404);
        }

        return $this->serveKanyeCover($coverImage);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    public function kanye(string $filename): array
    {
        return $this->serveKanyeCover($filename);
    }

    /**
     * @return array{0:int,1:array<string,mixed>}
     */
    private function serveKanyeCover(string $filename): array
    {
        if ($this->kanyeDir === '') {
            return $this->error('Image storage is not available.', 500);
        }

        $safeFilename = $this->sanitizeFilename($filename);
        if ($safeFilename === null) {
            return $this->error('Invalid image filename.', 400);
        }

        $requestedPath = $this->kanyeDir . DIRECTORY_SEPARATOR . $safeFilename;
        $resolvedPath = realpath($requestedPath);

        if (
            $resolvedPath === false
            || !str_starts_with($resolvedPath, $this->kanyeDir . DIRECTORY_SEPARATOR)
            || !is_file($resolvedPath)
        ) {
            return $this->error('Image not found.', 404);
        }

        if (strtolower((string) pathinfo($resolvedPath, PATHINFO_EXTENSION)) !== 'webp') {
            return $this->error('Unsupported image format.', 415);
        }

        if (!$this->streamImage($resolvedPath)) {
            return $this->error('Image could not be read.', 500);
        }

        return $this->error('Image streaming failed.', 500);
    }

    private function sanitizeFilename(string $filename): ?string
    {
        $name = trim($filename);
        if ($name === '' || str_contains($name, '/') || str_contains($name, '\\')) {
            return null;
        }

        if (!preg_match('/^[a-z0-9][a-z0-9._-]*\.webp$/i', $name)) {
            return null;
        }

        return $name;
    }

    private function streamImage(string $path): bool
    {
        $size = filesize($path);
        if ($size === false) {
            return false;
        }

        http_response_code(200);
        header('Content-Type: image/webp');
        header('Content-Length: ' . (string) $size);
        header('Cache-Control: public, max-age=31536000, immutable');
        header('Content-Disposition: inline; filename="' . basename($path) . '"');

        if (readfile($path) === false) {
            return false;
        }

        exit;
    }
}
