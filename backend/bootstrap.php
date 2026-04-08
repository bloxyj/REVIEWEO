<?php

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config/Database.php';

if (class_exists('Dotenv\\Dotenv') && file_exists(__DIR__ . '/.env')) {
    $dotenv = new Dotenv\Dotenv(__DIR__);
    $dotenv->safeLoad();
}

$database = new Database();
$dbConnection = $database->connect();