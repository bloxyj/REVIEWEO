-- Optional local development seed data for the music catalog.
-- Requires schema from 001_initial.sql.

INSERT IGNORE INTO artists
  (id, name, birth_date, birth_location, current_location, work_location, notes, followers)
VALUES
  (1, 'Kanye West', '1977-06-08', 'Atlanta, GA, United States', 'Beverly Hills, CA, United States', 'Chicago, IL, United States', 'Producer and rapper. Son of Donda West. Founder of GOOD Music, Konman Productions, and YZY.', 135830),
  (2, 'Mike Dean', NULL, 'Angleton, TX, United States', NULL, 'Houston, TX, United States', 'Producer and engineer.', 12000),
  (3, 'Pusha T', NULL, 'The Bronx, NY, United States', NULL, 'Virginia Beach, VA, United States', 'Rapper and songwriter.', 9800),
  (4, 'Travis Scott', NULL, 'Houston, TX, United States', NULL, 'Los Angeles, CA, United States', 'Rapper and producer.', 22000),
  (5, 'Malik Yusef', NULL, 'Chicago, IL, United States', NULL, 'Chicago, IL, United States', 'Poet and songwriter.', 2400),
  (6, 'Jay-Z', NULL, 'Brooklyn, NY, United States', NULL, 'New York, NY, United States', 'Rapper and entrepreneur.', 31000),
  (7, 'Ty Dolla Sign', NULL, 'Los Angeles, CA, United States', NULL, 'Los Angeles, CA, United States', 'Singer and songwriter.', 14500),
  (8, 'Kid Cudi', NULL, 'Cleveland, OH, United States', NULL, 'Los Angeles, CA, United States', 'Rapper and singer.', 18400),
  (9, 'Andre 3000', NULL, 'Atlanta, GA, United States', NULL, 'Atlanta, GA, United States', 'Rapper and musician.', 12000),
  (10, 'Rihanna', NULL, 'Saint Michael, Barbados', NULL, 'Los Angeles, CA, United States', 'Singer and entrepreneur.', 55000);

INSERT IGNORE INTO artist_aliases (artist_id, alias_name) VALUES
  (1, 'Ye'),
  (1, 'Kanye Omari West'),
  (1, 'Donda'),
  (1, 'Yeezy');

INSERT IGNORE INTO artist_memberships (artist_id, group_name) VALUES
  (1, 'Artists for Haiti'),
  (1, 'Child Rebel Soldier'),
  (1, 'The Go Getters'),
  (1, 'The Hitmen'),
  (1, 'KIDS SEE GHOSTS'),
  (1, 'Sunday Service'),
  (1, 'The Throne'),
  (1, 'YS');

INSERT IGNORE INTO music_genres (id, name) VALUES
  (1, 'Pop Rap'),
  (2, 'Hip Hop'),
  (3, 'Experimental Hip Hop'),
  (4, 'Christian Hip Hop'),
  (5, 'Chipmunk Soul'),
  (6, 'Conscious Hip Hop'),
  (7, 'Art Pop'),
  (8, 'Trap'),
  (9, 'Alternative RnB'),
  (10, 'Soul');

INSERT IGNORE INTO artist_genres (artist_id, genre_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5),
  (1, 6),
  (4, 8),
  (10, 7),
  (10, 9);

INSERT IGNORE INTO artist_related (artist_id, related_artist_id) VALUES
  (1, 2),
  (1, 3),
  (1, 4),
  (1, 5);

INSERT IGNORE INTO albums
  (id, artist_id, title, release_year, release_type, collaborators, average_rating, ratings_count, reviews_count, issues_count, is_primary_discography)
