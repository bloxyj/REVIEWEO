import { BackNavButton } from '@/components/navigation/BackNavButton';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { getArtist, getArtistAlbums, getArtistTopTracks } from '@/lib/api';
import { getAlbumCoverUri, getArtistPortraitPlaceholder } from '@/lib/placeholders';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { Album, ArtistDetail, ArtistTopTrack } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

function parseId(input: string | string[] | undefined): number | null {
  if (!input) {
    return null;
  }

  const value = Array.isArray(input) ? input[0] : input;
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return null;
  }

  return parsed;
}

function prettifyLabel(value: string): string {
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function ArtistDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const artistId = parseId(params.id);
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const [artist, setArtist] = useState<ArtistDetail | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [topTracks, setTopTracks] = useState<ArtistTopTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summaryEntries = useMemo(() => {
    if (!artist) {
      return [];
    }

    return Object.entries(artist.discography_summary)
      .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== '')
      .map(([key, value]) => ({
        label: prettifyLabel(key),
        value: typeof value === 'number' ? value.toLocaleString() : String(value),
      }));
  }, [artist]);

  const fluidTwoColumnItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeDesktopWidth: '49%',
    nativeTabletWidth: '48.5%',
    nativeMobileWidth: '100%',
  });
  const webFluidTwoColumnItemStyle = Platform.OS === 'web' ? fluidTwoColumnItemStyle : undefined;

  const loadData = useCallback(async () => {
    if (!artistId) {
      setError('Invalid artist id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [artistPayload, albumsPayload, tracksPayload] = await Promise.all([
        getArtist(artistId),
        getArtistAlbums(artistId, { limit: 50 }),
        getArtistTopTracks(artistId, 10),
      ]);

      setArtist(artistPayload);
      setAlbums(albumsPayload);
      setTopTracks(tracksPayload);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load artist details.');
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const mobileRefreshControl =
    Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadData} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      refreshControl={mobileRefreshControl}
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <BackNavButton fallbackHref="/artists" label="Back to artists" />
          {Platform.OS === 'web' ? (
            <AppButton label="Refresh" variant="secondary" size="sm" onPress={loadData} />
          ) : null}
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Loading artist profile</Text>
            <Text style={styles.loadingText}>Gathering albums, context, and top tracks.</Text>
          </View>
        ) : null}

        {!loading && artist ? (
          <>
            <View>
              <View style={[styles.heroCard, isDesktop ? styles.heroDesktop : styles.heroMobile]}>
                <Image
                  source={{ uri: getArtistPortraitPlaceholder(artist.id, artist.name) }}
                  style={[styles.heroImage, isDesktop ? styles.heroImageDesktop : null]}
                  contentFit="cover"
                  transition={shouldReduceMotion ? 0 : 220}
                />

                <View style={styles.heroBody}>
                  <Text style={styles.heroEyebrow}>Artist profile</Text>
                  <Text style={styles.heroTitle}>{artist.name}</Text>

                  <View style={styles.heroMetaStack}>
                    <Text style={styles.heroMetaText}>{artist.followers.toLocaleString()} followers</Text>
                    {artist.current_location ? (
                      <Text style={styles.heroMetaText}>Based in {artist.current_location}</Text>
                    ) : null}
                    {artist.birth_location ? <Text style={styles.heroMetaText}>From {artist.birth_location}</Text> : null}
                    {artist.birth_date ? <Text style={styles.heroMetaText}>Born {artist.birth_date}</Text> : null}
                  </View>

                  {artist.notes ? <Text style={styles.heroNote}>{artist.notes}</Text> : null}

                  {artist.genres.length > 0 ? (
                    <View style={styles.genreRow}>
                      {artist.genres.map((genre) => (
                        <View key={genre.id} style={styles.genreChip}>
                          <Text style={styles.genreChipText}>{genre.name}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text style={styles.heroMuted}>No genres tagged yet.</Text>
                  )}

                  {artist.aliases.length > 0 ? (
                    <Text style={styles.heroMuted}>
                      Also known as {artist.aliases.map((alias) => alias.alias_name).join(', ')}
                    </Text>
                  ) : null}

                  {artist.memberships.length > 0 ? (
                    <Text style={styles.heroMuted}>
                      Member of {artist.memberships.map((membership) => membership.group_name).join(', ')}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Discography summary</Text>
                <Text style={styles.sectionMeta}>Snapshot from catalog metadata</Text>
              </View>

              {summaryEntries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No summary available</Text>
                  <Text style={styles.emptyText}>Discography totals will appear once metadata is enriched.</Text>
                </View>
              ) : (
                <View style={styles.summaryGrid}>
                  {summaryEntries.map((entry, index) => (
                    <View
                      key={entry.label}
                      style={webFluidTwoColumnItemStyle}
                    >
                      <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{entry.label}</Text>
                        <Text style={styles.summaryValue}>{entry.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Albums</Text>
                <Text style={styles.sectionMeta}>{albums.length} releases</Text>
              </View>

              {albums.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No albums found</Text>
                  <Text style={styles.emptyText}>This artist does not have indexed releases yet.</Text>
                </View>
              ) : (
                <View style={styles.albumGrid}>
                  {albums.map((album, index) => (
                    <View
                      key={album.id}
                      style={fluidTwoColumnItemStyle}
                    >
                      <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} asChild>
                        <ScalePressable contentStyle={styles.albumCard}>
                          <Image
                            source={{
                              uri: getAlbumCoverUri({
                                albumId: album.id,
                                title: album.title,
                                artist: album.artist_name,
                                coverImageUrl: album.cover_image_url,
                                coverImage: album.cover_image,
                              }),
                            }}
                            style={styles.albumImage}
                            contentFit="cover"
                            transition={shouldReduceMotion ? 0 : 180}
                          />
                          <View style={styles.albumBody}>
                            <Text numberOfLines={1} style={styles.albumTitle}>
                              {album.title}
                            </Text>
                            <Text style={styles.albumMeta}>
                              {album.release_year} • {album.release_type}
                            </Text>
                            <Text style={styles.albumHint}>Open album</Text>
                          </View>
                        </ScalePressable>
                      </Link>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Top tracks</Text>
                <Text style={styles.sectionMeta}>{topTracks.length} highlights</Text>
              </View>

              {topTracks.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No tracks found</Text>
                  <Text style={styles.emptyText}>Top-track ranking data is not available yet.</Text>
                </View>
              ) : (
                <View style={styles.trackGrid}>
                  {topTracks.map((track, index) => (
                    <View
                      key={track.id}
                      style={fluidTwoColumnItemStyle}
                    >
                      <Link href={{ pathname: '/album/[id]', params: { id: String(track.album_id) } }} asChild>
                        <ScalePressable contentStyle={styles.trackCard}>
                          <Text style={styles.trackTitle}>{track.title}</Text>
                          <Text style={styles.trackMeta}>
                            {track.album_title} • {track.release_year}
                          </Text>
                          <Text style={styles.trackMeta}>
                            {track.listeners_k ? `${track.listeners_k.toLocaleString()}k listeners` : 'No listener count'} •{' '}
                            {track.popularity_score ?? 'n/a'} popularity
                          </Text>
                        </ScalePressable>
                      </Link>
                    </View>
                  ))}
                </View>
              )}
            </View>

            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Related artists</Text>
                <Text style={styles.sectionMeta}>{artist.related_artists.length} connections</Text>
              </View>

              {artist.related_artists.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>No related artists</Text>
                  <Text style={styles.emptyText}>Connections appear as the graph gains more data.</Text>
                </View>
              ) : (
                <View style={styles.relatedGrid}>
                  {artist.related_artists.map((related, index) => (
                    <View
                      key={related.id}
                      style={webFluidTwoColumnItemStyle}
                    >
                      <Link href={{ pathname: '/artist/[id]', params: { id: String(related.id) } }} asChild>
                        <ScalePressable contentStyle={styles.relatedCard}>
                          <Text numberOfLines={1} style={styles.relatedName}>
                            {related.name}
                          </Text>
                          <Text style={styles.relatedMeta}>{related.followers.toLocaleString()} followers</Text>
                        </ScalePressable>
                      </Link>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: DesignTokens.colors.canvas,
  },
  container: {
    alignItems: 'center',
    paddingTop: DesignTokens.spacing.lg,
    paddingBottom: 96,
  },
  content: {
    width: '100%',
    gap: DesignTokens.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.sm,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.dangerSurface,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.dangerSurface,
    padding: DesignTokens.spacing.md,
  },
  errorText: {
    color: DesignTokens.colors.dangerText,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '500',
  },
  loadingState: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 6,
  },
  loadingTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  loadingText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  section: {
    gap: DesignTokens.spacing.md,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  sectionMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.lg,
  },
  heroDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  heroMobile: {
    flexDirection: 'column',
  },
  heroImage: {
    width: '100%',
    aspectRatio: 4 / 5,
    borderRadius: DesignTokens.radius.md,
  },
  heroImageDesktop: {
    width: 320,
  },
  heroBody: {
    flex: 1,
    gap: DesignTokens.spacing.sm,
  },
  heroEyebrow: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  heroTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h1,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  heroMetaStack: {
    gap: 2,
  },
  heroMetaText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
  },
  heroNote: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 21,
  },
  heroMuted: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    lineHeight: 18,
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
  },
  genreChip: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.accentGreenSurface,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.accentGreenSurface,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  genreChipText: {
    color: DesignTokens.colors.accentGreenText,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    minWidth: 150,
    gap: 2,
  },
  summaryLabel: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  summaryValue: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  albumGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  albumCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
  },
  albumImage: {
    width: '100%',
    aspectRatio: 1,
  },
  albumBody: {
    padding: DesignTokens.spacing.md,
    gap: 4,
  },
  albumTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  albumMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  albumHint: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
    marginTop: 2,
  },
  trackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  trackCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: 4,
  },
  trackTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  trackMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  relatedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
  },
  relatedCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 10,
    minWidth: 140,
    gap: 2,
  },
  relatedName: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  relatedMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 6,
  },
  emptyTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  emptyText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
});
