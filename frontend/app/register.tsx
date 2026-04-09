import { BackNavButton } from '@/components/navigation/BackNavButton';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { register } from '@/lib/api';
import { getUserAvatarPlaceholder } from '@/lib/placeholders';
import { useResponsiveLayout } from '@/lib/responsive';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { isDesktop, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const layoutMaxWidth = contentMaxWidth;
  const heroImage = getUserAvatarPlaceholder(1, 'revieweo-register');

  const onSubmit = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await register(username.trim(), email.trim(), password);
      setSession(payload);
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Register failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: layoutMaxWidth }]}>
        <View style={[styles.layout, isDesktop ? styles.layoutDesktop : styles.layoutMobile]}>
          <View>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={shouldReduceMotion ? 0 : 220}
            />
            <Text style={styles.editorialEyebrow}>Create your account</Text>
            <Text style={styles.editorialTitle}>Start building your own review archive.</Text>
            <Text style={styles.editorialText}>
              Track your ratings, write notes that age with each listen, and follow artists and records worth
              revisiting.
            </Text>
          </View>

          <View>
            <BackNavButton fallbackHref="/" label="Back" />

            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Register</Text>
              <Text style={styles.formMeta}>Set up your profile in a minute.</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Your username"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                ref={emailInputRef}
                value={email}
                onChangeText={setEmail}
                placeholder="name@email.com"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Email"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                textContentType="emailAddress"
                keyboardType="email-address"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                style={styles.input}
              />
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Password</Text>
              <TextInput
                ref={passwordInputRef}
                value={password}
                onChangeText={setPassword}
                placeholder="Min 6 characters"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Password"
                autoCorrect={false}
                autoComplete="new-password"
                textContentType="newPassword"
                secureTextEntry
                returnKeyType="done"
                onSubmitEditing={onSubmit}
                style={styles.input}
              />
            </View>

            {error ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <AppButton
              label={loading ? 'Loading...' : 'Register'}
              variant="primary"
              onPress={onSubmit}
              loading={loading}
              fullWidth
            />

            <Link href="/login" asChild>
              <ScalePressable
                contentStyle={styles.switchLinkCard}
                accessibilityRole="link"
                accessibilityLabel="Already have an account? Login"
              >
                <Text style={styles.switchLinkText}>Already have an account? Login</Text>
              </ScalePressable>
            </Link>
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
    paddingTop: DesignTokens.spacing.xl,
    paddingBottom: 96,
  },
  content: {
    width: '100%',
  },
  layout: {
    gap: DesignTokens.spacing.md,
  },
  layoutDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  layoutMobile: {
    flexDirection: 'column',
  },
  editorialCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  heroImage: {
    width: '100%',
    aspectRatio: 1.15,
    borderRadius: DesignTokens.radius.md,
  },
  editorialEyebrow: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    fontWeight: '600',
  },
  editorialTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h1,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.7,
  },
  editorialText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 22,
  },
  formCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: DesignTokens.spacing.md,
  },
  formHeader: {
    gap: 2,
  },
  formTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  formMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
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
  errorBanner: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.dangerSurface,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.dangerSurface,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: DesignTokens.spacing.xs,
  },
  errorText: {
    color: DesignTokens.colors.dangerText,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '500',
  },
  switchLinkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
  },
  switchLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
});