VALUES
  (1, 1, 'The College Dropout', 2004, 'album', NULL, 4.15, 74938, 535, 11, 1),
  (2, 1, 'Late Registration', 2005, 'album', NULL, 4.06, 64735, 386, 11, 1),
  (3, 1, 'Graduation', 2007, 'album', NULL, 3.80, 69109, 447, 18, 1),
  (4, 1, '808s and Heartbreak', 2008, 'album', NULL, 3.60, 57107, 379, 12, 1),
  (5, 1, 'My Beautiful Dark Twisted Fantasy', 2010, 'album', NULL, 4.08, 95060, 945, 19, 1),
  (6, 1, 'Watch the Throne', 2011, 'album', 'Jay-Z and Kanye West', 3.11, 35104, 201, 9, 1),
  (7, 1, 'Yeezus', 2013, 'album', NULL, 3.86, 75274, 590, 12, 1),
  (8, 1, 'The Life of Pablo', 2016, 'album', NULL, 3.83, 66208, 429, 8, 1),
  (9, 1, 'Ye', 2018, 'album', NULL, 3.41, 56609, 384, 4, 1),
  (10, 1, 'Jesus Is King', 2019, 'album', NULL, 2.37, 42667, 349, 4, 1),
  (11, 1, 'Donda', 2021, 'album', NULL, 3.23, 44308, 431, 9, 1),
  (12, 1, 'Donda 2', 2022, 'album', NULL, 1.73, 10422, 120, 6, 1),
  (13, 1, 'Vultures', 2024, 'album', 'Kanye West and Ty Dolla Sign', 2.18, 25570, 450, 10, 1),
  (14, 1, 'Vultures 2', 2024, 'album', 'YS', 1.38, 15477, 305, 12, 1),
  (15, 1, 'Bully', 2026, 'album', NULL, 2.74, 8449, 286, 6, 1),
  (16, 1, 'Late Orchestration', 2006, 'live_album', NULL, 3.85, 2880, 30, 3, 1),
  (17, 1, 'Akademiks (Jeanius Level Musik)', 2002, 'mixtape', NULL, 3.23, 46, 1, 0, 1),
  (18, 1, 'Get Well Soon...', 2002, 'mixtape', NULL, 2.99, 310, 1, 0, 1),
  (19, 1, 'Akademiks (Jeanius Level Musik Vol 2)', 2003, 'mixtape', NULL, 3.30, 29, 1, 0, 1),
  (20, 1, 'I''m Good...', 2003, 'mixtape', NULL, 3.11, 227, 0, 0, 1),
  (21, 1, 'Kon the Louis Vuitton Don', 2003, 'mixtape', NULL, 3.08, 144, 0, 0, 1),
  (22, 1, 'Can''t Tell Me Nothing', 2007, 'mixtape', NULL, 3.03, 310, 5, 0, 1),
  (23, 1, 'GOOD Music: Remixed and Unreleased', 2013, 'mixtape', 'J Period and Kanye West', 2.55, 50, 0, 0, 1),
  (24, 1, 'Love Lockdown: Essential 5', 2008, 'ep', NULL, 3.67, 105, 0, 0, 1),
  (25, 1, 'Glow in the Dark', 2009, 'ep', NULL, 3.15, 74, 0, 0, 1),
  (26, 1, 'Dear Donda', 2021, 'ep', NULL, 1.73, 465, 3, 0, 1),
  (27, 1, 'Never Stop', 2025, 'ep', 'King Combs and Ye', 1.32, 1180, 19, 0, 1),
  (28, 1, 'Through the Wire / Two Words', 2003, 'single', NULL, 4.24, 2597, 11, 8, 1),
  (29, 1, 'Stronger', 2007, 'single', NULL, 3.61, 2622, 15, 6, 1),
  (30, 1, 'Flashing Lights', 2007, 'single', NULL, 4.20, 3114, 11, 4, 1),
  (31, 1, 'Power', 2010, 'single', NULL, 4.20, 3585, 17, 2, 1),
  (32, 1, 'Monster', 2010, 'single', NULL, 3.89, 2712, 7, 0, 1),
  (33, 1, 'Devil in a New Dress', 2010, 'single', NULL, 4.25, 2882, 11, 0, 1),
  (34, 1, 'Runaway', 2010, 'single', NULL, 4.30, 5362, 29, 1, 1),
  (35, 1, 'All of the Lights', 2011, 'single', NULL, 4.05, 3315, 16, 1, 1),
  (36, 1, 'Black Skinhead', 2013, 'single', NULL, 4.04, 2737, 10, 0, 1),
  (37, 1, 'No More Parties in L.A.', 2016, 'single', NULL, 4.23, 2583, 5, 1, 1),
  (38, 1, 'Wash Us in the Blood', 2020, 'single', NULL, 3.25, 2522, 12, 1, 1),
  (39, 1, 'Life of the Party', 2021, 'single', 'Kanye West and Andre 3000', 4.16, 2926, 13, 1, 1),
  (40, 1, 'Runaway', 2010, 'music_video', NULL, 4.20, 377, 1, 0, 0),
  (41, 1, 'Bound 2', 2013, 'music_video', NULL, 3.54, 381, 2, 0, 0),
  (42, 1, '24', 2021, 'music_video', NULL, 4.13, 392, 0, 0, 0),
  (43, 1, 'Cousins', 2025, 'music_video', 'Ye', 3.36, 314, 15, 0, 0),
  (44, 1, 'Heil Hitler (Hooligan Version)', 2025, 'music_video', 'Ye', 1.62, 186, 5, 0, 0),
  (45, 1, 'Father', 2026, 'music_video', 'Ye', 3.84, 96, 2, 0, 0),
  (46, 1, 'Welcome to Kanye''s Soul Mix Show', 2006, 'dj_mix', 'Kanye West and DJ A-Trak', 3.82, 284, 2, 0, 0),
  (47, 1, 'Man on the Moon: The End of Day', 2009, 'appears_on', 'Kid Cudi', 3.66, 21212, 139, 9, 0),
  (48, 1, 'Cherry Bomb', 2015, 'appears_on', 'Tyler, The Creator', 2.98, 28976, 216, 13, 0),
  (49, 1, 'At.Long.Last.ASAP', 2015, 'appears_on', 'A$AP Rocky', 3.44, 16603, 84, 5, 0),
  (50, 1, 'Rodeo', 2015, 'appears_on', 'Travis Scott', 3.87, 38177, 253, 7, 0),
  (51, 1, 'Daytona', 2018, 'appears_on', 'Pusha T', 3.84, 33385, 188, 5, 0),
  (52, 1, 'Thriller 40', 2022, 'appears_on', 'Michael Jackson', 3.84, 54, 2, 0, 0),
  (53, 1, 'Now That''s What I Call Music! 27', 2008, 'compilation', NULL, 2.44, 35, 0, 0, 0),
  (54, 1, 'NOW 69', 2008, 'compilation', NULL, 2.54, 46, 1, 0, 0),
  (55, 1, 'The Bling Ring', 2013, 'compilation', 'Motion Picture Soundtrack', 3.38, 92, 0, 0, 0),
  (56, 1, 'We Major / Drive Slow', 2005, 'bootleg', NULL, 4.16, 906, 2, 0, 0),
  (57, 1, '808s and Heartbreak: Live at Hollywood Bowl', 2016, 'bootleg', NULL, 4.17, 1432, 16, 0, 0),
  (58, 1, 'Yandhi', 2019, 'bootleg', NULL, 3.56, 3230, 27, 17, 0),
  (59, 1, 'War', 2025, 'bootleg', 'Kanye West and James Blake', 3.49, 112, 4, 0, 0),
  (60, 1, 'Kanye West VH1 Storytellers', 2010, 'video', NULL, 3.25, 189, 3, 0, 0),
  (61, 1, 'Free Larry Hoover Benefit Concert', 2021, 'video', 'Kanye West and Drake', 3.96, 186, 1, 0, 0),
  (62, 1, 'Donda Experience Performance', 2022, 'video', NULL, 2.07, 393, 16, 0, 0),
  (63, 1, 'YE TY$ KOREA', 2024, 'video', 'YE and TY$', 3.32, 19, 0, 0, 0),
  (64, 1, '"College Dropout" Instrumentals', 2005, 'additional', NULL, 3.90, 201, 0, 0, 0),
  (65, 1, 'Carnival (Instrumental)', 2024, 'additional', 'YS', 2.24, 139, 1, 0, 0),
  (66, 1, 'Carnival (Hooligans Version)', 2024, 'additional', 'YS', 0.91, 123, 1, 0, 0),
  (67, 1, 'Bully (Sampler)', 2025, 'additional', 'Ye', 1.75, 954, 26, 0, 0);

