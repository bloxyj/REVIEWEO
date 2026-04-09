# REVIEWEO

REVIEWEO is a full-stack project with:

- frontend: Expo / React Native
- backend: PHP 8.2 REST API (OOP)
- database: MySQL 8.4

## API implementation status

Implemented backend endpoints:

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/critiques
- GET /api/critiques/{id}
- POST /api/critiques
- PUT /api/critiques/{id}
- DELETE /api/critiques/{id}
- POST /api/likes/{id_critique}
- GET /api/admin/users
- DELETE /api/admin/critiques/{id}
- POST /api/admin/pin/{id}

Auth strategy: JWT Bearer token.

## Start the stack

From project root:

```bash
docker compose up --build
```

Default URLs:

- Nginx gateway: <http://localhost:80> (this is only a gateway for port 80)
- Frontend (Expo web): <http://localhost:19006>
- API base URL from client perspective: <http://localhost/api>

## Database initialization

On a fresh database volume, MySQL now auto-runs migration files from
`backend/migrations/` using `/docker-entrypoint-initdb.d`.

Execution order is filename order:

- `001_initial.sql`
- `002_seed_music_mock_data.sql`
- `003_release_reviews_and_discovery.sql`
- `004_seed_album_reviews_mock_data.sql`

Start the stack as usual:

```bash
docker compose up --build
```

Important:

- Init scripts run only once when `mysql_data` is first created.
- If you already have an existing DB volume, scripts do not rerun automatically.

To fully reinitialize local DB state:

```bash
docker compose down -v
docker compose up --build
```

## Auth usage

1. Register or login to get a token.
2. Send the token in protected requests:

```http
Authorization: Bearer <token>
```

Protected routes:

- POST /api/critiques
- PUT /api/critiques/{id}
- DELETE /api/critiques/{id}
- POST /api/likes/{id_critique}
- all /api/admin/* routes
- POST /api/auth/logout

## Example response

Request:

```http
GET /api/critiques/1
```

This is what the response looks like:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "Inception is a masterpiece",
    "content": "Here is why this movie is amazing...",
    "rating": 5,
    "created_at": "2026-04-07 12:00:00",
    "author": "Josh",
    "likes_count": 10,
    "is_pinned": 0,
    "updated_at": "2026-04-07 12:00:00",
    "user_id": 2
  }
}
```
