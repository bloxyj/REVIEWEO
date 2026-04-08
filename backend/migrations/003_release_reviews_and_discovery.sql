-- Adds release-linked reviews and discovery support tables.
-- Run after 001_initial.sql.

CREATE TABLE IF NOT EXISTS album_reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL DEFAULT '',
  content TEXT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  pinned_at TIMESTAMP NULL DEFAULT NULL,
  pinned_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_album_reviews_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_album_reviews_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  CONSTRAINT fk_album_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_album_reviews_pinned_by FOREIGN KEY (pinned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT uk_album_reviews_album_user UNIQUE (album_id, user_id),
  INDEX idx_album_reviews_album_id (album_id),
  INDEX idx_album_reviews_user_id (user_id),
  INDEX idx_album_reviews_is_pinned (is_pinned),
  INDEX idx_album_reviews_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS review_likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  review_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_review_likes_review FOREIGN KEY (review_id) REFERENCES album_reviews(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT uk_review_likes_user_review UNIQUE (user_id, review_id),
  INDEX idx_review_likes_review_id (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;