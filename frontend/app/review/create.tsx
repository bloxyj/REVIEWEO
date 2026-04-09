import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { API_BASE_URL } from '@/lib/config';
import { useAuth } from '@/context/auth-context';
import { createAlbumReview } from '@/lib/api';
import { getAlbumCoverPlaceholder, getUserAvatarPlaceholder } from '@/lib/placeholders';
import { useResponsiveLayout } from '@/lib/responsive';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function CreateReviewScreen() {
  const router = useRouter();
  const { session, isAdmin } = useAuth();
  const { isDesktop, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const [albumId, setAlbumId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<TextInput | null>(null);
  const ratingInputRef = useRef<TextInput | null>(null);
  const contentInputRef = useRef<TextInput | null>(null);

  const reviewerId = session?.user.id ?? 0;
  const reviewerName = session?.user.username ?? 'revieweo';
  const isCritique = session?.user.role === 'critique';

  const parsedAlbumId = Number(albumId);
  const hasValidAlbumId = Number.isInteger(parsedAlbumId) && parsedAlbumId > 0;
  const previewTitle = title.trim() === '' ? 'Untitled Review' : title.trim();

  const coverPreview = useMemo(() => {
    if (hasValidAlbumId) {
      return `${API_BASE_URL}/images/albums/${parsedAlbumId}`;
    }

    return getAlbumCoverPlaceholder(0, previewTitle, reviewerName);
  }, [hasValidAlbumId, parsedAlbumId, previewTitle, reviewerName]);

  const reviewerPreview = useMemo(
    () => getUserAvatarPlaceholder(reviewerId, reviewerName),
    [reviewerId, reviewerName]
  );

  const onSubmit = async () => {
    if (loading) {
      return;
    }

    if (!session) {
      setError('Login required to publish a review.');
      return;
    }

    if (!albumId || !title || !content || !rating) {
      setError('Please fill all fields.');
      return;
    }

    const albumValue = Number(albumId);
    if (!Number.isInteger(albumValue) || albumValue < 1) {
      setError('Album ID must be a positive integer.');
      return;
    }

    const ratingValue = Number(rating);
    if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
      setError('Rating must be an integer between 1 and 5.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await createAlbumReview(session.token, albumValue, {
        title: title.trim(),
        content: content.trim(),
        rating: ratingValue,
      });
      Alert.alert('Success', 'Your review has been published!');
      router.replace('/reviews');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to publish review.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isCritique) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      >
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View>
            <BackNavButton fallbackHref="/reviews" label="Back to reviews" />
          </View>

          <View>
            <Text style={styles.accessTitle}>Access denied</Text>
            <Text style={styles.accessText}>Only critics and admins can write reviews.</Text>
            <Link href="/reviews" asChild>
              <ScalePressable contentStyle={styles.inlineLinkCard} accessibilityRole="link">
                <Text style={styles.inlineLinkText}>Browse published reviews</Text>
              </ScalePressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <BackNavButton fallbackHref="/reviews" label="Back to reviews" />
        </View>

        <View>
          <View style={[styles.heroCard, isDesktop ? styles.heroDesktop : styles.heroMobile]}>
            <Image
              source={{ uri: coverPreview }}
              style={[styles.heroImage, isDesktop ? styles.heroImageDesktop : null]}
              contentFit="cover"
              transition={shouldReduceMotion ? 0 : 220}
            />
            <View style={styles.heroBody}>
              <Text style={styles.heroEyebrow}>Editorial review</Text>
              <Text style={styles.heroTitle}>Write a review</Text>
              <Text style={styles.heroSubtitle}>
                Publish a full write-up and score for a specific album. Your review will appear immediately in the
                public feed.
              </Text>

              <View style={styles.authorRow}>
                <Image
                  source={{ uri: reviewerPreview }}
                  style={styles.authorAvatar}
                  contentFit="cover"
                  transition={shouldReduceMotion ? 0 : 120}
                />
                <View style={styles.authorBody}>
                  <Text style={styles.authorName}>{reviewerName}</Text>
                  <Text style={styles.authorMeta}>{session?.user.role ?? 'critic'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review form</Text>
            <Text style={styles.sectionMeta}>All fields are required to publish.</Text>
          </View>

          <View style={styles.formCard}>
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Album ID</Text>
              <TextInput
                value={albumId}
                onChangeText={setAlbumId}
                placeholder="e.g. 1"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Album ID"
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'number-pad'}
                returnKeyType="next"
                onSubmitEditing={() => titleInputRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Review title</Text>
              <TextInput
                ref={titleInputRef}
                value={title}
                onChangeText={setTitle}
                placeholder="A concise headline"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Review title"
                returnKeyType="next"
                onSubmitEditing={() => ratingInputRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Rating (1-5)</Text>
              <TextInput
                ref={ratingInputRef}
                value={rating}
                onChangeText={setRating}
                placeholder="e.g. 4"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Rating from 1 to 5"
                keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'number-pad'}
                maxLength={1}
                returnKeyType="next"
                onSubmitEditing={() => contentInputRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Review text</Text>
              <TextInput
                ref={contentInputRef}
                value={content}
                onChangeText={setContent}
                placeholder="Your full review"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Review text"
                multiline
                numberOfLines={6}
                style={[styles.input, styles.textArea]}
              />
            </View>

            <View style={styles.formActions}>
              <LiquidGlassButton
                label={loading ? 'Publishing...' : 'Publish review'}
                variant="primary"
                onPress={onSubmit}
                loading={loading}
              />

              <Link href="/reviews" asChild>
                <ScalePressable contentStyle={styles.inlineLinkCard} accessibilityRole="link">
                  <Text style={styles.inlineLinkText}>Cancel</Text>
                </ScalePressable>
              </Link>
            </View>
          </View>
        </View>
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
  section: {
    gap: DesignTokens.spacing.md,
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
    aspectRatio: 1,
    borderRadius: DesignTokens.radius.md,
  },
  heroImageDesktop: {
    width: 280,
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
  heroSubtitle: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 22,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    marginTop: DesignTokens.spacing.xs,
  },
  authorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  authorBody: {
    gap: 1,
  },
  authorName: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '700',
  },
  authorMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
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
    minHeight: 120,
    textAlignVertical: 'top',
  },
  formActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
    alignItems: 'center',
  },
  inlineLinkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  inlineLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  accessCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.sm,
  },
  accessTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  accessText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 22,
  },
});
