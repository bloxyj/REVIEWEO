import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { searchCatalog } from '@/lib/api';
import { getAlbumCoverUri, getArtistPortraitPlaceholder } from '@/lib/placeholders';
import { formatRating } from '@/lib/rating';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { SearchResponse, SearchType } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

type SearchBarTextEvent = {
  nativeEvent: {
    text: string;
  };
};

function normalizeSearchType(value: string | string[] | undefined): SearchType {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === 'artists' || raw === 'albums' || raw === 'tracks') {
    return raw;
  }
  return 'all';
}

function normalizeQuery(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw ?? '').trim();
}

export default function SearchScreen() {
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();
  const isIOS = Platform.OS === 'ios';
  const params = useLocalSearchParams<{ q?: string | string[]; type?: string | string[] }>();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('all');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSearchingRef = useRef(false);

  const runSearch = useCallback(
    async (rawQuery: string, nextType: SearchType) => {
      if (isSearchingRef.current) {
        return;
      }

      const nextQuery = rawQuery.trim();
      setQuery(nextQuery);
      setType(nextType);

      if (nextQuery === '') {
        setError('Enter a query first.');
        setResult(null);
        return;
      }

      isSearchingRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const payload = await searchCatalog(nextQuery, nextType, 30);
        setResult(payload);
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Search failed.');
      } finally {
        isSearchingRef.current = false;
        setLoading(false);
      }
    },
    []
  );

  const queryParam = useMemo(() => normalizeQuery(params.q), [params.q]);
  const typeParam = useMemo(() => normalizeSearchType(params.type), [params.type]);

  useEffect(() => {
    if (queryParam === '') {
      return;
    }
    void runSearch(queryParam, typeParam);
  }, [queryParam, typeParam, runSearch]);

  const onNativeSearchChange = useCallback((event: SearchBarTextEvent) => {
    setQuery(event.nativeEvent.text);
  }, []);

  const onNativeSearchSubmit = useCallback(
    (event: SearchBarTextEvent) => {
      void runSearch(event.nativeEvent.text, type);
    },
    [runSearch, type]
  );

  const cardDimensions = isDesktop
    ? { width: 252, height: 356, mediaHeight: 200, bodyHeight: 156 }
    : isTablet
      ? { width: 236, height: 342, mediaHeight: 190, bodyHeight: 152 }
      : { width: 220, height: 328, mediaHeight: 180, bodyHeight: 148 };

  const fluidCardItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeMobileWidth: '100%',
    nativeTabletWidth: cardDimensions.width,
    nativeDesktopWidth: cardDimensions.width,
  });

  const fluidTrackItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeMobileWidth: '100%',
    nativeTabletWidth: 236,
    nativeDesktopWidth: 252,
  });

  return (
    <>
      <Stack.Screen
        options={
          isIOS
            ? {
              title: 'Search',
              headerShadowVisible: false,
              headerSearchBarOptions: {
                placeholder: 'Search songs, artists, albums',
                hideWhenScrolling: false,
                onChangeText: onNativeSearchChange,
                onSearchButtonPress: onNativeSearchSubmit,
                onCancelButtonPress: () => {
                  setQuery('');
                  setResult(null);
                  setError(null);
                },
              },
            }
            : {
              headerShown: false,
            }
        }
      />

      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View>
            <Text style={styles.eyebrow}>Lookup</Text>
            <Text style={styles.title}>Search catalog</Text>
            <Text style={styles.subtitle}></Text>
            {query !== '' ? <Text style={styles.searchHint}>Hit enter to search for “{query}”.</Text> : null}
            {loading ? <Text style={styles.searchHint}>Searching...</Text> : null}
          </View>

          {error ? (
            <View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {result ? (
            <>
              <View>
                <Text style={styles.summaryTitle}>Results</Text>
                <Text style={styles.summaryMeta}>
                  “{result.query}” in {result.type} • {result.tracks.length} songs • {result.artists.length} artists • {result.albums.length} albums
                </Text>
              </View>

              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Artists</Text>
                  <Text style={styles.sectionMeta}>{result.artists.length} matches</Text>
                </View>

                {result.artists.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No artist matches</Text>
                    <Text style={styles.emptyText}>Try a broader query or switch the search type.</Text>
                  </View>
                ) : (
                  <View style={styles.resultGrid}>
                    {result.artists.map((artist) => (
                      <View key={artist.id} style={fluidCardItemStyle}>
                        <Link href={{ pathname: '/artist/[id]', params: { id: String(artist.id) } }} asChild>
                          <ScalePressable contentStyle={[styles.resultCard, { height: cardDimensions.height }]}>
                            <Image
                              source={{ uri: getArtistPortraitPlaceholder(artist.id, artist.name) }}
                              style={[styles.artistImage, { height: cardDimensions.mediaHeight }]}
                              contentFit="cover"
                              transition={shouldReduceMotion ? 0 : 170}
                            />
                            <View style={[styles.resultBody, { height: cardDimensions.bodyHeight }]}>
                              <Text numberOfLines={1} style={styles.resultTitle}>
                                {artist.name}
                              </Text>
                              <Text numberOfLines={1} style={styles.resultMeta}>
                                {artist.followers.toLocaleString()} followers
                              </Text>
                              <Text numberOfLines={1} style={styles.resultHint}>
                                Open artist
                              </Text>
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
                  <Text style={styles.sectionTitle}>Songs</Text>
                  <Text style={styles.sectionMeta}>{result.tracks.length} matches</Text>
                </View>

                {result.tracks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No song matches</Text>
                    <Text style={styles.emptyText}>Try exact titles or switch to all results.</Text>
                  </View>
                ) : (
                  <View style={styles.resultGrid}>
                    {result.tracks.map((track) => (
                      <View key={`${track.album_id}-${track.id}`} style={fluidTrackItemStyle}>
                        <Link href={{ pathname: '/album/[id]', params: { id: String(track.album_id) } }} asChild>
                          <ScalePressable contentStyle={styles.trackCard}>
                            <Text numberOfLines={1} style={styles.resultTitle}>
                              {track.title}
                            </Text>
                            <Text numberOfLines={1} style={styles.resultMeta}>
                              {track.artist_name} • {track.album_title}
                            </Text>
                            <Text numberOfLines={1} style={styles.resultHint}>
                              #{track.track_order} • {track.release_year}
                              {track.popularity_score !== null ? ` • pop ${track.popularity_score}` : ''}
                              {track.listeners_k !== null ? ` • ${track.listeners_k.toLocaleString()}k listeners` : ''}
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
                  <Text style={styles.sectionTitle}>Albums</Text>
                  <Text style={styles.sectionMeta}>{result.albums.length} matches</Text>
                </View>

                {result.albums.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No album matches</Text>
                    <Text style={styles.emptyText}>Try artist names, exact titles, or switch to all results.</Text>
                  </View>
                ) : (
                  <View style={styles.resultGrid}>
                    {result.albums.map((album) => (
                      <View key={album.id} style={fluidCardItemStyle}>
                        <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} asChild>
                          <ScalePressable contentStyle={[styles.resultCard, { height: cardDimensions.height }]}>
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
                              style={[styles.albumImage, { height: cardDimensions.mediaHeight }]}
                              contentFit="cover"
                              transition={shouldReduceMotion ? 0 : 170}
                            />
                            <View style={[styles.resultBody, { height: cardDimensions.bodyHeight }]}>
                              <Text numberOfLines={1} style={styles.resultTitle}>
                                {album.title}
                              </Text>
                              <Text numberOfLines={1} style={styles.resultMeta}>
                                {album.artist_name}
                              </Text>
                              <Text numberOfLines={1} style={styles.resultHint}>
                                {album.release_year} • avg {formatRating(album.average_rating)}
                              </Text>
                            </View>
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
    </>
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
    gap: DesignTokens.spacing.lg,
  },
  eyebrow: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  title: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h1,
    fontWeight: '700',
    letterSpacing: -0.7,
  },
  subtitle: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    lineHeight: 23,
    maxWidth: 760,
  },
  searchHint: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
    marginTop: DesignTokens.spacing.xs,
  },
  errorText: {
    color: DesignTokens.colors.dangerText,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '500',
  },
  summaryTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  summaryMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
  },
  sectionHeader: {
    gap: 2,
  },
  sectionTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  sectionMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
    fontVariant: ['tabular-nums'],
  },
  emptyState: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 4,
  },
  emptyTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '600',
  },
  emptyText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
  },
  resultGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  resultCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
  },
  trackCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: 4,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  artistImage: {
    width: '100%',
  },
  albumImage: {
    width: '100%',
  },
  resultBody: {
    padding: DesignTokens.spacing.md,
    gap: 4,
    justifyContent: 'space-between',
  },
  resultTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  resultMeta: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
  },
  resultHint: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
    marginTop: DesignTokens.spacing.xs,
  },
});
