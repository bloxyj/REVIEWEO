import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { getUserAvatarPlaceholder } from '@/lib/placeholders';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

const BROWSE_LINKS = [
  {
    label: 'Charts',
    description: 'See top-rated albums by filters and community score.',
    href: '/charts',
  },
  {
    label: 'Search catalog',
    description: 'Jump to artists and albums in one query.',
    href: '/search',
  },
  {
    label: 'Community reviews',
    description: 'Read the latest listener and critic write-ups.',
    href: '/reviews',
  },
] as const;

export default function SettingsScreen() {
  const { session, clearSession } = useAuth();
  const { isDesktop, isTablet, contentMaxWidth, horizontalPadding } = useResponsiveLayout();
  const shouldReduceMotion = useReducedMotionPreference();

  const fluidLinkItemStyle = getFluidGridItemStyle({
    isDesktop,
    isTablet,
    minWidth: 220,
    maxWidth: 320,
    nativeDesktopWidth: '48.5%',
    nativeTabletWidth: '48.5%',
    nativeMobileWidth: '100%',
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}>
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <Text style={styles.eyebrow}>Account</Text>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Manage your session, account shortcuts, and profile controls from one place.</Text>
        </View>

        <View>
          <Text style={styles.sectionTitle}>Account</Text>

          {session ? (
            <View style={styles.accountCard}>
              <View style={styles.accountRow}>
                <Image
                  source={{ uri: getUserAvatarPlaceholder(session.user.id, session.user.username) }}
                  style={styles.avatar}
                  contentFit="cover"
                  transition={shouldReduceMotion ? 0 : 160}
                />
                <View style={styles.accountDetails}>
                  <Text numberOfLines={1} style={styles.accountName}>
                    {session.user.username}
                  </Text>
                  <Text style={styles.accountMeta}>Role: {session.user.role}</Text>
                  <Text style={styles.accountMeta}>Signed in</Text>
                </View>
              </View>
              <AppButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
            </View>
          ) : (
            <View style={styles.accountCard}>
              <Text style={styles.loggedOutTitle}>You are not logged in.</Text>
              <Text style={styles.loggedOutText}>Login or register to write reviews and keep likes tied to your profile.</Text>
              <View style={styles.authActions}>
                <Link href="/login" asChild>
                  <ScalePressable contentStyle={styles.authCard}>
                    <Text style={styles.authCardLabel}>Login</Text>
                  </ScalePressable>
                </Link>
                <Link href="/register" asChild>
                  <ScalePressable contentStyle={styles.authCard}>
                    <Text style={styles.authCardLabel}>Register</Text>
                  </ScalePressable>
                </Link>
              </View>
            </View>
          )}
        </View>

        <View>
          <Text style={styles.sectionTitle}>Browse</Text>
          <View style={styles.linkGrid}>
            {BROWSE_LINKS.map((item, index) => (
              <View
                key={item.label}
                style={fluidLinkItemStyle}
              >
                <Link href={item.href} asChild>
                  <ScalePressable contentStyle={styles.linkCard}>
                    <Text style={styles.linkLabel}>{item.label}</Text>
                    <Text style={styles.linkDescription}>{item.description}</Text>
                  </ScalePressable>
                </Link>
              </View>
            ))}
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
    gap: DesignTokens.spacing.lg,
  },
  masthead: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 4,
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
  section: {
    gap: DesignTokens.spacing.sm,
  },
  sectionTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h2,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  accountCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.sm,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: DesignTokens.radius.md,
  },
  accountDetails: {
    gap: 2,
    flex: 1,
  },
  accountName: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h3,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  accountMeta: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
  },
  loggedOutTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '600',
  },
  loggedOutText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
    maxWidth: 720,
  },
  authActions: {
    flexDirection: 'row',
    gap: DesignTokens.spacing.xs,
    flexWrap: 'wrap',
  },
  authCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
  },
  authCardLabel: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  linkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  linkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: 4,
  },
  linkLabel: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  linkDescription: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
  },
});