INSERT IGNORE INTO album_tracks
  (id, album_id, title, track_order, popularity_score, listeners_k, has_lyrics)
VALUES
  (1, 34, 'Runaway', 1, 4.6, 12000, 1),
  (2, 31, 'Power', 1, 4.6, 11000, 1),
  (3, 35, 'All of the Lights', 1, 4.4, 11000, 1),
  (4, 33, 'Devil in a New Dress', 1, 4.5, 11000, 1),
  (5, 5, 'Dark Fantasy', 1, 4.4, 11000, 1),
  (6, 32, 'Monster', 1, 4.2, 11000, 1),
  (7, 5, 'Gorgeous', 6, 4.2, 11000, 1),
  (8, 5, 'So Appalled', 9, 3.9, 11000, 1),
  (9, 5, 'Hell of a Life', 10, 3.9, 11000, 1),
  (10, 5, 'Lost in the World', 11, 4.2, 11000, 1),
  (11, 5, 'Blame Game', 7, 3.7, 11000, 1),
  (12, 36, 'Black Skinhead', 1, 4.4, 9000, 1),
  (13, 7, 'On Sight', 1, 4.3, 8000, 1),
  (14, 41, 'Bound 2', 1, 4.4, 8000, 1),
  (15, 7, 'New Slaves', 3, 4.4, 8000, 1),
  (16, 28, 'Through the Wire', 1, 4.2, 7900, 1),
  (17, 29, 'Stronger', 1, 4.0, 8200, 1),
  (18, 30, 'Flashing Lights', 1, 4.2, 8100, 1),
  (19, 37, 'No More Parties in L.A.', 1, 4.2, 7800, 1),
  (20, 39, 'Life of the Party', 1, 4.1, 7600, 1);
