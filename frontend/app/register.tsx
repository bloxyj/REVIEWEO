import { BackNavButton } from '@/components/navigation/BackNavButton';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { register } from '@/lib/api';
import { useResponsiveLayout } from '@/lib/responsive';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RegisterScreen() {
  const router = useRouter();
  const { setSession } = useAuth();
  const { isDesktop, contentMaxWidth, horizontalPadding } = useResponsiveLayout();

  const emailInputRef = useRef<TextInput | null>(null);
  const passwordInputRef = useRef<TextInput | null>(null);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const layoutMaxWidth = isDesktop ? Math.min(contentMaxWidth, 980) : Math.min(contentMaxWidth, 560);

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
      contentContainerStyle={[
        styles.container,
        {
          paddingHorizontal: horizontalPadding,
          paddingTop: isDesktop ? DesignTokens.spacing.xl : DesignTokens.spacing.lg,
        },
      ]}
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
    >
      <View style={[styles.content, { maxWidth: layoutMaxWidth }]}> 
        <View style={[styles.authCard, isDesktop ? styles.authCardDesktop : styles.authCardMobile]}>
          <View style={[styles.authLayout, isDesktop ? styles.authLayoutDesktop : styles.authLayoutMobile]}>
            <View style={[styles.introSection, isDesktop ? styles.introSectionDesktop : null]}>
              <Text style={styles.brandEyebrow}>REVIEWEO</Text>
              <Text style={styles.introTitle}>Create your account</Text>
              <Text style={styles.introText}>Set up your profile and start reviewing albums in a few seconds.</Text>
              <BackNavButton
                fallbackHref="/"
                label="Back"
                style={[styles.backButtonMatchAction, isDesktop ? styles.backButtonDesktop : styles.backButtonMobile]}
                textStyle={styles.backButtonMatchActionText}
              />
            </View>

            <View style={[styles.formSection, isDesktop ? styles.formSectionDesktop : null]}>
              <View style={styles.fieldBlock}>
                <Text style={styles.fieldLabel}>Username</Text>
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Username"
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
                  placeholder="Email"
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
                  placeholder="Password"
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

              <Text style={styles.helperText}>By creating an account, you can track ratings and review history.</Text>

              <View style={[styles.actionRow, isDesktop ? styles.actionRowDesktop : styles.actionRowMobile]}>
                <Link href="/login" asChild>
                  <ScalePressable
                    contentStyle={styles.switchLinkInline}
                    accessibilityRole="link"
                    accessibilityLabel="Sign in instead"
                  >
                    <Text style={styles.switchLinkText}>Sign in instead</Text>
                  </ScalePressable>
                </Link>

                <AppButton
                  label={loading ? 'Loading...' : 'Create account'}
                  variant="primary"
                  onPress={onSubmit}
                  loading={loading}
                  fullWidth={!isDesktop}
                  style={isDesktop ? styles.primaryActionDesktop : undefined}
                />
              </View>
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
    backgroundColor: DesignTokens.colors.surfaceMuted,
  },
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: DesignTokens.spacing.xl,
  },
  content: {
    width: '100%',
  },
  authCard: {
    width: '100%',
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.xl,
    backgroundColor: DesignTokens.colors.surface,
  },
  authCardDesktop: {
    paddingHorizontal: 44,
    paddingVertical: 38,
  },
  authCardMobile: {
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.lg,
  },
  authLayout: {
    gap: DesignTokens.spacing.xl,
  },
  authLayoutDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  authLayoutMobile: {
    flexDirection: 'column',
    gap: DesignTokens.spacing.lg,
  },
  introSection: {
    gap: DesignTokens.spacing.sm,
  },
  introSectionDesktop: {
    flex: 0.95,
    paddingRight: DesignTokens.spacing.xl,
  },
  brandEyebrow: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.meta,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  introTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.display,
    fontWeight: '700',
    lineHeight: 44,
    letterSpacing: -0.4,
  },
  introText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.body,
    lineHeight: 22,
  },
  backButtonMatchAction: {
    minHeight: 44,
    borderRadius: DesignTokens.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  backButtonDesktop: {
    alignSelf: 'flex-start',
    minWidth: 170,
  },
  backButtonMobile: {
    alignSelf: 'stretch',
  },
  backButtonMatchActionText: {
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  formSection: {
    gap: DesignTokens.spacing.md,
  },
  formSectionDesktop: {
    flex: 1.05,
    maxWidth: 440,
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
    paddingVertical: 11,
    fontSize: DesignTokens.typography.bodySmall,
    minHeight: 44,
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
  helperText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.meta,
    lineHeight: 18,
  },
  actionRow: {
    marginTop: DesignTokens.spacing.xs,
    gap: DesignTokens.spacing.sm,
  },
  actionRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionRowMobile: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  switchLinkInline: {
    width: 'auto',
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 6,
  },
  switchLinkText: {
    color: DesignTokens.colors.accentBlueText,
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  primaryActionDesktop: {
    minWidth: 170,
  },
});
