import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { login } from '@/lib/api';
import { getUserAvatarPlaceholder } from '@/lib/placeholders';
import { useResponsiveLayout } from '@/lib/responsive';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

function getEntering(shouldReduceMotion: boolean, delay: number) {
  if (shouldReduceMotion) {
    return undefined;
  }
  return FadeInDown.duration(DesignTokens.motion.durationSlow).delay(delay);
}

export default function LoginScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { isDesktop, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();
  const passwordInputRef = useRef<TextInput | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const layoutMaxWidth = contentMaxWidth;
  const heroImage = getUserAvatarPlaceholder(0, 'revieweo-login');

  const onSubmit = async () => {
    if (loading) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = await login(email.trim(), password);
      setSession(payload);
      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Login failed.');
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
          <Animated.View entering={getEntering(shouldReduceMotion, 0)} style={styles.editorialCard}>
            <Image
              source={{ uri: heroImage }}
              style={styles.heroImage}
              contentFit="cover"
              transition={shouldReduceMotion ? 0 : 220}
            />
            <Text style={styles.editorialEyebrow}>Welcome back</Text>
            <Text style={styles.editorialTitle}>Your listening ledger is waiting.</Text>
            <Text style={styles.editorialText}>
              Sign in to keep rating albums, revisit your notes, and follow the reviews shaping this week’s charts.
            </Text>
          </Animated.View>

          <Animated.View entering={getEntering(shouldReduceMotion, 70)} style={styles.formCard}>
            <BackNavButton fallbackHref="/" label="Back" />

            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>Login</Text>
              <Text style={styles.formMeta}>Continue where you left off.</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
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
                placeholder="Your password"
                placeholderTextColor={DesignTokens.colors.textMuted}
                accessibilityLabel="Password"
                autoCorrect={false}
                autoComplete="current-password"
                textContentType="password"
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

            <LiquidGlassButton
              label={loading ? 'Loading...' : 'Login'}
              variant="primary"
              onPress={onSubmit}
              loading={loading}
              fullWidth
            />

            <Link href="/register" asChild>
              <ScalePressable
                contentStyle={styles.switchLinkCard}
                accessibilityRole="link"
                accessibilityLabel="Need an account? Register"
              >
                <Text style={styles.switchLinkText}>Need an account? Register</Text>
              </ScalePressable>
            </Link>
          </Animated.View>
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
