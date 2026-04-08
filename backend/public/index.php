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

// Application des headers CORS pour autoriser les requêtes du frontend
applyCorsHeaders();

// Gestion des requêtes de pré-vérification (Preflight)
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Vérification de la connexion à la base de données
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

// Lancement du routage
[$statusCode, $payload] = routeRequest($segments, $requestMethod, $dbConnection);
sendJson($statusCode, $payload);

/**
 * Système de routage principal
 */
function routeRequest(array $segments, string $method, PDO $dbConnection): array
{
    // Route par défaut (Ping)
    if (count($segments) === 0 || $segments[0] === '') {
        return [200, [
            'success' => true,
            'message' => 'YAAY! THE REVIEWEO API is running.',
        ]];
    }

    // --- AUTHENTIFICATION ---
    if ($segments[0] === 'auth') {
        $authController = new AuthController($dbConnection);
        if ($method === 'POST' && ($segments[1] ?? '') === 'register') return $authController->register();
        if ($method === 'POST' && ($segments[1] ?? '') === 'login') return $authController->login();
        if ($method === 'POST' && ($segments[1] ?? '') === 'logout') return $authController->logout();
    }

    // --- RECHERCHE ---
    if ($segments[0] === 'search' && $method === 'GET') {
        $searchController = new SearchController($dbConnection);
        return $searchController->index();
    }

    // --- CHARTS ---
    if ($segments[0] === 'charts' && $method === 'GET') {
        $chartController = new ChartController($dbConnection);
        return $chartController->index();
    }

    // --- REVIEWS (PUBLIC) ---
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

    // --- LIKES ---
    if ($segments[0] === 'likes' && $method === 'POST' && count($segments) === 2 && ctype_digit($segments[1])) {
        $likeController = new LikeController($dbConnection);
        return $likeController->toggle((int) $segments[1]);
    }

    // --- ARTISTES ---
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

    // --- ALBUMS ---
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

    // --- ADMINISTRATION (SÉCURISÉ) ---
    if ($segments[0] === 'admin') {
        $adminController = new AdminController($dbConnection);

        // GET /admin/users -> Liste
        if ($method === 'GET' && count($segments) === 2 && $segments[1] === 'users') {
            return $adminController->listUsers();
        }

        // PUT /admin/users/{id}/role -> Changement de rôle
        if ($method === 'PUT' && count($segments) === 4 && $segments[1] === 'users' && ctype_digit($segments[2]) && $segments[3] === 'role') {
            return $adminController->updateUserRole((int)$segments[2]);
        }

        // DELETE /admin/users/{id} -> Suppression utilisateur
        if ($method === 'DELETE' && count($segments) === 3 && $segments[1] === 'users' && ctype_digit($segments[2])) {
            return $adminController->deleteUser((int)$segments[2]);
        }

        // DELETE /admin/reviews/{id} -> Suppression review
        if ($method === 'DELETE' && count($segments) === 3 && $segments[1] === 'reviews' && ctype_digit($segments[2])) {
            return $adminController->deleteReview((int) $segments[2]);
        }

        // POST /admin/pin/{id} -> Épinglage
        if ($method === 'POST' && count($segments) === 3 && $segments[1] === 'pin' && ctype_digit($segments[2])) {
            return $adminController->pinReview((int) $segments[2]);
        }
    }

    // Fallback 404
    return [404, [
        'success' => false,
        'message' => 'Route not found.',
    ]];
}

/**
 * Nettoie le chemin de l'URL pour isoler les segments de l'API
 */
function normalizePath(string $path): string
{
    $normalized = trim($path, '/');
    if ($normalized === 'api') return '';
    if (str_starts_with($normalized, 'api/')) return substr($normalized, 4);
    return $normalized;
}

/**
 * Gère les headers CORS
 */
function applyCorsHeaders(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Content-Type: application/json; charset=UTF-8');
    header('Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
    header('Access-Control-Max-Age: 3600');
    header('Vary: Origin');
}

/**
 * Envoie la réponse finale au format JSON
 */
function sendJson(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
}