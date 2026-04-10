# REVIEWEO

REVIEWEO is a full-stack music review platform. It combines an Expo frontend, a PHP REST API, and a MySQL catalog so users can discover artists and albums, publish reviews, like reviews, and explore charts.

## Architecture

- Gateway: Nginx routes browser traffic and `/api/*` requests.
- Frontend: Expo Router app for web and mobile clients.
- Backend: PHP 8.2 REST API with JWT auth and admin moderation routes.
- Database: MySQL 8.4 with SQL migrations.

## Documentation

- Backend API routes: [[backend/README.md]]
- Frontend app routes: [[frontend/README.md]]

## Prerequisites

- Docker with Docker Compose v2 (recommended).
- Node.js 22+ and npm (optional non-Docker frontend run).
- PHP 8.2+ and MySQL 8+ (optional non-Docker backend run).

## Install And Run Everything (Docker)

1. Review root `.env` and set secure values for:

- `MYSQL_ROOT_PASSWORD`
- `MYSQL_PASSWORD`
- `JWT_SECRET`

1. Start all services from the project root:

```bash
docker compose up --build
```

## Database Bootstrap

MySQL auto-runs files from `backend/migrations/` on first initialization of the `mysql_data` volume.

Execution order:

1. `001_initial.sql`
2. `002_seed_music_mock_data.sql`
3. `003_release_reviews_and_discovery.sql`
4. `004_seed_album_reviews_mock_data.sql`

To fully reset local DB state and rerun all migrations:

```bash
docker compose down -v
docker compose up --build
```

## Optional Run Expo for mobile and web

```bash
cd frontend
npm install
npx expo start
```