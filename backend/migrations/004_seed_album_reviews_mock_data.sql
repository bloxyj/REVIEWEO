-- Mock release-linked review data for local development.
-- Requires schema from 001_initial.sql, catalog seed from 002_seed_music_mock_data.sql,
-- and review tables from 003_release_reviews_and_discovery.sql.

INSERT IGNORE INTO album_reviews
  (album_id, user_id, title, content, rating, is_pinned, pinned_at, pinned_by_user_id, created_at, updated_at)
SELECT
  a.id,
  author.id,
  seed.title,
  seed.content,
  seed.rating,
  seed.is_pinned,
  seed.pinned_at,
  pin_user.id,
  seed.created_at,
  seed.updated_at
FROM (
  SELECT 5 AS album_id, 'LoeilDeLynx' AS author_username, 'Still maximalist, still brilliant' AS title, 'Huge arrangements, sharp writing, and a lot of replay value.' AS content, 5 AS rating, 1 AS is_pinned, '2026-01-15 10:30:00' AS pinned_at, 'LeBoss' AS pinned_by_username, '2026-01-15 09:00:00' AS created_at, '2026-01-15 10:30:00' AS updated_at
  UNION ALL SELECT 7, 'LoeilDeLynx', 'Aggressive and focused', 'Industrial textures that still feel fresh and intentional.', 4, 0, NULL, NULL, '2026-01-17 08:00:00', '2026-01-17 08:00:00'
  UNION ALL SELECT 8, 'LoeilDeLynx', 'Chaotic but inspired', 'Messy rollout aside, there is a lot of high quality songwriting.', 4, 0, NULL, NULL, '2026-01-18 14:10:00', '2026-01-18 14:10:00'
  UNION ALL SELECT 10, 'LeBoss', 'Personal but limited', 'The concept is clear, but the replay value is low for me.', 2, 0, NULL, NULL, '2026-01-21 16:05:00', '2026-01-21 16:05:00'
  UNION ALL SELECT 11, 'LoeilDeLynx', 'Ambitious with highlights', 'Too long in places, but the best songs are excellent.', 3, 0, NULL, NULL, '2026-01-22 09:15:00', '2026-01-22 09:15:00'
) AS seed
JOIN albums a ON a.id = seed.album_id
JOIN users author ON author.username = seed.author_username
LEFT JOIN users pin_user ON pin_user.username = seed.pinned_by_username;

INSERT IGNORE INTO review_likes (review_id, user_id, created_at)
SELECT
  r.id,
  liker.id,
  seed.created_at
FROM (
  SELECT 5 AS album_id, 'LoeilDeLynx' AS author_username, 'LeBoss' AS liker_username, '2026-01-16 08:20:00' AS created_at
  UNION ALL SELECT 7, 'LoeilDeLynx', 'LeBoss', '2026-01-17 09:00:00'
  UNION ALL SELECT 8, 'LoeilDeLynx', 'LeBoss', '2026-01-18 15:00:00'
  UNION ALL SELECT 10, 'LeBoss', 'LoeilDeLynx', '2026-01-21 18:10:00'
  UNION ALL SELECT 11, 'LoeilDeLynx', 'LeBoss', '2026-01-22 11:30:00'
) AS seed
JOIN albums a ON a.id = seed.album_id
JOIN users author ON author.username = seed.author_username
JOIN album_reviews r ON r.album_id = a.id AND r.user_id = author.id
JOIN users liker ON liker.username = seed.liker_username;
