CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'critique', 'admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS critiques (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  category_id INT UNSIGNED NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  is_pinned TINYINT(1) NOT NULL DEFAULT 0,
  pinned_at TIMESTAMP NULL DEFAULT NULL,
  pinned_by_user_id INT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_critiques_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT fk_critiques_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_critiques_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  CONSTRAINT fk_critiques_pinned_by FOREIGN KEY (pinned_by_user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_critiques_created_at (created_at),
  INDEX idx_critiques_is_pinned (is_pinned),
  INDEX idx_critiques_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS likes (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  critique_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_likes_critique FOREIGN KEY (critique_id) REFERENCES critiques(id) ON DELETE CASCADE,
  CONSTRAINT uk_likes_user_critique UNIQUE (user_id, critique_id),
  INDEX idx_likes_critique_id (critique_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS token_blacklist (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  token_jti VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_token_blacklist_expires (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  birth_date DATE NULL,
  birth_location VARCHAR(255) NULL,
  current_location VARCHAR(255) NULL,
  work_location VARCHAR(255) NULL,
  notes TEXT NULL,
  followers INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_artists_followers (followers)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artist_aliases (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artist_id INT UNSIGNED NOT NULL,
  alias_name VARCHAR(150) NOT NULL,
  CONSTRAINT fk_artist_aliases_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT uk_artist_aliases UNIQUE (artist_id, alias_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artist_memberships (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artist_id INT UNSIGNED NOT NULL,
  group_name VARCHAR(150) NOT NULL,
  CONSTRAINT fk_artist_memberships_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT uk_artist_memberships UNIQUE (artist_id, group_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS music_genres (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artist_genres (
  artist_id INT UNSIGNED NOT NULL,
  genre_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (artist_id, genre_id),
  CONSTRAINT fk_artist_genres_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_artist_genres_genre FOREIGN KEY (genre_id) REFERENCES music_genres(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS artist_related (
  artist_id INT UNSIGNED NOT NULL,
  related_artist_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (artist_id, related_artist_id),
  CONSTRAINT fk_artist_related_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT fk_artist_related_related FOREIGN KEY (related_artist_id) REFERENCES artists(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS albums (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artist_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  release_year SMALLINT UNSIGNED NOT NULL,
  release_type ENUM('album','live_album','mixtape','ep','single','music_video','dj_mix','appears_on','compilation','bootleg','video','additional') NOT NULL DEFAULT 'album',
  collaborators VARCHAR(255) NULL,
  cover_image VARCHAR(255) NULL,
  average_rating DECIMAL(3,2) NULL,
  ratings_count INT UNSIGNED NOT NULL DEFAULT 0,
  reviews_count INT UNSIGNED NOT NULL DEFAULT 0,
  issues_count INT UNSIGNED NOT NULL DEFAULT 0,
  is_primary_discography TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_albums_avg_rating CHECK (average_rating IS NULL OR (average_rating >= 0 AND average_rating <= 5)),
  CONSTRAINT fk_albums_artist FOREIGN KEY (artist_id) REFERENCES artists(id) ON DELETE CASCADE,
  CONSTRAINT uk_albums_unique UNIQUE (artist_id, title, release_year, release_type),
  INDEX idx_albums_artist (artist_id),
  INDEX idx_albums_release_type (release_type),
  INDEX idx_albums_release_year (release_year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS album_tracks (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  album_id INT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  track_order SMALLINT UNSIGNED NOT NULL DEFAULT 1,
  popularity_score DECIMAL(2,1) NULL,
  listeners_k INT UNSIGNED NULL,
  has_lyrics TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_album_tracks_album FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE,
  CONSTRAINT uk_album_tracks_unique UNIQUE (album_id, track_order, title),
  INDEX idx_album_tracks_album (album_id),
  INDEX idx_album_tracks_popularity (popularity_score, listeners_k)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Compte Admin (Mdp: password)
INSERT IGNORE INTO users (username, email, password_hash, role) 
VALUES ('LeBoss', 'admin@revieweo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');

-- Compte Critique (Mdp: password)
INSERT IGNORE INTO users (username, email, password_hash, role) 
VALUES ('LoeilDeLynx', 'critique@revieweo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'critique');