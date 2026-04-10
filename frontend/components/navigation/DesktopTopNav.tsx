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
  const isCompact = width < (isTouchDevice ? 1060 : 1220);
  const isStacked = width < (isTouchDevice ? 920 : 1080);
  const isVeryNarrow = width < 760;
  const linksWrapStyle = isStacked ? styles.linksAreaWrap : styles.linksAreaNoWrap;

  const submitSearch = () => {
    const trimmed = searchQuery.trim();

    if (trimmed === '') {
      router.push('/search');
      return;
    }

    router.push({ pathname: '/search', params: { q: trimmed, type: 'all' } });
  };

  const renderLinks = () =>
    filteredLinks.map((item) => {
      const active = isActivePath(pathname, item.matchPatterns);

      return (
        <Pressable
          key={item.label}
          style={({ pressed }) => [
            styles.linkButton,
            active ? styles.linkButtonActive : null,
            pressed ? styles.inlinePressed : null,
          ]}
          onPress={() => router.push(item.href)}
          accessibilityRole="link"
          accessibilityLabel={item.label}
        >
          <Text style={active ? [styles.linkText, styles.activeLinkText] : styles.linkText}>{item.label}</Text>
        </Pressable>
      );
    });

  const renderSearchInput = () => (
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
  );

  const renderAuth = () => {
    if (session) {
      return (
        <>
          <Text numberOfLines={1} style={styles.userText}>
            {session.user.username}
          </Text>
          <View style={styles.inlineDivider} />
          <Pressable
            style={({ pressed }) => [styles.authLink, pressed ? styles.inlinePressed : null]}
            onPress={clearSession}
            accessibilityRole="button"
            accessibilityLabel="Logout"
          >
            <Text style={styles.authLinkText}>Logout</Text>
          </Pressable>
        </>
      );
    }

    return (
      <Pressable
        style={({ pressed }) => [styles.authLink, pressed ? styles.inlinePressed : null]}
        onPress={() => router.push('/login')}
        accessibilityRole="link"
        accessibilityLabel="Login"
      >
        <Text style={styles.authLinkText}>Login</Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.wrapper}>
      {!isStacked ? (
        <View style={[styles.row, isCompact ? styles.rowCompact : null]}>
          <Pressable
            style={styles.brandLink}
            onPress={() => router.push('/')}
            accessibilityRole="link"
            accessibilityLabel="Go to home"
          >
            <Text style={styles.brandTitle}>REVIEWEO</Text>
          </Pressable>
          <View style={styles.groupDivider} />

          <View style={styles.primaryArea}>
            <View style={[styles.linksArea, linksWrapStyle]}>{renderLinks()}</View>
            <View style={[styles.searchArea, isCompact ? styles.searchAreaCompact : styles.searchAreaWide]}>
              {renderSearchInput()}
            </View>
          </View>

          <View style={styles.groupDivider} />
          <View style={styles.authArea}>{renderAuth()}</View>
        </View>
      ) : (
        <View style={[styles.stack, isCompact ? styles.stackCompact : null]}>
          <View style={styles.stackTopRow}>
            <Pressable
              style={styles.brandLink}
              onPress={() => router.push('/')}
              accessibilityRole="link"
              accessibilityLabel="Go to home"
            >
              <Text style={styles.brandTitle}>REVIEWEO</Text>
            </Pressable>
            <View style={[styles.authArea, styles.authAreaStacked]}>{renderAuth()}</View>
          </View>

          <View style={[styles.stackBottomRow, isVeryNarrow ? styles.stackBottomRowNarrow : null]}>
            <View style={[styles.linksArea, linksWrapStyle, isVeryNarrow ? styles.linksAreaFullWidth : null]}>
              {renderLinks()}
            </View>
            <View
              style={[
                styles.searchArea,
                isCompact ? styles.searchAreaCompact : styles.searchAreaWide,
                isVeryNarrow ? styles.searchAreaFullWidth : null,
              ]}
            >
              {renderSearchInput()}
            </View>
          </View>
        </View>
      )}
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
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
    minHeight: 56,
  },
  rowCompact: {
    gap: DesignTokens.spacing.xs,
  },
  brandLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  brandTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.bodySmall,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  groupDivider: {
    width: 1,
    height: 14,
    alignSelf: 'center',
    backgroundColor: DesignTokens.colors.border,
    opacity: 0.7,
  },
  primaryArea: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  linksArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    flexShrink: 1,
    minWidth: 0,
  },
  linksAreaNoWrap: {
    flexWrap: 'nowrap',
  },
  linksAreaWrap: {
    flexWrap: 'wrap',
  },
  linksAreaFullWidth: {
    width: '100%',
    minWidth: 0,
    flexGrow: 1,
  },
  linkButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  linkButtonActive: {
    borderBottomColor: DesignTokens.colors.accentBlueText,
  },
  inlinePressed: {
    opacity: 0.7,
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
    minWidth: 180,
    maxWidth: 320,
    flexShrink: 1,
  },
  searchAreaWide: {
    width: 272,
  },
  searchAreaCompact: {
    width: 228,
  },
  searchAreaFullWidth: {
    width: '100%',
    minWidth: 0,
    maxWidth: '100%',
  },
  searchInput: {
    width: '100%',
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: DesignTokens.spacing.xs,
    marginLeft: 'auto',
  },
  userText: {
    maxWidth: 140,
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '500',
  },
  inlineDivider: {
    width: 1,
    height: 20,
    backgroundColor: DesignTokens.colors.border,
    opacity: 0.9,
  },
  authLink: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  authLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  stack: {
    width: '100%',
    flexDirection: 'column',
    gap: DesignTokens.spacing.xs,
  },
  stackCompact: {
    gap: 2,
  },
  stackTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    minHeight: 48,
  },
  stackBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
  },
  stackBottomRowNarrow: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  authAreaStacked: {
    marginLeft: 'auto',
  },
});
