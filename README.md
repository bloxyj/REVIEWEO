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

## Run DB migration

Schema migration file:

- backend/migrations/001_initial.sql

Optional local mock data seed file:

- backend/migrations/002_seed_music_mock_data.sql

Apply schema first:

```bash
docker exec -i revieweo-mysql mysql -u revieweo -previeweo_password revieweo < backend/migrations/001_initial.sql
```

Then load mock data only if you want seeded music content:

```bash
docker exec -i revieweo-mysql mysql -u revieweo -previeweo_password revieweo < backend/migrations/002_seed_music_mock_data.sql
```

```bash
docker exec -i revieweo-mysql mysql -u revieweo -previeweo_password revieweo < backend/migrations/003_release_reviews_and_discovery.sql
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