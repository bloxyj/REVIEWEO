import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import {
  createAlbumReview,
  deleteReview,
  getAlbum,
  getAlbumReviews,
  getAlbumTracks,
  toggleReviewLike,
  updateReview,
} from '@/lib/api';
import { getAlbumCoverPlaceholder, getUserAvatarPlaceholder } from '@/lib/placeholders';
import { formatRating } from '@/lib/rating';
import { useResponsiveLayout } from '@/lib/responsive';
import type { Album, AlbumTrack, Review } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

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

type AlbumDetailPayload = {
  album: Album;
  tracks: AlbumTrack[];
  reviews: Review[];
};

const EMPTY_TRACKS: AlbumTrack[] = [];
const EMPTY_REVIEWS: Review[] = [];

export default function AlbumDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const albumId = parseId(params.id);
  const { session } = useAuth();
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();
  const queryClient = useQueryClient();

  const [ratingInput, setRatingInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const titleInputRef = useRef<TextInput | null>(null);

  const albumQuery = useQuery<AlbumDetailPayload>({
    queryKey: ['album-detail', albumId],
    enabled: Boolean(albumId),
    queryFn: async ({ signal }) => {
      if (!albumId) {
        throw new Error('Invalid album id.');
      }

      const [albumPayload, tracksPayload, reviewsPayload] = await Promise.all([
        getAlbum(albumId, { signal }),
        getAlbumTracks(albumId, { signal }),
        getAlbumReviews(albumId, 200, { signal }),
      ]);

      return {
        album: albumPayload,
        tracks: tracksPayload,
        reviews: reviewsPayload,
      };
    },
    staleTime: 45_000,
  });

  const album = albumQuery.data?.album ?? null;
  const tracks = albumQuery.data?.tracks ?? EMPTY_TRACKS;
  const reviews = albumQuery.data?.reviews ?? EMPTY_REVIEWS;
  const loading = albumId ? albumQuery.isPending : false;

  const invalidateAlbumQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['album-detail', albumId] }),
      queryClient.invalidateQueries({ queryKey: ['home-feed'] }),
    ]);
  };

  const saveReviewMutation = useMutation({
    mutationFn: async (payload: {
      token: string;
      albumId: number;
      ownReviewId: number | null;
      rating: number;
      title: string;
      content: string;
    }) => {
      const body = {
        rating: payload.rating,
        title: payload.title,
        content: payload.content,
      };

      if (payload.ownReviewId) {
        return updateReview(payload.token, payload.ownReviewId, body);
      }

      return createAlbumReview(payload.token, payload.albumId, body);
    },
    onSuccess: invalidateAlbumQueries,
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (payload: { token: string; reviewId: number }) => deleteReview(payload.token, payload.reviewId),
    onSuccess: invalidateAlbumQueries,
  });

  const likeReviewMutation = useMutation({
    mutationFn: async (payload: { token: string; reviewId: number }) => toggleReviewLike(payload.token, payload.reviewId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['album-detail', albumId] }),
  });

  const submitting = saveReviewMutation.isPending || deleteReviewMutation.isPending;
  const error =
    actionError ??
    (!albumId
      ? 'Invalid album id.'
      : albumQuery.error instanceof Error
        ? albumQuery.error.message
        : null);

  const ownReview = useMemo(() => {
    if (!session) {
      return null;
    }

    return reviews.find((review) => review.user_id === session.user.id) ?? null;
  }, [reviews, session]);

  const sortedTracks = useMemo(() => {
    return [...tracks].sort((left, right) => left.track_order - right.track_order);
  }, [tracks]);

  const albumStats = useMemo(() => {
    if (!album) {
      return [];
    }

    return [
      { label: 'Average rating', value: formatRating(album.average_rating) },
      { label: 'Ratings', value: album.ratings_count.toLocaleString() },
      { label: 'Reviews', value: album.reviews_count.toLocaleString() },
    ];
  }, [album]);
  const trackCardWidth = isDesktop ? '49%' : isTablet ? '48.5%' : '100%';
  const trackCountLabel = `${sortedTracks.length} ${sortedTracks.length === 1 ? 'track' : 'tracks'}`;
  const reviewCountLabel = `${reviews.length} ${reviews.length === 1 ? 'entry' : 'entries'}`;

  useEffect(() => {
    if (ownReview) {
      setRatingInput(String(ownReview.rating));
      setTitleInput(ownReview.title ?? '');
      setContentInput(ownReview.content ?? '');
      return;
    }

    setRatingInput('');
    setTitleInput('');
    setContentInput('');
  }, [ownReview]);

  const onSubmit = async () => {
    if (submitting) {
      return;
    }

    if (!albumId || !session) {
      setActionError('Login required to submit a review.');
      return;
    }

    const ratingValue = Number(ratingInput);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setActionError('Rating must be an integer between 1 and 5.');
      return;
    }

    setActionError(null);

    try {
      await saveReviewMutation.mutateAsync({
        token: session.token,
        albumId,
        ownReviewId: ownReview?.id ?? null,
        rating: ratingValue,
        title: titleInput.trim(),
        content: contentInput.trim(),
      });
    } catch (submitError) {
      setActionError(submitError instanceof Error ? submitError.message : 'Review submission failed.');
    }
  };

  const onDeleteOwnReview = async () => {
    if (submitting) {
      return;
    }

    if (!ownReview || !session) {
      return;
    }

    setActionError(null);

    try {
      await deleteReviewMutation.mutateAsync({
        token: session.token,
        reviewId: ownReview.id,
      });
    } catch (deleteError) {
      setActionError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
    }
  };

  const onLikeReview = async (reviewId: number) => {
    if (!session) {
      setActionError('Login required to like a review.');
      return;
    }

    setActionError(null);

    try {
      await likeReviewMutation.mutateAsync({
        token: session.token,
        reviewId,
      });
    } catch (likeError) {
      setActionError(likeError instanceof Error ? likeError.message : 'Like action failed.');
    }
  };

  const mobileRefreshControl =
    Platform.OS === 'web'
      ? undefined
      : (
          <RefreshControl
            refreshing={albumQuery.isRefetching || loading}
            onRefresh={() => {
              if (albumId) {
                albumQuery.refetch();
              }
            }}
          />
        );

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={mobileRefreshControl}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <Animated.View entering={getEntering(shouldReduceMotion, 0)} style={styles.topBar}>
          <BackNavButton fallbackHref="/albums" label="Back to albums" />
          {Platform.OS === 'web' ? (
            <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={() => albumQuery.refetch()} />
          ) : null}
        </Animated.View>

        {error ? (
          <Animated.View entering={getEntering(shouldReduceMotion, 50)} style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </Animated.View>
        ) : null}

        {loading ? (
          <Animated.View entering={getEntering(shouldReduceMotion, 90)} style={styles.loadingState}>
            <Text style={styles.loadingTitle}>Loading album details</Text>
            <Text style={styles.loadingText}>Pulling tracks, reviews, and stats.</Text>
          </Animated.View>
        ) : null}

        {!loading && album ? (
          <View style={[styles.detailColumns, isDesktop ? styles.detailColumnsDesktop : styles.detailColumnsMobile]}>
            <View style={[styles.detailPrimaryColumn, isDesktop ? styles.detailPrimaryColumnDesktop : null]}>
              <Animated.View entering={getEntering(shouldReduceMotion, 120)} style={styles.section}>
                <View style={[styles.heroCard, isDesktop ? styles.heroDesktop : styles.heroMobile]}>
                  <Image
                    source={{ uri: getAlbumCoverPlaceholder(album.id, album.title, album.artist_name) }}
                    style={[styles.heroCover, isDesktop ? styles.heroCoverDesktop : null]}
                    contentFit="cover"
                    transition={shouldReduceMotion ? 0 : 220}
                  />
                  <View style={styles.heroBody}>
                    <Text style={styles.heroEyebrow}>Album profile</Text>
                    <Text style={styles.heroTitle}>{album.title}</Text>
                    <Text style={styles.heroArtist}>{album.artist_name}</Text>
                    <Text style={styles.heroMeta}>
                      {album.release_year} • {album.release_type}
                    </Text>

                    <View style={styles.statRow}>
                      {albumStats.map((stat, index) => (
                        <Animated.View
                          key={stat.label}
                          entering={getListEntering(shouldReduceMotion, 170, index)}
                          style={styles.statPill}
                        >
                          <Text style={styles.statLabel}>{stat.label}</Text>
                          <Text style={styles.statValue}>{stat.value}</Text>
                        </Animated.View>
                      ))}
                    </View>

                    <Text style={styles.heroNote}>
                      Keep a clean listening log and update your notes as your opinion changes.
                    </Text>
                  </View>
                </View>
              </Animated.View>

              <Animated.View entering={getEntering(shouldReduceMotion, 250)} style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionKicker}>Your review</Text>
                  <Text style={styles.sectionTitle}>{ownReview ? 'Edit your entry' : 'Write a new entry'}</Text>
                  <Text style={styles.sectionMeta}>Your rating updates the shared album score immediately.</Text>
                </View>

                {!session ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>Login required</Text>
                    <Text style={styles.emptyText}>Sign in to rate this album and add personal notes.</Text>
                    <Link href="/login" asChild>
                      <ScalePressable contentStyle={styles.loginLinkCard} accessibilityRole="link">
                        <Text style={styles.loginLinkText}>Go to login</Text>
                      </ScalePressable>
                    </Link>
                  </View>
                ) : (
                  <View style={styles.formStack}>
                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>Rating (1-5)</Text>
                      <TextInput
                        value={ratingInput}
                        onChangeText={setRatingInput}
                        placeholder="e.g. 4"
                        placeholderTextColor={DesignTokens.colors.textMuted}
                        accessibilityLabel="Rating from 1 to 5"
                        keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'number-pad'}
                        returnKeyType="next"
                        onSubmitEditing={() => titleInputRef.current?.focus()}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>Review title (optional)</Text>
                      <TextInput
                        ref={titleInputRef}
                        value={titleInput}
                        onChangeText={setTitleInput}
                        placeholder="A short headline"
                        placeholderTextColor={DesignTokens.colors.textMuted}
                        accessibilityLabel="Review title"
                        returnKeyType="done"
                        onSubmitEditing={onSubmit}
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.fieldBlock}>
                      <Text style={styles.fieldLabel}>Notes (optional)</Text>
                      <TextInput
                        value={contentInput}
                        onChangeText={setContentInput}
                        placeholder="Write what stood out."
                        placeholderTextColor={DesignTokens.colors.textMuted}
                        accessibilityLabel="Review notes"
                        multiline
                        style={[styles.input, styles.textArea]}
                      />
                    </View>

                    <View style={styles.formActions}>
                      <LiquidGlassButton
                        label={submitting ? 'Saving...' : ownReview ? 'Update review' : 'Create review'}
                        variant="primary"
                        size="sm"
                        onPress={onSubmit}
                        loading={submitting}
                      />
                      {ownReview ? (
                        <LiquidGlassButton
                          label="Delete review"
                          variant="destructive"
                          size="sm"
                          onPress={onDeleteOwnReview}
                          disabled={submitting}
                        />
                      ) : null}
                    </View>
                  </View>
                )}
              </Animated.View>
            </View>

            <View style={[styles.detailSecondaryColumn, isDesktop ? styles.detailSecondaryColumnDesktop : null]}>
              <Animated.View entering={getEntering(shouldReduceMotion, 180)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderTight}>
                    <Text style={styles.sectionKicker}>Tracklist</Text>
                    <Text style={styles.sectionTitle}>Songs</Text>
                  </View>
                  <Text style={styles.sectionMeta}>{trackCountLabel}</Text>
                </View>

                {sortedTracks.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No tracks available</Text>
                    <Text style={styles.emptyText}>Track metadata is not available yet.</Text>
                  </View>
                ) : (
                  <View style={styles.trackGrid}>
                    {sortedTracks.map((track, index) => (
                      <Animated.View
                        key={track.id}
                        entering={getListEntering(shouldReduceMotion, 220, index)}
                      >
                        <View style={[styles.trackCard, { width: trackCardWidth }]}>
                          <Text style={styles.trackOrder}>{track.track_order.toString().padStart(2, '0')}</Text>
                          <View style={styles.trackBody}>
                            <Text numberOfLines={1} style={styles.trackTitle}>
                              {track.title}
                            </Text>
                            <Text style={styles.trackMeta}>
                              {track.listeners_k ? `${track.listeners_k.toLocaleString()}k listeners` : 'No listener count'} •{' '}
                              {track.popularity_score ?? 'n/a'} popularity
                            </Text>
                          </View>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </Animated.View>

              <Animated.View entering={getEntering(shouldReduceMotion, 300)} style={styles.sectionCard}>
                <View style={styles.sectionHeaderRow}>
                  <View style={styles.sectionHeaderTight}>
                    <Text style={styles.sectionKicker}>Community</Text>
                    <Text style={styles.sectionTitle}>Reviews</Text>
                  </View>
                  <Text style={styles.sectionMeta}>{reviewCountLabel}</Text>
                </View>

                {reviews.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No reviews yet</Text>
                    <Text style={styles.emptyText}>Be the first to rate this release.</Text>
                  </View>
                ) : (
                  <View style={styles.reviewList}>
                    {reviews.map((review, index) => (
                      <Animated.View
                        key={review.id}
                        entering={getListEntering(shouldReduceMotion, 340, index)}
                      >
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewHeader}>
                            <Image
                              source={{ uri: getUserAvatarPlaceholder(review.user_id, review.author) }}
                              style={styles.reviewAvatar}
                              contentFit="cover"
                              transition={shouldReduceMotion ? 0 : 140}
                            />
                            <View style={styles.reviewHeaderText}>
                              <Text style={styles.reviewAuthor}>{review.author}</Text>
                              <Text style={styles.reviewMeta}>
                                {review.rating}/5 • {new Date(review.created_at).toLocaleDateString()}
                              </Text>
                            </View>
                            {review.is_pinned ? (
                              <View style={styles.pinnedBadge}>
                                <Text style={styles.pinnedBadgeText}>Pinned</Text>
                              </View>
                            ) : null}
                          </View>

                          {review.title ? <Text style={styles.reviewTitle}>{review.title}</Text> : null}
                          {review.content ? <Text style={styles.reviewContent}>{review.content}</Text> : null}

                          <View style={styles.reviewActions}>
                            <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} asChild>
                              <ScalePressable contentStyle={styles.openReviewLink} accessibilityRole="link">
                                <Text style={styles.openReviewText}>Open review</Text>
                              </ScalePressable>
                            </Link>
                            <LiquidGlassButton
                              label={`Like (${review.likes_count})`}
                              variant="secondary"
                              size="sm"
                              onPress={() => onLikeReview(review.id)}
                            />
                          </View>
                        </View>
                      </Animated.View>
                    ))}
                  </View>
                )}
              </Animated.View>
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
    paddingBottom: 104,
  },
  content: {
    width: '100%',
    gap: DesignTokens.spacing.xl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  errorBanner: {
    borderWidth: 1,
    borderColor: '#E7C9CC',
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.dangerSurface,
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
  },
  errorText: {
    color: DesignTokens.colors.dangerText,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  loadingState: {
    borderWidth: 1,
    borderColor: '#DDD2C2',
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.xl,
    gap: 4,
  },
  loadingTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  loadingText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  section: {
    gap: DesignTokens.spacing.sm,
  },
  detailColumns: {
    width: '100%',
    gap: DesignTokens.spacing.md,
  },
  detailColumnsDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: DesignTokens.spacing.xl,
  },
  detailColumnsMobile: {
    flexDirection: 'column',
    gap: DesignTokens.spacing.lg,
  },
  detailPrimaryColumn: {
    width: '100%',
    gap: DesignTokens.spacing.lg,
  },
  detailPrimaryColumnDesktop: {
    flex: 0.92,
  },
  detailSecondaryColumn: {
    width: '100%',
    gap: DesignTokens.spacing.lg,
  },
  detailSecondaryColumnDesktop: {
    flex: 1.18,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: '#DCCFBF',
    borderRadius: DesignTokens.radius.xl,
    backgroundColor: DesignTokens.colors.surface,
    overflow: 'hidden',
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.lg,
    boxShadow: '0 10px 24px rgba(47, 41, 35, 0.08)',
  },
  heroDesktop: {
    flexDirection: 'row',
  },
  heroMobile: {
    flexDirection: 'column',
  },
  heroCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: DesignTokens.radius.lg,
    alignSelf: 'center',
  },
  heroCoverDesktop: {
    width: 330,
  },
  heroBody: {
    flex: 1,
    gap: DesignTokens.spacing.xs,
    justifyContent: 'flex-start',
  },
  heroEyebrow: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.display,
    lineHeight: 42,
    fontWeight: '700',
    letterSpacing: -1.1,
  },
  heroArtist: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  heroMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.body,
    marginTop: 2,
  },
  statRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.sm,
  },
  statPill: {
    borderWidth: 1,
    borderColor: '#DDCFBC',
    borderRadius: DesignTokens.radius.md,
    backgroundColor: '#F7F0E4',
    paddingHorizontal: DesignTokens.spacing.md,
    paddingVertical: DesignTokens.spacing.sm,
    gap: 3,
    minWidth: 124,
  },
  statLabel: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontWeight: '600',
  },
  statValue: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  heroNote: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    lineHeight: 23,
    marginTop: DesignTokens.spacing.md,
  },
  sectionCard: {
    borderWidth: 1,
    borderColor: '#DDCFBC',
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  sectionHeader: {
    gap: DesignTokens.spacing.xxs,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: DesignTokens.spacing.md,
  },
  sectionHeaderTight: {
    flex: 1,
    gap: DesignTokens.spacing.xxs,
  },
  sectionKicker: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '700',
  },
  sectionTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.6,
  },
  sectionMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '500',
  },
  formStack: {
    gap: DesignTokens.spacing.md,
  },
  fieldBlock: {
    gap: 6,
  },
  fieldLabel: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#D9CAB7',
    borderRadius: DesignTokens.radius.md,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 11,
    color: DesignTokens.colors.textPrimary,
    backgroundColor: '#FBF6ED',
    fontSize: DesignTokens.typography.body,
  },
  textArea: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#D8CABA',
    borderRadius: DesignTokens.radius.md,
    backgroundColor: '#F9F3EA',
    padding: DesignTokens.spacing.md,
    gap: 6,
  },
  emptyTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  emptyText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  loginLinkCard: {
    borderWidth: 1,
    borderColor: '#CFBEA8',
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: '#F5EBDD',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  loginLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  reviewList: {
    gap: DesignTokens.spacing.md,
  },
  trackGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  trackCard: {
    borderWidth: 1,
    borderColor: '#D8CABA',
    borderRadius: DesignTokens.radius.md,
    backgroundColor: '#FAF4EA',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.sm,
    flexDirection: 'row',
    gap: DesignTokens.spacing.sm,
    alignItems: 'center',
  },
  trackOrder: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '700',
    minWidth: 28,
  },
  trackBody: {
    flex: 1,
    gap: 2,
  },
  trackTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  trackMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#D8CABA',
    borderRadius: DesignTokens.radius.md,
    backgroundColor: '#FCF8F0',
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  reviewAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  reviewHeaderText: {
    flex: 1,
    gap: 1,
  },
  reviewAuthor: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  reviewMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  pinnedBadge: {
    borderWidth: 1,
    borderColor: '#C7DBEB',
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: '#E9F1F8',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pinnedBadgeText: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  reviewTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  reviewContent: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    lineHeight: 21,
  },
  reviewActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
    alignItems: 'center',
  },
  openReviewLink: {
    borderWidth: 1,
    borderColor: '#CFBEA8',
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: '#F5EBDD',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  openReviewText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
});
