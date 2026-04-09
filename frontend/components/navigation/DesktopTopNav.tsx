import { AppButton } from '@/components/ui/AppButton';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import { getFilteredNavLinks, isActivePath, type NavLink } from '@/lib/nav-links';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from 'react-native';

type DesktopTopNavProps = {
  pathname: string;
  isTouchDevice?: boolean;
};

export function DesktopTopNav({ pathname, isTouchDevice = false }: DesktopTopNavProps) {
  const { session, clearSession, isAdmin } = useAuth();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLinks: NavLink[] = useMemo(() => getFilteredNavLinks(!!isAdmin), [isAdmin]);
  const isCompact = width < (isTouchDevice ? 980 : 1160);
  const isVeryNarrow = width < 780;

  const submitSearch = () => {
    const trimmed = searchQuery.trim();

    if (trimmed === '') {
      router.push('/search');
      return;
    }

    router.push({ pathname: '/search', params: { q: trimmed, type: 'all' } });
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.inner, isCompact ? styles.innerCompact : null]}>
        <Pressable
          style={styles.brandLink}
          onPress={() => router.push('/')}
          accessibilityRole="link"
          accessibilityLabel="Go to home"
        >
          <View style={styles.brandText}>
            <Text style={styles.brandTitle}>REVIEWEO</Text>
          </View>
        </Pressable>

        <View style={[styles.linksArea, isVeryNarrow ? styles.linksAreaFullWidth : null]}>
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

        <View style={[styles.searchArea, isVeryNarrow ? styles.searchAreaFullWidth : null]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search songs, artists, albums"
            placeholderTextColor={DesignTokens.colors.textMuted}
            autoCorrect={false}
            returnKeyType="search"
            accessibilityLabel="Search catalog"
            onSubmitEditing={submitSearch}
            style={styles.searchInput}
          />
        </View>

        <View style={[styles.authArea, isVeryNarrow ? styles.authAreaFullWidth : null]}>
          {session ? (
            <>
              <Text numberOfLines={1} style={styles.userText}>
                {session.user.username}
              </Text>
              <AppButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
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
    paddingVertical: DesignTokens.spacing.sm,
  },
  inner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  innerCompact: {
    gap: DesignTokens.spacing.xs,
  },
  brandLink: {
    minWidth: 172,
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
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 220,
  },
  linksAreaFullWidth: {
    width: '100%',
    minWidth: 0,
    flexGrow: 0,
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
  searchArea: {
    minWidth: 250,
    maxWidth: 520,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    flexGrow: 1,
    flexShrink: 1,
  },
  searchAreaFullWidth: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
  },
  searchInput: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    paddingHorizontal: DesignTokens.spacing.sm,
  },
  authArea: {
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.xs,
  },
  authAreaFullWidth: {
    width: '100%',
    minWidth: 0,
    justifyContent: 'flex-start',
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
