<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use Src\Controllers\AdminController;
use Src\Controllers\AlbumController;
use Src\Controllers\ArtistController;
use Src\Controllers\AuthController;
use Src\Controllers\ChartController;
use Src\Controllers\CritiqueController;
use Src\Controllers\ImageController;
use Src\Controllers\LikeController;
use Src\Controllers\ReviewController;
use Src\Controllers\SearchController;

applyCorsHeaders();

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (!$dbConnection instanceof PDO) {
    sendJson(500, [
        'success' => false,
        'message' => 'Database connection failed.',
        'help_url' => 'https://github.com/bloxyj/REVIEWEO/issues',
    ]);
    exit;
}

$requestMethod = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$routePath = normalizePath($requestPath);
$segments = $routePath === '' ? [] : explode('/', $routePath);

[$statusCode, $payload] = routeRequest($segments, $requestMethod, $dbConnection);
sendJson($statusCode, $payload);

function routeRequest(array $segments, string $method, PDO $dbConnection): array
{
    if (count($segments) === 0 || $segments[0] === '') {
        return [200, [
            'success' => true,
            'message' => 'YAAY! THE REVIEWEO API is running.',
        ]];
    }

    if ($segments[0] === 'auth') {
        $authController = new AuthController($dbConnection);
        if ($method === 'POST' && ($segments[1] ?? '') === 'register') return $authController->register();
        if ($method === 'POST' && ($segments[1] ?? '') === 'login') return $authController->login();
        if ($method === 'POST' && ($segments[1] ?? '') === 'logout') return $authController->logout();
    }

    if ($segments[0] === 'search' && $method === 'GET') {
        $searchController = new SearchController($dbConnection);
        return $searchController->index();
    }

    if ($segments[0] === 'images' && $method === 'GET') {
        $imageController = new ImageController($dbConnection);

        if (($segments[1] ?? '') === 'albums' && count($segments) === 3 && ctype_digit($segments[2])) {
            return $imageController->album((int) $segments[2]);
        }

        if (($segments[1] ?? '') === 'kanye' && count($segments) === 3) {
            return $imageController->kanye($segments[2]);
        }
    }

    if ($segments[0] === 'charts' && $method === 'GET') {
        $chartController = new ChartController($dbConnection);
        return $chartController->index();
    }

    if ($segments[0] === 'reviews') {
        $reviewController = new ReviewController($dbConnection);
        if ($method === 'GET' && count($segments) === 1) return $reviewController->index();
        if ($method === 'POST' && count($segments) === 1) return $reviewController->store();
        
        if (count($segments) === 2 && ctype_digit($segments[1])) {
            $id = (int) $segments[1];
            if ($method === 'GET') return $reviewController->show($id);
            if ($method === 'PUT') return $reviewController->update($id);
            if ($method === 'DELETE') return $reviewController->destroy($id);
        }
    }

    if ($segments[0] === 'likes' && $method === 'POST' && count($segments) === 2 && ctype_digit($segments[1])) {
        $likeController = new LikeController($dbConnection);
        return $likeController->toggle((int) $segments[1]);
    }

    if ($segments[0] === 'artists') {
        $artistController = new ArtistController($dbConnection);
        if ($method === 'GET' && count($segments) === 1) return $artistController->index();
        if (count($segments) >= 2 && ctype_digit($segments[1])) {
            $id = (int) $segments[1];
            if ($method === 'GET' && count($segments) === 2) return $artistController->show($id);
            if ($method === 'GET' && ($segments[2] ?? '') === 'albums') return $artistController->albums($id);
            if ($method === 'GET' && ($segments[2] ?? '') === 'genres') return $artistController->genres($id);
            if ($method === 'GET' && ($segments[2] ?? '') === 'related') return $artistController->related($id);
            if ($method === 'GET' && ($segments[2] ?? '') === 'top-tracks') return $artistController->topTracks($id);
        }
    }

    if ($segments[0] === 'albums') {
        $albumController = new AlbumController($dbConnection);
        $reviewController = new ReviewController($dbConnection);
        if ($method === 'GET' && count($segments) === 1) return $albumController->index();
        if (count($segments) >= 2 && ctype_digit($segments[1])) {
            $id = (int) $segments[1];
            if ($method === 'GET' && count($segments) === 2) return $albumController->show($id);
            if (count($segments) === 3 && $segments[2] === 'reviews') {
                if ($method === 'GET') return $reviewController->forAlbum($id);
                if ($method === 'POST') return $reviewController->storeForAlbum($id);
            }
            if ($method === 'GET' && ($segments[2] ?? '') === 'tracks') return $albumController->tracks($id);
        }
    }

    if ($segments[0] === 'admin') {
        $adminController = new AdminController($dbConnection);

        if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'users') {
            return $adminController->listUsers();
        }

        if ($method === 'PUT' && count($segments) === 4 && $segments[1] === 'users' && ctype_digit($segments[2]) && $segments[3] === 'role') {
            return $adminController->updateUserRole((int)$segments[2]);
        }

        if ($method === 'DELETE' && count($segments) === 3 && $segments[1] === 'users' && ctype_digit($segments[2])) {
            return $adminController->deleteUser((int)$segments[2]);
        }

        if ($method === 'DELETE' && count($segments) === 3 && $segments[1] === 'reviews' && ctype_digit($segments[2])) {
            return $adminController->deleteReview((int) $segments[2]);
        }

        if ($method === 'POST' && count($segments) === 3 && $segments[1] === 'pin' && ctype_digit($segments[2])) {
            return $adminController->pinReview((int) $segments[2]);
        }
    }

    return [404, [
        'success' => false,
        'message' => 'Route not found.',
    ]];
}

function normalizePath(string $path): string
{
    $normalized = trim($path, '/');
    if ($normalized === 'api') return '';
    if (str_starts_with($normalized, 'api/')) return substr($normalized, 4);
    return $normalized;
}

function applyCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 3600');
    header('Vary: Origin');
}

function sendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}