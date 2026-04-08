import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { getFilteredNavLinks, isActivePath, type NavLink } from '@/lib/nav-links';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type DesktopTopNavProps = {
  pathname: string;
};

export function DesktopTopNav({ pathname }: DesktopTopNavProps) {
  const { session, clearSession, isAdmin } = useAuth();
  const router = useRouter();

  const filteredLinks: NavLink[] = getFilteredNavLinks(!!isAdmin);

  return (
    <View style={styles.wrapper}>
      <View style={styles.inner}>
        <Pressable
          style={styles.brandLink}
          onPress={() => router.push('/')}
          accessibilityRole="link"
          accessibilityLabel="Go to home"
        >
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>REVIEWEO</Text>
            <Text style={styles.brandSubtitle}>Music ledger</Text>
          </View>
        </Pressable>

        <View style={styles.linksArea}>
          {filteredLinks.map((item) => {
            const active = isActivePath(pathname, item.matchPatterns);

            return (
              <Pressable
                key={item.label}
                style={active ? [styles.linkChip, styles.activeLinkChip] : styles.linkChip}
                onPress={() => router.push(item.href)}
                accessibilityRole="link"
                accessibilityLabel={item.label}
              >
                <Text style={active ? [styles.linkText, styles.activeLinkText] : styles.linkText}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.authArea}>
          {session ? (
            <>
              <Text numberOfLines={1} style={styles.userText}>
                {session.user.username}
              </Text>
              <LiquidGlassButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
            </>
          ) : (
            <>
              <Pressable
                style={styles.authLinkChip}
                onPress={() => router.push('/login')}
                accessibilityRole="link"
                accessibilityLabel="Login"
              >
                <Text style={styles.authLinkText}>Login</Text>
              </Pressable>
              <Pressable
                style={styles.authLinkChip}
                onPress={() => router.push('/register')}
                accessibilityRole="link"
                accessibilityLabel="Register"
              >
                <Text style={styles.authLinkText}>Register</Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.border,
    backgroundColor: DesignTokens.colors.surface,
    paddingHorizontal: DesignTokens.spacing.lg,
    paddingVertical: DesignTokens.spacing.md,
  },
  inner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.lg,
  },
  brandLink: {
    minWidth: 190,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  brandText: {
    gap: 1,
  },
  brandTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  brandSubtitle: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  linksArea: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    flex: 1,
  },
  linkChip: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: DesignTokens.radius.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 7,
    backgroundColor: DesignTokens.colors.surfaceMuted,
  },
  activeLinkChip: {
    backgroundColor: DesignTokens.colors.surface,
    borderColor: DesignTokens.colors.border,
  },
  linkText: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  activeLinkText: {
    color: DesignTokens.colors.textPrimary,
  },
  authArea: {
    minWidth: 220,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.xs,
  },
  userText: {
    maxWidth: 120,
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '500',
    marginRight: DesignTokens.spacing.xs,
  },
  authLinkChip: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 7,
    backgroundColor: DesignTokens.colors.surfaceMuted,
  },
  authLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
});
