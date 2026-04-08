<?php

declare(strict_types=1);

require_once __DIR__ . '/../bootstrap.php';

use Src\Controllers\AdminController;
use Src\Controllers\AlbumController;
use Src\Controllers\ArtistController;
use Src\Controllers\AuthController;
use Src\Controllers\ChartController;
use Src\Controllers\CritiqueController;
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

        if ($method === 'POST' && ($segments[1] ?? '') === 'register') {
            return $authController->register();
        }

        if ($method === 'POST' && ($segments[1] ?? '') === 'login') {
            return $authController->login();
        }

        if ($method === 'POST' && ($segments[1] ?? '') === 'logout') {
            return $authController->logout();
        }
    }

    if ($segments[0] === 'search' && $method === 'GET') {
        $searchController = new SearchController($dbConnection);

        return $searchController->index();
    }

    if ($segments[0] === 'charts' && $method === 'GET') {
        $chartController = new ChartController($dbConnection);

        return $chartController->index();
    }

    if ($segments[0] === 'reviews') {
        $reviewController = new ReviewController($dbConnection);

        if ($method === 'GET' && count($segments) === 1) {
            return $reviewController->index();
        }

        if ($method === 'POST' && count($segments) === 1) {
            return $reviewController->store();
        }

        if (count($segments) === 2 && ctype_digit($segments[1])) {
            $reviewId = (int) $segments[1];

            if ($method === 'GET') {
                return $reviewController->show($reviewId);
            }

            if ($method === 'PUT') {
                return $reviewController->update($reviewId);
            }

            if ($method === 'DELETE') {
                return $reviewController->destroy($reviewId);
            }
        }
    }

    if ($segments[0] === 'critiques') {
        $critiqueController = new CritiqueController($dbConnection);

        if ($method === 'GET' && count($segments) === 1) {
            return $critiqueController->index();
        }

        if ($method === 'POST' && count($segments) === 1) {
            return $critiqueController->store();
        }

        if (count($segments) === 2 && ctype_digit($segments[1])) {
            $critiqueId = (int) $segments[1];

            if ($method === 'GET') {
                return $critiqueController->show($critiqueId);
            }

            if ($method === 'PUT') {
                return $critiqueController->update($critiqueId);
            }

            if ($method === 'DELETE') {
                return $critiqueController->destroy($critiqueId);
            }
        }
    }

    if ($segments[0] === 'likes' && $method === 'POST' && count($segments) === 2 && ctype_digit($segments[1])) {
        $likeController = new LikeController($dbConnection);

        return $likeController->toggle((int) $segments[1]);
    }

    if ($segments[0] === 'artists') {
        $artistController = new ArtistController($dbConnection);

        if ($method === 'GET' && count($segments) === 1) {
            return $artistController->index();
        }

        if (count($segments) >= 2 && ctype_digit($segments[1])) {
            $artistId = (int) $segments[1];

            if ($method === 'GET' && count($segments) === 2) {
                return $artistController->show($artistId);
            }

            if ($method === 'GET' && count($segments) === 3 && ($segments[2] ?? '') === 'albums') {
                return $artistController->albums($artistId);
            }

            if ($method === 'GET' && count($segments) === 3 && ($segments[2] ?? '') === 'genres') {
                return $artistController->genres($artistId);
            }

            if ($method === 'GET' && count($segments) === 3 && ($segments[2] ?? '') === 'related') {
                return $artistController->related($artistId);
            }

            if ($method === 'GET' && count($segments) === 3 && ($segments[2] ?? '') === 'top-tracks') {
                return $artistController->topTracks($artistId);
            }
        }
    }

    if ($segments[0] === 'albums') {
        $albumController = new AlbumController($dbConnection);
        $reviewController = new ReviewController($dbConnection);

        if ($method === 'GET' && count($segments) === 1) {
            return $albumController->index();
        }

        if (count($segments) >= 2 && ctype_digit($segments[1])) {
            $albumId = (int) $segments[1];

            if ($method === 'GET' && count($segments) === 2) {
                return $albumController->show($albumId);
            }

            if (count($segments) === 3 && ($segments[2] ?? '') === 'reviews') {
                if ($method === 'GET') {
                    return $reviewController->forAlbum($albumId);
                }

                if ($method === 'POST') {
                    return $reviewController->storeForAlbum($albumId);
                }
            }

            if ($method === 'GET' && count($segments) === 3 && ($segments[2] ?? '') === 'tracks') {
                return $albumController->tracks($albumId);
            }
        }
    }

    if ($segments[0] === 'admin') {
        $adminController = new AdminController($dbConnection);

        if ($method === 'GET' && count($segments) === 2 && ($segments[1] ?? '') === 'users') {
            return $adminController->listUsers();
        }

        if ($method === 'DELETE' && count($segments) === 3 && ($segments[1] ?? '') === 'critiques' && ctype_digit($segments[2])) {
            return $adminController->deleteCritique((int) $segments[2]);
        }

        if ($method === 'DELETE' && count($segments) === 3 && ($segments[1] ?? '') === 'reviews' && ctype_digit($segments[2])) {
            return $adminController->deleteReview((int) $segments[2]);
        }

        if ($method === 'POST' && count($segments) === 3 && ($segments[1] ?? '') === 'pin' && ctype_digit($segments[2])) {
            return $adminController->pinCritique((int) $segments[2]);
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

    if ($normalized === 'api') {
        return '';
    }

    if (str_starts_with($normalized, 'api/')) {
        return substr($normalized, 4);
    }

    return $normalized;
}

function applyCorsHeaders(): void
{
    $configuredOrigins = trim((string) (getenv('CORS_ALLOWED_ORIGINS') ?: '*'));
    $requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';

    if ($configuredOrigins === '*') {
        header('Access-Control-Allow-Origin: *');
    } else {
        $allowedOrigins = array_filter(array_map('trim', explode(',', $configuredOrigins)));
        if (in_array($requestOrigin, $allowedOrigins, true)) {
            header('Access-Control-Allow-Origin: ' . $requestOrigin);
            header('Vary: Origin');
        }
    }

    header('Content-Type: application/json; charset=UTF-8');
    header('Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 3600');
}

function sendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE);

    if ($json === false) {
        echo '{"success":false,"message":"JSON encoding error."}';
        return;
    }

    echo $json;
}