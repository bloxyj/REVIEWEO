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
  -- Original reviews (kept + polished)
  SELECT 5 AS album_id, 'leSang' AS author_username, 'Still maximalist, still brilliant' AS title, 'Huge arrangements, sharp writing, and a lot of replay value. This one hits different every listen.' AS content, 5 AS rating, 1 AS is_pinned, '2026-01-15 10:30:00' AS pinned_at, 'LeBoss' AS pinned_by_username, '2026-01-15 09:00:00' AS created_at, '2026-01-15 10:30:00' AS updated_at
  UNION ALL SELECT 7, 'leSang', 'Aggressive and focused', 'Industrial textures that still feel fresh and intentional. Best thing they''ve dropped in years.', 4, 0, NULL, NULL, '2026-01-17 08:00:00', '2026-01-17 08:00:00'
  UNION ALL SELECT 8, 'leSang', 'Chaotic but inspired', 'Messy rollout aside, there is a lot of high quality songwriting here. The closer is a straight-up banger.', 4, 0, NULL, NULL, '2026-01-18 14:10:00', '2026-01-18 14:10:00'
  UNION ALL SELECT 10, 'leBoss', 'Personal but limited', 'The concept is clear, but the replay value is low for me. Still respect the vulnerability though.', 2, 0, NULL, NULL, '2026-01-21 16:05:00', '2026-01-21 16:05:00'
  UNION ALL SELECT 11, 'leSang', 'Ambitious with highlights', 'Too long in places, but the best songs are excellent. Needs a tighter edit.', 3, 0, NULL, NULL, '2026-01-22 09:15:00', '2026-01-22 09:15:00'

  -- Additional realistic reviews (more users, more albums, varied opinions)
  UNION ALL SELECT 5, 'LeBoss', 'Instant classic', 'Production is insane. Every track feels like it belongs on a playlist for the next decade.', 5, 0, NULL, NULL, '2026-01-16 11:45:00', '2026-01-16 11:45:00'
  UNION ALL SELECT 7, 'VinylVibe', 'Raw energy done right', 'This is the sound of someone who actually lived it. No filler.', 5, 1, '2026-01-18 14:00:00', 'LoeilDeLynx', '2026-01-18 10:20:00', '2026-01-18 14:00:00'
  UNION ALL SELECT 8, 'BeatExplorer', 'Grew on me massively', 'First listen I was confused. Tenth listen I’m obsessed. That’s how you know it’s good.', 4, 0, NULL, NULL, '2026-01-19 19:30:00', '2026-01-19 19:30:00'
  UNION ALL SELECT 10, 'leSang', 'Beautiful but fragile', 'The intimacy is breathtaking, but it’s the kind of record you can only take in small doses.', 4, 0, NULL, NULL, '2026-01-23 08:50:00', '2026-01-23 08:50:00'
  UNION ALL SELECT 11, 'SoundSculptor', 'Epic but exhausting', 'They went for broke and mostly stuck the landing. A few tracks overstayed their welcome though.', 3, 0, NULL, NULL, '2026-01-24 15:10:00', '2026-01-24 15:10:00'
  UNION ALL SELECT 12, 'LeBoss', 'Summer anthem material', 'This is what peak festival energy sounds like in 2026.', 5, 0, NULL, NULL, '2026-01-25 12:00:00', '2026-01-25 12:00:00'
  UNION ALL SELECT 13, 'VinylVibe', 'Underrated gem', 'Nobody is talking about this enough. Pure songwriting craft.', 4, 0, NULL, NULL, '2026-01-26 09:15:00', '2026-01-26 09:15:00'
  UNION ALL SELECT 5, 'BeatExplorer', 'Still the one to beat', 'Every new release this year is going to be measured against this one.', 5, 0, NULL, NULL, '2026-01-27 20:45:00', '2026-01-27 20:45:00'
  UNION ALL SELECT 7, 'SoundSculptor', 'Dark horse of the year', 'Came out of nowhere and absolutely delivered.', 4, 0, NULL, NULL, '2026-01-28 14:30:00', '2026-01-28 14:30:00'
  UNION ALL SELECT 8, 'leSang', 'Flawed masterpiece', 'There are three songs here that are 10/10. The rest are 7/10. Still an easy buy.', 4, 0, NULL, NULL, '2026-01-29 11:20:00', '2026-01-29 11:20:00'
) AS seed
JOIN albums a ON a.id = seed.album_id
JOIN users author ON author.username = seed.author_username
LEFT JOIN users pin_user ON pin_user.username = seed.pinned_by_username;

-- ======================
-- REVIEW LIKES (realistic counts)
-- ======================
INSERT IGNORE INTO review_likes (review_id, user_id, created_at)
SELECT
  r.id,
  liker.id,
  seed.created_at
