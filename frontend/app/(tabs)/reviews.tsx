import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { listReviews, toggleReviewLike } from '@/lib/api';
import { getAlbumCoverUri } from '@/lib/placeholders';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { Review } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ReviewsScreen() {
  const { session } = useAuth();
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [likingReviewId, setLikingReviewId] = useState<number | null>(null);

  const loadReviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const items = await listReviews({ limit: 200 });
      setReviews(items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const onLike = async (reviewId: number) => {
    if (!session) {
      setError('Login required to like reviews.');
      return;
    }

    setLikingReviewId(reviewId);

    try {
      await toggleReviewLike(session.token, reviewId);
      await loadReviews();
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : 'Like action failed.');
    } finally {
      setLikingReviewId(null);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const fluidCardItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeDesktopWidth: '48.5%',
    nativeTabletWidth: '48.5%',
    nativeMobileWidth: '100%',
  });

  const mobileRefreshControl =
    Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadReviews} />;

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
              <Text style={styles.eyebrow}>Community</Text>
              <Text style={styles.title}>Reviews</Text>
              <Text style={styles.subtitle}>Read quick takes, open full notes, and keep likes in sync with your account.</Text>
            </View>
            {Platform.OS === 'web' ? (
              <AppButton label="Refresh" variant="secondary" size="sm" onPress={loadReviews} />
            ) : null}
          </View>

          {!session ? (
            <View style={styles.authCard}>
              <Text style={styles.authText}>Login to like reviews and track your activity.</Text>
              <Link href="/login" asChild>
                <ScalePressable contentStyle={styles.authLinkCard}>
                  <Text style={styles.authLinkText}>Go to login</Text>
                </ScalePressable>
              </Link>
            </View>
          ) : null}
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Loading reviews</Text>
            <Text style={styles.loadingText}>Pulling latest ratings and written notes.</Text>
          </View>
        ) : null}

        {!loading && !error && reviews.length === 0 ? (
          <View>
            <Text style={styles.emptyTitle}>No reviews found</Text>
            <Text style={styles.emptyText}>Reviews will appear here once listeners start writing.</Text>
          </View>
        ) : null}

        {!loading && !error && reviews.length > 0 ? (
          <View style={styles.reviewGrid}>
            {reviews.map((review, index) => (
              <View
                key={review.id}
                style={fluidCardItemStyle}
              >
                <View style={styles.reviewCard}>
                  <Image
                    source={{
                      uri: getAlbumCoverUri({
                        albumId: review.album_id,
                        title: review.album_title,
                        artist: review.artist_name,
                        coverImageUrl: review.cover_image_url,
                        coverImage: review.cover_image,
                      }),
                    }}
                    style={styles.reviewImage}
                    contentFit="cover"
                    transition={shouldReduceMotion ? 0 : 170}
                  />
                  <View style={styles.reviewBody}>
                    <Text numberOfLines={1} style={styles.reviewTitle}>
                      {review.album_title}
                    </Text>
                    <Text numberOfLines={1} style={styles.reviewArtist}>
                      {review.artist_name}
                    </Text>
                    <Text style={styles.reviewMeta}>
                      {review.author} • {new Date(review.created_at).toLocaleDateString()}
                    </Text>
                    {review.content ? (
                      <Text numberOfLines={3} style={styles.reviewContent}>
                        {review.content}
                      </Text>
                    ) : (
                      <Text style={styles.reviewContent}>No written notes for this rating yet.</Text>
                    )}

                    <View style={styles.badgeRow}>
                      <View style={[styles.badge, styles.ratingBadge]}>
                        <Text style={styles.badgeText}>Rating {review.rating}/5</Text>
                      </View>
                      <View style={[styles.badge, styles.likesBadge]}>
                        <Text style={styles.badgeText}>{review.likes_count.toLocaleString()} likes</Text>
                      </View>
                    </View>

                    <View style={styles.actionRow}>
                      <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} asChild>
                        <ScalePressable contentStyle={styles.linkCard}>
                          <Text style={styles.linkText}>Open review</Text>
                        </ScalePressable>
                      </Link>
                      <AppButton
                        label={`Like (${review.likes_count})`}
                        variant="secondary"
                        size="sm"
                        onPress={() => onLike(review.id)}
                        loading={likingReviewId === review.id}
                      />
                    </View>
                  </View>
                </View>
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
  authCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.accentBlueSurface,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.accentBlueSurface,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  authText: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
  },
  authLinkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surface,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  authLinkText: {
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
  reviewGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
  },
  reviewImage: {
    width: '100%',
    aspectRatio: 1.4,
  },
  reviewBody: {
    padding: DesignTokens.spacing.md,
    gap: 5,
  },
  reviewTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  reviewArtist: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '500',
  },
  reviewMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  reviewContent: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
    marginTop: DesignTokens.spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.xs,
  },
  badge: {
    borderWidth: 1,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: DesignTokens.spacing.xs,
    paddingVertical: 6,
  },
  ratingBadge: {
    borderColor: DesignTokens.colors.accentGreenSurface,
    backgroundColor: DesignTokens.colors.accentGreenSurface,
  },
  likesBadge: {
    borderColor: DesignTokens.colors.accentRoseSurface,
    backgroundColor: DesignTokens.colors.accentRoseSurface,
  },
  badgeText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  actionRow: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: DesignTokens.spacing.xs,
  },
  linkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
  },
  linkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
});
