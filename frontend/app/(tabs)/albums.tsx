import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { listAlbums } from '@/lib/api';
import { getAlbumCoverUri } from '@/lib/placeholders';
import { formatRating } from '@/lib/rating';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { Album } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AlbumsScreen() {
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadAlbums = async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await listAlbums({ limit: 200 });
      setAlbums(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load albums.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlbums();
  }, []);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    if (normalized === '') {
      return albums;
    }

    return albums.filter(
      (album) =>
        album.title.toLowerCase().includes(normalized) || album.artist_name.toLowerCase().includes(normalized)
    );
  }, [albums, query]);

  const onSubmitFilter = () => {
    setQuery((value) => value.trim());
  };

  const cardDimensions = isDesktop
    ? { width: 280, height: 420, mediaHeight: 220, bodyHeight: 200 }
    : isTablet
      ? { width: 256, height: 396, mediaHeight: 208, bodyHeight: 188 }
      : { width: 232, height: 372, mediaHeight: 196, bodyHeight: 176 };
  const fluidCardItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeMobileWidth: '100%',
    nativeTabletWidth: cardDimensions.width,
    nativeDesktopWidth: cardDimensions.width,
  });

  const mobileRefreshControl =
    Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadAlbums} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      refreshControl={mobileRefreshControl}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Catalog</Text>
              <Text style={styles.title}>Albums</Text>
              <Text style={styles.subtitle}>Filter by title or artist, then open a full album profile with tracks and reviews.</Text>
            </View>
            {Platform.OS === 'web' ? (
              <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadAlbums} />
            ) : null}
          </View>

          <View style={styles.filterCard}>
            <Text style={styles.filterLabel}>Filter by album or artist</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Try title, artist, or both"
              placeholderTextColor={DesignTokens.colors.textMuted}
              accessibilityLabel="Album or artist filter"
              autoCorrect={false}
              returnKeyType="search"
              onSubmitEditing={onSubmitFilter}
              style={styles.input}
            />
            <Text style={styles.filterMeta}>
              Showing {filtered.length.toLocaleString()} of {albums.length.toLocaleString()} albums
            </Text>
          </View>
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Loading albums</Text>
            <Text style={styles.loadingText}>Gathering latest ratings and release metadata.</Text>
          </View>
        ) : null}

        {!loading && !error && filtered.length === 0 ? (
          <View>
            <Text style={styles.emptyTitle}>No albums found</Text>
            <Text style={styles.emptyText}>Try a shorter query or clear filters to browse the full catalog.</Text>
          </View>
        ) : null}

        {!loading && !error && filtered.length > 0 ? (
          <View style={styles.albumGrid}>
            {filtered.map((album, index) => (
              <View
                key={album.id}
                style={fluidCardItemStyle}
              >
                <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} asChild>
                  <ScalePressable
                    contentStyle={[styles.albumCard, { height: cardDimensions.height }]}
                  >
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
                      transition={shouldReduceMotion ? 0 : 190}
                    />
                    <View style={[styles.albumBody, { height: cardDimensions.bodyHeight }]}>
                      <Text numberOfLines={2} style={styles.albumTitle}>
                        {album.title}
                      </Text>
                      <Text numberOfLines={1} style={styles.albumArtist}>
                        {album.artist_name}
                      </Text>
                      <Text numberOfLines={1} style={styles.albumMeta}>
                        {album.release_year} • {album.release_type}
                      </Text>

                      <View style={styles.statRow}>
                        <View style={[styles.statChip, styles.statChipBlue]}>
                          <Text numberOfLines={1} style={styles.statLabel}>
                            Average
                          </Text>
                          <Text numberOfLines={1} style={styles.statValue}>
                            {formatRating(album.average_rating)}
                          </Text>
                        </View>
                        <View style={[styles.statChip, styles.statChipGreen]}>
                          <Text numberOfLines={1} style={styles.statLabel}>
                            Ratings
                          </Text>
                          <Text numberOfLines={1} style={styles.statValue}>
                            {album.ratings_count.toLocaleString()}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </ScalePressable>
                </Link>
              </View>
            ))}
          </View>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.sm,
    flexWrap: 'wrap',
  },
  headerCopy: {
    gap: 4,
    flex: 1,
    minWidth: 220,
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
  filterCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  filterLabel: {
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
  filterMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontVariant: ['tabular-nums'],
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
    gap: 4,
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
  },
  albumBody: {
    padding: DesignTokens.spacing.md,
    gap: 4,
    justifyContent: 'space-between',
  },
  albumTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  albumArtist: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '500',
  },
  albumMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.xs,
  },
  statChip: {
    flex: 1,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 6,
    minWidth: 0,
    gap: 2,
  },
  statChipBlue: {
    borderColor: DesignTokens.colors.accentBlueSurface,
    backgroundColor: DesignTokens.colors.accentBlueSurface,
  },
  statChipGreen: {
    borderColor: DesignTokens.colors.accentGreenSurface,
    backgroundColor: DesignTokens.colors.accentGreenSurface,
  },
  statLabel: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  statValue: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
});