FROM (
  -- Likes distributed to create varied counts (0-7 per review)
  SELECT 5 AS album_id, 'lesang' AS author_username, 'LeBoss' AS liker_username, '2026-01-16 08:20:00' AS created_at
  UNION ALL SELECT 5, 'lesang', 'VinylVibe', '2026-01-16 09:15:00'
  UNION ALL SELECT 5, 'lesang', 'BeatExplorer', '2026-01-16 10:05:00'
  UNION ALL SELECT 5, 'lesang', 'SoundSculptor', '2026-01-16 11:30:00'
  UNION ALL SELECT 7, 'lesang', 'LeBoss', '2026-01-17 09:00:00'
  UNION ALL SELECT 7, 'lesang', 'VinylVibe', '2026-01-17 10:20:00'
  UNION ALL SELECT 7, 'lesang', 'BeatExplorer', '2026-01-17 12:45:00'
  UNION ALL SELECT 8, 'lesang', 'LeBoss', '2026-01-18 15:00:00'
  UNION ALL SELECT 8, 'lesang', 'SoundSculptor', '2026-01-18 16:10:00'
  UNION ALL SELECT 10, 'LeBoss', 'LoeilDeLynx', '2026-01-21 18:10:00'
  UNION ALL SELECT 10, 'LeBoss', 'VinylVibe', '2026-01-21 19:00:00'
  UNION ALL SELECT 11, 'lesang', 'LeBoss', '2026-01-22 11:30:00'
  UNION ALL SELECT 11, 'lesang', 'BeatExplorer', '2026-01-22 13:15:00'
  UNION ALL SELECT 11, 'lesang', 'SoundSculptor', '2026-01-22 14:40:00'
  UNION ALL SELECT 5, 'LeBoss', 'VinylVibe', '2026-01-16 13:00:00'      -- extra like on first review
  UNION ALL SELECT 5, 'LeBoss', 'BeatExplorer', '2026-01-16 14:20:00'
  UNION ALL SELECT 7, 'VinylVibe', 'SoundSculptor', '2026-01-17 15:30:00'
  UNION ALL SELECT 8, 'BeatExplorer', 'LeBoss', '2026-01-19 20:00:00'
  UNION ALL SELECT 12, 'LeBoss', 'LoeilDeLynx', '2026-01-25 13:10:00'
  UNION ALL SELECT 12, 'LeBoss', 'VinylVibe', '2026-01-25 14:00:00'
  UNION ALL SELECT 12, 'LeBoss', 'BeatExplorer', '2026-01-25 15:45:00'
  UNION ALL SELECT 13, 'VinylVibe', 'LeBoss', '2026-01-26 10:30:00'
  UNION ALL SELECT 13, 'VinylVibe', 'SoundSculptor', '2026-01-26 11:15:00'
  UNION ALL SELECT 5, 'SoundSculptor', 'LoeilDeLynx', '2026-01-27 21:30:00'
  UNION ALL SELECT 7, 'SoundSculptor', 'BeatExplorer', '2026-01-28 15:00:00'
  UNION ALL SELECT 8, 'SoundSculptor', 'VinylVibe', '2026-01-29 12:00:00'
) AS seed
JOIN albums a ON a.id = seed.album_id
JOIN users author ON author.username = seed.author_username
JOIN album_reviews r ON r.album_id = a.id AND r.user_id = author.id
JOIN users liker ON liker.username = seed.liker_username;

-- ======================
-- REVIEW COMMENTS (new mock data)
-- ======================
INSERT IGNORE INTO review_comments
  (review_id, user_id, content, created_at, updated_at)
SELECT
  r.id,
  commenter.id,
  seed.content,
  seed.created_at,
  seed.created_at
FROM (
  SELECT 5 AS album_id, 'LoeilDeLynx' AS author_username, 'LeBoss' AS commenter_username, 'Completely agree – the production is next level.' AS content, '2026-01-16 09:45:00' AS created_at
  UNION ALL SELECT 5, 'LoeilDeLynx', 'VinylVibe', 'This review convinced me to buy the vinyl edition. Thanks!', '2026-01-16 12:10:00'
  UNION ALL SELECT 7, 'LoeilDeLynx', 'BeatExplorer', 'The industrial textures are insane. You nailed the vibe.', '2026-01-17 10:50:00'
  UNION ALL SELECT 8, 'LoeilDeLynx', 'SoundSculptor', 'Messy rollout but the songwriting carries it hard.', '2026-01-18 16:30:00'
  UNION ALL SELECT 10, 'LeBoss', 'LoeilDeLynx', 'Fair take. The concept is strong but it does feel one-note after a few spins.', '2026-01-21 17:40:00'
  UNION ALL SELECT 11, 'LoeilDeLynx', 'LeBoss', 'Yeah the runtime is the only real flaw. Still 8/10 for me personally.', '2026-01-22 12:20:00'
  UNION ALL SELECT 5, 'LeBoss', 'BeatExplorer', 'This is the album of the year so far. No debate.', '2026-01-16 14:55:00'
  UNION ALL SELECT 7, 'VinylVibe', 'LeBoss', 'Raw energy is exactly right. One of the most exciting releases this month.', '2026-01-18 11:05:00'
  UNION ALL SELECT 12, 'LeBoss', 'VinylVibe', 'Already on repeat. Summer 2026 soundtrack locked in.', '2026-01-25 14:30:00'
  UNION ALL SELECT 13, 'VinylVibe', 'SoundSculptor', 'Underrated is an understatement. This deserves way more love.', '2026-01-26 11:50:00'
  UNION ALL SELECT 8, 'BeatExplorer', 'LoeilDeLynx', 'The closer really is a banger. Spot on.', '2026-01-19 21:15:00'
  UNION ALL SELECT 11, 'SoundSculptor', 'BeatExplorer', 'Epic is the word. A few tracks drag but the highs are massive.', '2026-01-24 16:40:00'
  UNION ALL SELECT 5, 'LoeilDeLynx', 'SoundSculptor', 'Every new album this year is going to be compared to this one.', '2026-01-27 22:10:00'
) AS seed
JOIN albums a ON a.id = seed.album_id
JOIN users author ON author.username = seed.author_username
JOIN album_reviews r ON r.album_id = a.id AND r.user_id = author.id
JOIN users commenter ON commenter.username = seed.commenter_username;