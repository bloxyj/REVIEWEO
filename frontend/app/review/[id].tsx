import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { deleteReview, getReview, toggleReviewLike, updateReview } from '@/lib/api';
import { getAlbumCoverUri, getUserAvatarPlaceholder } from '@/lib/placeholders';
import { useResponsiveLayout } from '@/lib/responsive';
import type { Review } from '@/lib/types';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

export default function ReviewDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const router = useRouter();
  const reviewId = parseId(params.id);
  const { session, isAdmin } = useAuth();
  const { isDesktop, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const [review, setReview] = useState<Review | null>(null);
  const [ratingInput, setRatingInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [contentInput, setContentInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<TextInput | null>(null);

  const canEdit = Boolean(session && review && (session.user.id === review.user_id || isAdmin));

  const loadReview = useCallback(async () => {
    if (!reviewId) {
      setError('Invalid review id.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await getReview(reviewId);
      setReview(payload);
      setRatingInput(String(payload.rating));
      setTitleInput(payload.title ?? '');
      setContentInput(payload.content ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load review.');
    } finally {
      setLoading(false);
    }
  }, [reviewId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  const onSave = async () => {
    if (saving) {
      return;
    }

    if (!session || !review || !canEdit) {
      setError('You are not allowed to edit this review.');
      return;
    }

    const ratingValue = Number(ratingInput);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setError('Rating must be an integer between 1 and 5.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await updateReview(session.token, review.id, {
        rating: ratingValue,
        title: titleInput.trim(),
        content: contentInput.trim(),
      });
      await loadReview();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (saving) {
      return;
    }

    if (!session || !review || !canEdit) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await deleteReview(session.token, review.id);
      router.replace('/reviews');
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
      setSaving(false);
    }
  };

  const onLike = async () => {
    if (!session || !review) {
      setError('Login required to like this review.');
      return;
    }

    try {
      await toggleReviewLike(session.token, review.id);
      await loadReview();
    } catch (likeError) {
      setError(likeError instanceof Error ? likeError.message : 'Like action failed.');
    }
  };

  const mobileRefreshControl =
    Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadReview} />;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      refreshControl={mobileRefreshControl}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <BackNavButton fallbackHref="/reviews" label="Back to reviews" />
          {Platform.OS === 'web' ? (
            <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadReview} />
          ) : null}
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading ? (
          <View>
            <Text style={styles.loadingTitle}>Loading review detail</Text>
            <Text style={styles.loadingText}>Fetching full review text and interaction state.</Text>
          </View>
        ) : null}

        {!loading && review ? (
          <>
            <View>
              <View style={[styles.heroCard, isDesktop ? styles.heroDesktop : styles.heroMobile]}>
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
                  style={[styles.heroCover, isDesktop ? styles.heroCoverDesktop : null]}
                  contentFit="cover"
                  transition={shouldReduceMotion ? 0 : 200}
                />

                <View style={styles.heroBody}>
                  <Text style={styles.heroEyebrow}>Review detail</Text>
                  <Text style={styles.heroTitle}>{review.title || `${review.album_title} notes`}</Text>
                  <Text style={styles.heroMeta}>
                    {review.album_title} • {review.artist_name} • {review.release_year}
                  </Text>

                  <View style={styles.authorRow}>
                    <Image
                      source={{ uri: getUserAvatarPlaceholder(review.user_id, review.author) }}
                      style={styles.authorAvatar}
                      contentFit="cover"
                      transition={shouldReduceMotion ? 0 : 140}
                    />
                    <View style={styles.authorBody}>
                      <Text style={styles.authorName}>{review.author}</Text>
                      <Text style={styles.authorMeta}>
                        {new Date(review.created_at).toLocaleDateString()} • Rating {review.rating}/5
                      </Text>
                    </View>
                    {review.is_pinned ? (
                      <View style={styles.pinnedBadge}>
                        <Text style={styles.pinnedBadgeText}>Pinned</Text>
                      </View>
                    ) : null}
                  </View>

                  {review.content ? (
                    <Text style={styles.reviewContent}>{review.content}</Text>
                  ) : (
                    <Text style={styles.reviewContentMuted}>No written notes were added for this rating.</Text>
                  )}

                  <View style={styles.heroActions}>
                    <Link href={{ pathname: '/album/[id]', params: { id: String(review.album_id) } }} asChild>
                      <ScalePressable contentStyle={styles.openAlbumLink} accessibilityRole="link">
                        <Text style={styles.openAlbumText}>Open album</Text>
                      </ScalePressable>
                    </Link>
                    <LiquidGlassButton
                      label={`Like (${review.likes_count})`}
                      variant="secondary"
                      size="sm"
                      onPress={onLike}
                    />
                  </View>
                </View>
              </View>
            </View>

            {canEdit ? (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Edit review</Text>
                  <Text style={styles.sectionMeta}>Update your rating or notes</Text>
                </View>

                <View style={styles.formCard}>
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
                    <Text style={styles.fieldLabel}>Title (optional)</Text>
                    <TextInput
                      ref={titleInputRef}
                      value={titleInput}
                      onChangeText={setTitleInput}
                      placeholder="A short headline"
                      placeholderTextColor={DesignTokens.colors.textMuted}
                      accessibilityLabel="Review title"
                      returnKeyType="done"
                      onSubmitEditing={onSave}
                      style={styles.input}
                    />
                  </View>

                  <View style={styles.fieldBlock}>
                    <Text style={styles.fieldLabel}>Review text (optional)</Text>
                    <TextInput
                      value={contentInput}
                      onChangeText={setContentInput}
                      placeholder="Expand on what you heard."
                      placeholderTextColor={DesignTokens.colors.textMuted}
                      accessibilityLabel="Review text"
                      multiline
                      style={[styles.input, styles.textArea]}
                    />
                  </View>

                  <View style={styles.formActions}>
                    <LiquidGlassButton
                      label={saving ? 'Saving...' : 'Save changes'}
                      variant="primary"
                      size="sm"
                      onPress={onSave}
                      loading={saving}
                    />
                    <LiquidGlassButton
                      label="Delete review"
                      variant="destructive"
                      size="sm"
                      onPress={onDelete}
                      disabled={saving}
                    />
                  </View>
                </View>
              </View>
            ) : null}
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
    letterSpacing: -0.4,
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
  heroCover: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: DesignTokens.radius.md,
  },
  heroCoverDesktop: {
    width: 300,
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
    letterSpacing: -0.7,
  },
  heroMeta: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  authorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  authorBody: {
    flex: 1,
    gap: 1,
  },
  authorName: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '600',
  },
  authorMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
  },
  pinnedBadge: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.accentBlueSurface,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.accentBlueSurface,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pinnedBadgeText: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewContent: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 22,
  },
  reviewContentMuted: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
    fontStyle: 'italic',
  },
  heroActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
    alignItems: 'center',
  },
  openAlbumLink: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  openAlbumText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  formCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
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
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    color: DesignTokens.colors.textPrimary,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 10,
    fontSize: DesignTokens.typography.bodySmall,
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
});
