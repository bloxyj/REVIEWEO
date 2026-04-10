import { useQuery } from '@tanstack/react-query';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { listAlbums, listArtists, listReviews } from '@/lib/api';
import { getAlbumCoverUri, getArtistPortraitPlaceholder, getUserAvatarPlaceholder } from '@/lib/placeholders';
import { formatRating, toNumericRating } from '@/lib/rating';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { Album, Artist, Review } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useMemo } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

function formatCompactCount(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K`;
  }
  return value.toString();
}

type HomeFeedPayload = {
  albums: Album[];
  artists: Artist[];
  reviews: Review[];
};

const EMPTY_ALBUMS: Album[] = [];
const EMPTY_ARTISTS: Artist[] = [];
const EMPTY_REVIEWS: Review[] = [];

export default function HomeScreen() {
  const { session, clearSession } = useAuth();
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const homeFeedQuery = useQuery<HomeFeedPayload>({
    queryKey: ['home-feed'],
    queryFn: async ({ signal }) => {
      const [albumsPayload, artistsPayload, reviewsPayload] = await Promise.all([
        listAlbums({ limit: 80 }, { signal }),
        listArtists({ signal }),
        listReviews({ limit: 80 }, { signal }),
      ]);

      return {
        albums: albumsPayload,
        artists: artistsPayload,
        reviews: reviewsPayload,
      };
    },
    staleTime: 90_000,
  });

  const albums = homeFeedQuery.data?.albums ?? EMPTY_ALBUMS;
  const artists = homeFeedQuery.data?.artists ?? EMPTY_ARTISTS;
  const reviews = homeFeedQuery.data?.reviews ?? EMPTY_REVIEWS;
  const loading = homeFeedQuery.isPending;
  const error = homeFeedQuery.error instanceof Error ? homeFeedQuery.error.message : null;

  const topAlbums = useMemo(() => {
    return [...albums]
      .sort((left, right) => {
        const leftAverage = toNumericRating(left.average_rating) ?? 0;
        const rightAverage = toNumericRating(right.average_rating) ?? 0;

        if (leftAverage !== rightAverage) {
          return rightAverage - leftAverage;
        }

        return right.ratings_count - left.ratings_count;
      })
      .slice(0, 7);
  }, [albums]);

  const heroAlbum = topAlbums[0] ?? null;
  const sideAlbums = topAlbums.slice(1, 5);

  const trendingArtists = useMemo(() => {
    return [...artists].sort((left, right) => right.followers - left.followers).slice(0, 6);
  }, [artists]);

  const featuredReviews = useMemo(() => {
    return reviews.slice(0, 4);
  }, [reviews]);

  const mobileRefreshControl =
    Platform.OS === 'web'
      ? undefined
      : <RefreshControl refreshing={homeFeedQuery.isRefetching || loading} onRefresh={() => homeFeedQuery.refetch()} />;

  const fluidQuickActionItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeDesktopWidth: '32%',
    nativeTabletWidth: '48.5%',
    nativeMobileWidth: '100%',
  });
  const discoveryCardDimensions = isDesktop
    ? { featuredWidth: 390, featuredHeight: 432, featuredImageHeight: 216, sideWidth: 280, sideHeight: 96, sideImageSize: 72 }
    : isTablet
      ? {
          featuredWidth: 420,
          featuredHeight: 448,
          featuredImageHeight: 228,
          sideWidth: 420,
          sideHeight: 96,
          sideImageSize: 72,
        }
      : { featuredWidth: 280, featuredHeight: 404, featuredImageHeight: 198, sideWidth: 280, sideHeight: 88, sideImageSize: 68 };
  const fluidDiscoveryFeaturedItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeMobileWidth: '100%',
    nativeTabletWidth: discoveryCardDimensions.featuredWidth,
    nativeDesktopWidth: discoveryCardDimensions.featuredWidth,
  });
  const fluidDiscoverySideItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeMobileWidth: '100%',
    nativeTabletWidth: discoveryCardDimensions.sideWidth,
    nativeDesktopWidth: discoveryCardDimensions.sideWidth,
  });
  const artistCardDimensions = isDesktop
    ? { width: 260, height: 226, imageHeight: 132 }
    : isTablet
      ? { width: 204, height: 212, imageHeight: 122 }
      : { width: 280, height: 208, imageHeight: 118 };
  const fluidArtistItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeMobileWidth: '100%',
    nativeTabletWidth: artistCardDimensions.width,
    nativeDesktopWidth: artistCardDimensions.width,
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={mobileRefreshControl}
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <View style={styles.brandText}>
            <Text style={styles.brandEyebrow}>REVIEWEO</Text>
          </View>
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Building your feed</Text>
            <Text style={styles.loadingText}>Fetching albums, artists, and recent reviews.</Text>
          </View>
        ) : null}

        {!loading ? (
          <View style={[styles.feedColumns, isDesktop ? styles.feedColumnsDesktop : styles.feedColumnsMobile]}>
            <View style={[styles.primaryColumn, isDesktop ? styles.primaryColumnDesktop : null]}>
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Discovery</Text>
                  <Text style={styles.sectionMeta}>Top listener picks this week</Text>
                </View>

                {heroAlbum ? (
                  <View style={[styles.discoveryLayout, isDesktop ? styles.discoveryDesktop : styles.discoveryMobile]}>
                    <View style={fluidDiscoveryFeaturedItemStyle}>
                      <Link href={{ pathname: '/album/[id]', params: { id: String(heroAlbum.id) } }} asChild>
                        <ScalePressable
                          contentStyle={[
                            styles.featuredAlbumCard,
                            {
                              height: discoveryCardDimensions.featuredHeight,
                            },
                          ]}
                        >
                          <Image
                            source={{
                              uri: getAlbumCoverUri({
                                albumId: heroAlbum.id,
                                title: heroAlbum.title,
                                artist: heroAlbum.artist_name,
                                coverImageUrl: heroAlbum.cover_image_url,
                                coverImage: heroAlbum.cover_image,
                              }),
                            }}
                            style={[styles.featuredAlbumImage, { height: discoveryCardDimensions.featuredImageHeight }]}
                            contentFit="cover"
                            transition={shouldReduceMotion ? 0 : 200}
                          />
                          <View style={styles.featuredAlbumBody}>
                            <Text numberOfLines={1} style={styles.featuredOverline}>
                              Album of the moment
                            </Text>
                            <Text numberOfLines={2} style={styles.featuredTitle}>
                              {heroAlbum.title}
                            </Text>
                            <Text numberOfLines={1} style={styles.featuredArtist}>
                              {heroAlbum.artist_name}
                            </Text>
                            <Text numberOfLines={1} style={styles.featuredMeta}>
                              {heroAlbum.release_year} • Avg {formatRating(heroAlbum.average_rating)} •{' '}
                              {formatCompactCount(heroAlbum.ratings_count)} ratings
                            </Text>
                          </View>
                        </ScalePressable>
                      </Link>
                    </View>

                    <View style={[styles.discoveryColumn, fluidDiscoverySideItemStyle]}>
                      {sideAlbums.map((album, index) => (
                        <View
                          key={album.id}
                          style={styles.sideAlbumItem}
                        >
                          <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} asChild>
                            <ScalePressable
                              contentStyle={[
                                styles.sideAlbumRow,
                                {
                                  height: discoveryCardDimensions.sideHeight,
                                },
                              ]}
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
                                style={[
                                  styles.sideAlbumImage,
                                  {
                                    width: discoveryCardDimensions.sideImageSize,
                                    height: discoveryCardDimensions.sideImageSize,
                                  },
                                ]}
                                contentFit="cover"
                                transition={shouldReduceMotion ? 0 : 180}
                              />
                              <View style={styles.sideAlbumBody}>
                                <Text numberOfLines={1} style={styles.sideAlbumTitle}>
                                  {album.title}
                                </Text>
                                <Text numberOfLines={1} style={styles.sideAlbumArtist}>
                                  {album.artist_name}
                                </Text>
                                <Text numberOfLines={1} style={styles.sideAlbumMeta}>
                                  Avg {formatRating(album.average_rating)} • {formatCompactCount(album.ratings_count)} ratings
                                </Text>
                              </View>
                            </ScalePressable>
                          </Link>
                        </View>
                      ))}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No albums available yet</Text>
                    <Text style={styles.emptyText}>Once records are added, discovery highlights will appear here.</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.secondaryColumn, isDesktop ? styles.secondaryColumnDesktop : null]}>
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Latest voices</Text>
                  <Text style={styles.sectionMeta}>Recent reviews from the community</Text>
                </View>

                {featuredReviews.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No reviews yet</Text>
                    <Text style={styles.emptyText}>Write the first review from any album page.</Text>
                  </View>
                ) : (
                  <View style={styles.reviewList}>
                    {featuredReviews.map((review, index) => (
                      <View
                        key={review.id}
                      >
                        <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} asChild>
                          <ScalePressable contentStyle={styles.reviewCard}>
                            <Image
                              source={{ uri: getUserAvatarPlaceholder(review.user_id, review.author) }}
                              style={styles.reviewAvatar}
                              contentFit="cover"
                              transition={shouldReduceMotion ? 0 : 140}
                            />
                            <View style={styles.reviewBody}>
                              <Text style={styles.reviewTitle}>{review.title || `${review.album_title} notes`}</Text>
                              <Text style={styles.reviewMeta}>
                                {review.author} • {review.artist_name} • {review.rating}/5
                              </Text>
                              {review.content ? (
                                <Text numberOfLines={2} style={styles.reviewExcerpt}>
                                  {review.content}
                                </Text>
                              ) : (
                                <Text style={styles.reviewExcerpt}>No written notes for this rating yet.</Text>
                              )}
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
                  <Text style={styles.sectionTitle}>Artists to watch</Text>
                  <Text style={styles.sectionMeta}>The most followed profiles right now</Text>
                </View>

                {trendingArtists.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No artist data available</Text>
                    <Text style={styles.emptyText}>Follow counts appear as soon as artist data is available.</Text>
                  </View>
                ) : (
                  <View style={[styles.artistGrid, !isDesktop && !isTablet ? styles.artistGridMobile : null]}>
                    {trendingArtists.map((artist, index) => (
                      <View
                        key={artist.id}
                        style={fluidArtistItemStyle}
                      >
                        <Link href={{ pathname: '/artist/[id]', params: { id: String(artist.id) } }} asChild>
                          <ScalePressable
                            contentStyle={[
                              styles.artistCard,
                              { height: artistCardDimensions.height },
                            ]}
                          >
                            <Image
                              source={{ uri: getArtistPortraitPlaceholder(artist.id, artist.name) }}
                              style={[styles.artistImage, { height: artistCardDimensions.imageHeight }]}
                              contentFit="cover"
                              transition={shouldReduceMotion ? 0 : 180}
                            />
                            <Text numberOfLines={1} style={styles.artistName}>
                              {artist.name}
                            </Text>
                            <Text numberOfLines={1} style={styles.artistMeta}>
                              {formatCompactCount(artist.followers)} followers
                            </Text>
                          </ScalePressable>
                        </Link>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
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
    paddingTop: DesignTokens.spacing.xl,
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
    gap: DesignTokens.spacing.lg,
  },
  brandText: {
    gap: 2,
  },
  brandEyebrow: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  brandMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '500',
    paddingBottom: 4,
  },
  mastheadTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h1,
    fontWeight: '700',
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  mastheadSubtitle: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    lineHeight: 24,
    maxWidth: 760,
  },
  quickActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  quickActionCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    padding: DesignTokens.spacing.sm,
    gap: 4,
  },
  quickActionTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  quickActionMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    lineHeight: 18,
  },
  sessionRow: {
    gap: DesignTokens.spacing.sm,
  },
  sessionText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
    flexWrap: 'wrap',
  },
  sessionLinkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingTop: 7,
    paddingBottom: 5,
    alignSelf: 'flex-start',
  },
  sessionLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
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
    fontWeight: '600',
  },
  loadingText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  section: {
    gap: DesignTokens.spacing.md,
  },
  feedColumns: {
    width: '100%',
    gap: DesignTokens.spacing.lg,
  },
  feedColumnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.lg,
  },
  feedColumnsMobile: {
    flexDirection: 'column',
  },
  primaryColumn: {
    width: '100%',
    gap: DesignTokens.spacing.lg,
  },
  primaryColumnDesktop: {
    flex: 1.4,
  },
  secondaryColumn: {
    width: '100%',
    gap: DesignTokens.spacing.lg,
  },
  secondaryColumnDesktop: {
    flex: 1,
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
  discoveryLayout: {
    gap: DesignTokens.spacing.md,
  },
  discoveryDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  discoveryMobile: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  featuredAlbumCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
  },
  featuredAlbumImage: {
    width: '100%',
  },
  featuredAlbumBody: {
    padding: DesignTokens.spacing.lg,
    gap: 4,
    flex: 1,
    minWidth: 0,
  },
  featuredOverline: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  featuredTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    lineHeight: 28,
  },
  featuredArtist: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '500',
  },
  featuredMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 18,
  },
  discoveryColumn: {
    gap: DesignTokens.spacing.sm,
  },
  sideAlbumItem: {
    width: '100%',
  },
  sideAlbumRow: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.sm,
    gap: DesignTokens.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  sideAlbumImage: {
    borderRadius: DesignTokens.radius.sm,
  },
  sideAlbumBody: {
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  sideAlbumTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  sideAlbumArtist: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '500',
  },
  sideAlbumMeta: {
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
    fontWeight: '600',
  },
  emptyText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  reviewList: {
    gap: DesignTokens.spacing.sm,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.sm,
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    alignItems: 'flex-start',
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  reviewBody: {
    flex: 1,
    gap: 3,
  },
  reviewTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '600',
  },
  reviewMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  reviewExcerpt: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
  },
  artistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  artistGridMobile: {
    justifyContent: 'center',
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
  artistName: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingTop: DesignTokens.spacing.sm,
  },
  artistMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingBottom: DesignTokens.spacing.sm,
  },
});
