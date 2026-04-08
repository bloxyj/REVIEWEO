# REVIEWEO Backend API

Base URL:

- <http://localhost/api>

Important:

- Do not use port 3306 for API requests. Port 3306 is MySQL.

## Database Setup

- Base schema: `backend/migrations/001_initial.sql`
- Mock music catalog seed: `backend/migrations/002_seed_music_mock_data.sql`
- Release-linked reviews and likes schema: `backend/migrations/003_release_reviews_and_discovery.sql`
- Mock release-linked reviews and likes seed: `backend/migrations/004_seed_album_reviews_mock_data.sql`

With Docker Compose, MySQL auto-runs all migration files from `backend/migrations/`
on first initialization of the `mysql_data` volume.

Run order is filename order:

1. `001_initial.sql`
2. `002_seed_music_mock_data.sql`
3. `003_release_reviews_and_discovery.sql`
4. `004_seed_album_reviews_mock_data.sql`

Start stack:

```bash
docker compose up --build
```

Important:

- Auto-init scripts run only once for a fresh `mysql_data` volume.
- Existing DB volumes are not reinitialized automatically.

To reset local DB and rerun all migrations:

```bash
docker compose down -v
docker compose up --build
```

To apply only the latest review seed migration on an existing volume:

```bash
docker exec -i revieweo-mysql mysql -u revieweo -previeweo_password revieweo < backend/migrations/004_seed_album_reviews_mock_data.sql
```

## Health

- GET /api

## Authentication

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout (auth required)

## Reviews (release-linked)

- GET /api/reviews
  - Optional query params: album_id, user_id, limit
- GET /api/reviews/{id}
- POST /api/reviews (auth required)
  - Required body: album_id, rating
  - Optional body: title, content
- PUT /api/reviews/{id} (auth required, owner or admin)
- DELETE /api/reviews/{id} (auth required, owner or admin)

## Album Reviews

- GET /api/albums/{id}/reviews
  - Optional query param: limit
- POST /api/albums/{id}/reviews (auth required)
  - Required body: rating
  - Optional body: title, content

## Legacy Critiques

- GET /api/critiques
- GET /api/critiques/{id}
- POST /api/critiques (auth required)
- PUT /api/critiques/{id} (auth required, owner or admin)
- DELETE /api/critiques/{id} (auth required, owner or admin)

These remain available for backward compatibility but are not release-linked.

## Likes

- POST /api/likes/{id_review} (auth required)
  - Toggles the authenticated user's like on a review.

## Admin

- GET /api/admin/users (admin only)
- DELETE /api/admin/reviews/{id} (admin only)
- POST /api/admin/pin/{id} (admin only)

Legacy admin review deletion alias remains available:

- DELETE /api/admin/critiques/{id} (admin only)

## Artists

- GET /api/artists
- GET /api/artists/{id}
- GET /api/artists/{id}/albums
  - Optional query params: release_type, limit
- GET /api/artists/{id}/genres
- GET /api/artists/{id}/related
- GET /api/artists/{id}/top-tracks
  - Optional query param: limit

## Albums

- GET /api/albums
  - Optional query params: artist_id, release_type, limit
- GET /api/albums/{id}
- GET /api/albums/{id}/tracks

## Search

- GET /api/search
  - Required query param: q
  - Optional query params: type (all|artists|albums), limit

## Charts

- GET /api/charts
  - Optional query params: year, genre, release_type, min_ratings, limit
  - Genre filtering is derived from artist genres.

## Allowed release_type values

- album
- live_album
- mixtape
- ep
- single
- music_video
- dj_mix
- appears_on
- compilation
- bootleg
- video
- additional
