import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { listArtists } from '@/lib/api';
import { getArtistPortraitPlaceholder } from '@/lib/placeholders';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { Artist } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ArtistsScreen() {
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArtists = async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await listArtists();
      setArtists(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load artists.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtists();
  }, []);

  const rankedArtists = useMemo(() => {
    return [...artists].sort((left, right) => right.followers - left.followers);
  }, [artists]);

  const totalFollowers = useMemo(() => {
    return rankedArtists.reduce((sum, artist) => sum + artist.followers, 0);
  }, [rankedArtists]);

  const cardDimensions = isDesktop
    ? { width: 252, height: 356, mediaHeight: 204, bodyHeight: 152 }
    : isTablet
      ? { width: 236, height: 342, mediaHeight: 194, bodyHeight: 148 }
      : { width: 220, height: 328, mediaHeight: 184, bodyHeight: 144 };
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
    Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadArtists} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      refreshControl={mobileRefreshControl}
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.eyebrow}>Catalog</Text>
              <Text style={styles.title}>Artists</Text>
              <Text style={styles.subtitle}>Browse profiles, inspect follow counts, and jump into any artist page.</Text>
            </View>
            {Platform.OS === 'web' ? (
              <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadArtists} />
            ) : null}
          </View>

          <View style={styles.metricRow}>
            <View style={[styles.metricChip, styles.metricChipRose]}>
              <Text style={styles.metricValue}>{rankedArtists.length.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>profiles</Text>
            </View>
            <View style={[styles.metricChip, styles.metricChipGreen]}>
              <Text style={styles.metricValue}>{totalFollowers.toLocaleString()}</Text>
              <Text style={styles.metricLabel}>combined followers</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Loading artists</Text>
            <Text style={styles.loadingText}>Fetching profile details and follower totals.</Text>
          </View>
        ) : null}

        {!loading && !error && rankedArtists.length === 0 ? (
          <View>
            <Text style={styles.emptyTitle}>No artists found</Text>
            <Text style={styles.emptyText}>Artist cards will appear as soon as catalog data is available.</Text>
          </View>
        ) : null}

        {!loading && !error && rankedArtists.length > 0 ? (
          <View style={styles.artistGrid}>
            {rankedArtists.map((artist, index) => (
              <View
                key={artist.id}
                style={fluidCardItemStyle}
              >
                <Link href={{ pathname: '/artist/[id]', params: { id: String(artist.id) } }} asChild>
                  <ScalePressable
                    contentStyle={[styles.artistCard, { height: cardDimensions.height }]}
                  >
                    <Image
                      source={{ uri: getArtistPortraitPlaceholder(artist.id, artist.name) }}
                      style={[styles.artistImage, { height: cardDimensions.mediaHeight }]}
                      contentFit="cover"
                      transition={shouldReduceMotion ? 0 : 180}
                    />
                    <View style={[styles.artistBody, { height: cardDimensions.bodyHeight }]}>
                      <Text numberOfLines={1} style={styles.artistName}>
                        {artist.name}
                      </Text>
                      <Text numberOfLines={1} style={styles.artistFollowers}>
                        {artist.followers.toLocaleString()} followers
                      </Text>
                      <Text numberOfLines={1} style={styles.artistHint}>
                        Open artist profile
                      </Text>
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
    minWidth: 210,
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
    maxWidth: 720,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
  },
  metricChip: {
    borderWidth: 1,
    borderRadius: DesignTokens.radius.md,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    minWidth: 130,
    gap: 2,
  },
  metricChipRose: {
    borderColor: DesignTokens.colors.accentRoseSurface,
    backgroundColor: DesignTokens.colors.accentRoseSurface,
  },
  metricChipGreen: {
    borderColor: DesignTokens.colors.accentGreenSurface,
    backgroundColor: DesignTokens.colors.accentGreenSurface,
  },
  metricValue: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  metricLabel: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '500',
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
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  artistCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
  },
  artistImage: {
    width: '100%',
  },
  artistBody: {
    padding: DesignTokens.spacing.md,
    gap: 3,
    justifyContent: 'space-between',
  },
  artistName: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  artistFollowers: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    fontVariant: ['tabular-nums'],
  },
  artistHint: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
    marginTop: DesignTokens.spacing.xs,
  },
});
