import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { searchCatalog } from '@/lib/api';
import { getAlbumCoverPlaceholder, getArtistPortraitPlaceholder } from '@/lib/placeholders';
import { formatRating } from '@/lib/rating';
import { useResponsiveLayout } from '@/lib/responsive';
import type { SearchResponse, SearchType } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

const SEARCH_TYPES: SearchType[] = ['all', 'artists', 'albums'];

function getEntering(shouldReduceMotion: boolean, delay: number) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return FadeInDown.duration(DesignTokens.motion.durationSlow).delay(delay);
}

function getListEntering(shouldReduceMotion: boolean, baseDelay: number, index: number) {
  if (index >= 8) {
    return undefined;
  }
  return getEntering(shouldReduceMotion, baseDelay + index * DesignTokens.motion.stagger);
}

export default function SearchScreen() {
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const [query, setQuery] = useState('');
  const [type, setType] = useState<SearchType>('all');
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSearch = async () => {
    if (loading) {
      return;
    }

    if (query.trim() === '') {
      setError('Enter a query first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await searchCatalog(query.trim(), type, 30);
      setResult(payload);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Search failed.');
    } finally {
      setLoading(false);
    }
  };

  const cardDimensions = isDesktop
    ? { width: 252, height: 356, mediaHeight: 200, bodyHeight: 156 }
    : isTablet
      ? { width: 236, height: 342, mediaHeight: 190, bodyHeight: 152 }
      : { width: 220, height: 328, mediaHeight: 180, bodyHeight: 148 };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <Animated.View entering={getEntering(shouldReduceMotion, 0)} style={styles.masthead}>
          <Text style={styles.eyebrow}>Lookup</Text>
          <Text style={styles.title}>Search catalog</Text>
          <Text style={styles.subtitle}>Find artists and albums in one pass, then jump straight to detail pages.</Text>

          <View style={styles.searchPanel}>
            <Text style={styles.searchLabel}>Query</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search artists or albums"
              placeholderTextColor={DesignTokens.colors.textMuted}
              accessibilityLabel="Search query"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={onSearch}
              style={styles.input}
            />

            <View style={styles.toggleRow}>
              {SEARCH_TYPES.map((entry) => (
                <LiquidGlassButton
                  key={entry}
                  label={entry}
                  variant="toggle"
                  size="sm"
                  active={entry === type}
                  onPress={() => setType(entry)}
                  accessibilityRole="tab"
                />
              ))}
            </View>

            <LiquidGlassButton
              label={loading ? 'Searching...' : 'Search'}
              variant="primary"
              size="sm"
              onPress={onSearch}
              loading={loading}
            />
          </View>
        </Animated.View>

        {error ? (
          <Animated.View entering={getEntering(shouldReduceMotion, 70)} style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {result ? (
          <>
            <Animated.View entering={getEntering(shouldReduceMotion, 120)} style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Results</Text>
              <Text style={styles.summaryMeta}>
                “{result.query}” in {result.type} • {result.artists.length} artists • {result.albums.length} albums
              </Text>
            </Animated.View>

            <Animated.View entering={getEntering(shouldReduceMotion, 170)} style={styles.section}>
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
                  {result.artists.map((artist, index) => (
                    <Animated.View
                      key={artist.id}
                      entering={getListEntering(shouldReduceMotion, 210, index)}
                    >
                      <Link href={{ pathname: '/artist/[id]', params: { id: String(artist.id) } }} asChild>
                        <ScalePressable
                          contentStyle={[styles.resultCard, { width: cardDimensions.width, height: cardDimensions.height }]}
                        >
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
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>

            <Animated.View entering={getEntering(shouldReduceMotion, 250)} style={styles.section}>
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
                  {result.albums.map((album, index) => (
                    <Animated.View
                      key={album.id}
                      entering={getListEntering(shouldReduceMotion, 290, index)}
                    >
                      <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} asChild>
                        <ScalePressable
                          contentStyle={[styles.resultCard, { width: cardDimensions.width, height: cardDimensions.height }]}
                        >
                          <Image
                            source={{ uri: getAlbumCoverPlaceholder(album.id, album.title, album.artist_name) }}
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
                    </Animated.View>
                  ))}
                </View>
              )}
            </Animated.View>
          </>
        ) : (
          <Animated.View entering={getEntering(shouldReduceMotion, 110)} style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Start with a search query</Text>
            <Text style={styles.emptyText}>Results will populate here after your first search.</Text>
          </Animated.View>
        )}
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
    gap: DesignTokens.spacing.lg,
  },
  masthead: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
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
  searchPanel: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  searchLabel: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surface,
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.sm,
    minHeight: 44,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
    flexWrap: 'wrap',
    marginBottom: DesignTokens.spacing.xs,
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
  summaryCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: 2,
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
