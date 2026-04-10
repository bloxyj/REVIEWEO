import { BackNavButton } from '@/components/navigation/BackNavButton';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { createAlbumReview } from '@/lib/api';
import { useResponsiveLayout } from '@/lib/responsive';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function CreateReviewScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  const [albumId, setAlbumId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [rating, setRating] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<TextInput | null>(null);
  const ratingInputRef = useRef<TextInput | null>(null);
  const contentInputRef = useRef<TextInput | null>(null);

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
              <AppButton
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
});
