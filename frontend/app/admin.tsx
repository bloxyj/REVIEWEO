import { BackNavButton } from '@/components/navigation/BackNavButton';
import { AppButton } from '@/components/ui/AppButton';
import { ScalePressable } from '@/components/ui/ScalePressable';
import { DesignTokens } from '@/constants/design-system';
import { useAuth } from '@/context/auth-context';
import {
  adminDeleteReview,
  adminDeleteUser,
  adminPinReview,
  adminUpdateUserRole,
  listAdminUsers,
  listReviews,
} from '@/lib/api';
import { getFluidGridItemStyle, useResponsiveLayout } from '@/lib/responsive';
import type { AuthUser, Review } from '@/lib/types';
import { Link } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }
  return date.toLocaleDateString();
}

function formatRole(role: AuthUser['role']): string {
  if (role === 'admin') {
    return 'Admin';
  }
  if (role === 'critique') {
    return 'Critique';
  }
  return 'User';
}

export default function AdminScreen() {
    const { session, isAdmin } = useAuth();

    const [users, setUsers] = useState<AuthUser[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!session || !isAdmin) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const [usersPayload, reviewsPayload] = await Promise.all([
                listAdminUsers(session.token),
                listReviews({ limit: 100 }),
            ]);
            setUsers(usersPayload);
            setReviews(reviewsPayload);
        } catch (loadError) {
            setError(loadError instanceof Error ? loadError.message : 'Could not load admin data.');
        } finally {
            setLoading(false);
        }
    }, [session, isAdmin]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onUpdateRole = async (user: AuthUser) => {
        const roles: ("user" | "critique" | "admin")[] = ["user", "critique", "admin"];
        const currentIndex = roles.indexOf(user.role as any);
        const nextRole = roles[(currentIndex + 1) % roles.length];

        try {
            await adminUpdateUserRole(session!.token, user.id, nextRole);
            await loadData();
        } catch {
            setError('Failed to update user role.');
        }
    };

    const onDeleteUser = async (user: AuthUser) => {
    if (!session) return;

    if (Platform.OS === 'web') {
        const confirmed = window.confirm(`Delete ${user.username}?`);
        if (!confirmed) return;
        try {
        await adminDeleteUser(session.token, user.id);
        await loadData();
        } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete user.');
        }
        return;
    }

    Alert.alert('Delete account', `Delete ${user.username}?`, [
        { text: 'Cancel', style: 'cancel' },
        {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
            try {
            await adminDeleteUser(session.token, user.id);
            await loadData();
            } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete user.');
            }
        },
        },
    ]);
    };

  const onTogglePin = async (review: Review) => {
    if (!session || !isAdmin) {
      return;
    }

    try {
      await adminPinReview(session.token, review.id, review.is_pinned !== 1);
      await loadData();
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : 'Pin action failed.');
    }
  };

  const onDeleteReview = async (reviewId: number) => {
    if (!session || !isAdmin) {
      return;
    }

    try {
      await adminDeleteReview(session.token, reviewId);
      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Delete action failed.');
    }
  };

  const mobileRefreshControl =
    Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadData} />;

  if (!session || !isAdmin) {
    return (
      <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View>
            <BackNavButton />
          </View>

          <View>
            <Text style={styles.heroEyebrow}>Restricted area</Text>
            <Text style={styles.heroTitle}>Admin access required</Text>
            <Text style={styles.heroSubtitle}>
              Sign in with an admin profile to manage accounts and moderate submitted reviews.
            </Text>
            <Link href="/login" asChild>
              <ScalePressable contentStyle={styles.inlineLinkCard} accessibilityRole="link">
                <Text style={styles.inlineLinkText}>Go to login</Text>
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
      refreshControl={mobileRefreshControl}
    >
      <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
        <View>
          <BackNavButton />
          {Platform.OS === 'web' ? (
            <AppButton label="Refresh data" variant="secondary" size="sm" onPress={loadData} />
          ) : null}
        </View>

        <View>
          <Text style={styles.heroEyebrow}>Administration</Text>
          <Text style={styles.heroTitle}>Moderation and user controls</Text>
          <Text style={styles.heroSubtitle}>
            Keep member permissions up to date and manage the public review stream from one queue.
          </Text>

          <View style={styles.metricRow}>
            <View style={[styles.metricPill, styles.metricPillBlue]}>
              <Text style={styles.metricLabel}>Users</Text>
              <Text style={styles.metricValue}>{users.length.toLocaleString()}</Text>
            </View>
            <View style={[styles.metricPill, styles.metricPillGreen]}>
              <Text style={styles.metricLabel}>Admins</Text>
              <Text style={styles.metricValue}>{adminCount.toLocaleString()}</Text>
            </View>
            <View style={[styles.metricPill, styles.metricPillRose]}>
              <Text style={styles.metricLabel}>Pinned reviews</Text>
              <Text style={styles.metricValue}>{pinnedCount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {error ? (
          <View>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {loading && users.length === 0 && reviews.length === 0 ? (
          <View>
            <Text style={styles.loadingTitle}>Refreshing admin data</Text>
            <Text style={styles.loadingText}>Fetching user roles and the moderation queue.</Text>
          </View>
        ) : null}

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Users management</Text>
            <Text style={styles.sectionMeta}>{users.length} accounts loaded</Text>
          </View>

          {users.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No users found</Text>
              <Text style={styles.emptyText}>Accounts will appear here as soon as users register.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {users.map((user, index) => {
                const isMe = session.user?.id === user.id;
                const isOfficialCritique = user.email === 'critique@revieweo.com';
                const isProtected = isMe || isOfficialCritique;
                const roleBadgeStyle =
                  user.role === 'admin'
                    ? styles.roleBadgeAdmin
                    : user.role === 'critique'
                      ? styles.roleBadgeCritique
                      : styles.roleBadgeUser;
                const roleTextStyle =
                  user.role === 'admin'
                    ? styles.roleTextAdmin
                    : user.role === 'critique'
                      ? styles.roleTextCritique
                      : styles.roleTextUser;

                return (
                  <View
                    key={user.id}
                    style={[styles.card, fluidCardItemStyle]}
                  >
                    <View style={styles.cardHeader}>
                      <Text numberOfLines={1} style={styles.cardTitle}>
                        {user.username}
                        {isMe ? ' (you)' : ''}
                      </Text>
                      <View style={[styles.roleBadge, roleBadgeStyle]}>
                        <Text style={[styles.roleBadgeText, roleTextStyle]}>{formatRole(user.role)}</Text>
                      </View>
                    </View>
                    <Text numberOfLines={1} style={styles.cardMeta}>
                      {user.email}
                    </Text>
                    <Text style={styles.cardMeta}>Joined {formatDate(user.created_at)}</Text>

                    <View style={styles.actionRow}>
                      {!isProtected ? (
                        <>
                          <AppButton
                            label="Change role"
                            size="sm"
                            onPress={() => onUpdateRole(user)}
                            accessibilityLabel={`Change role for ${user.username}`}
                          />
                          <AppButton
                            label="Delete"
                            variant="destructive"
                            size="sm"
                            onPress={() => onDeleteUser(user)}
                            accessibilityLabel={`Delete user ${user.username}`}
                          />
                        </>
                      ) : (
                        <Text style={styles.helperText}>Protected account</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review moderation</Text>
            <Text style={styles.sectionMeta}>{reviews.length} reviews in queue</Text>
          </View>

          {reviews.length === 0 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No reviews found</Text>
              <Text style={styles.emptyText}>Reviews will appear here once members start posting.</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {reviews.map((review, index) => (
                <View
                  key={review.id}
                  style={[styles.card, fluidCardItemStyle]}
                >
                  <View style={styles.cardHeader}>
                    <Text numberOfLines={1} style={styles.cardTitle}>
                      {review.album_title}
                    </Text>
                    {review.is_pinned === 1 ? (
                      <View style={styles.pinnedBadge}>
                        <Text style={styles.pinnedBadgeText}>Pinned</Text>
                      </View>
                    ) : null}
                  </View>

                  {review.title.trim() ? (
                    <Text numberOfLines={2} style={styles.reviewTitle}>
                      {review.title.trim()}
                    </Text>
                  ) : null}
                  <Text numberOfLines={1} style={styles.cardMeta}>
                    {review.artist_name} • {review.release_year}
                  </Text>
                  <Text style={styles.cardMeta}>
                    By {review.author} • Rating {review.rating}/5 • Updated {formatDate(review.updated_at)}
                  </Text>

                  <View style={styles.actionRow}>
                    <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} asChild>
                      <ScalePressable contentStyle={styles.inlineLinkCard} accessibilityRole="link">
                        <Text style={styles.inlineLinkText}>Open review</Text>
                      </ScalePressable>
                    </Link>
                    <AppButton
                      label={review.is_pinned === 1 ? 'Unpin' : 'Pin'}
                      variant="toggle"
                      size="sm"
                      active={review.is_pinned === 1}
                      onPress={() => onTogglePin(review)}
                    />
                    <AppButton
                      label="Delete"
                      variant="destructive"
                      size="sm"
                      onPress={() => onDeleteReview(review.id)}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: DesignTokens.spacing.sm,
  },
  heroCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.xl,
    gap: DesignTokens.spacing.sm,
  },
  heroEyebrow: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.h1,
    lineHeight: 36,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 21,
    maxWidth: 780,
  },
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.xs,
  },
  metricPill: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    minWidth: 122,
    gap: 2,
  },
  metricPillBlue: {
    backgroundColor: DesignTokens.colors.accentBlueSurface,
    borderColor: DesignTokens.colors.accentBlueSurface,
  },
  metricPillGreen: {
    backgroundColor: DesignTokens.colors.accentGreenSurface,
    borderColor: DesignTokens.colors.accentGreenSurface,
  },
  metricPillRose: {
    backgroundColor: DesignTokens.colors.accentRoseSurface,
    borderColor: DesignTokens.colors.accentRoseSurface,
  },
  metricLabel: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.micro,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
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
    gap: 5,
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
    letterSpacing: -0.5,
  },
  sectionMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: DesignTokens.spacing.sm,
  },
  card: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.md,
    gap: DesignTokens.spacing.xs,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: DesignTokens.spacing.sm,
  },
  cardTitle: {
    flex: 1,
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
    lineHeight: 22,
  },
  cardMeta: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
  reviewTitle: {
    color: DesignTokens.colors.textSecondary,
    fontSize: DesignTokens.typography.bodySmall,
    lineHeight: 20,
  },
  roleBadge: {
    borderWidth: 1,
    borderRadius: DesignTokens.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  roleBadgeUser: {
    borderColor: DesignTokens.colors.surfaceMuted,
    backgroundColor: DesignTokens.colors.surfaceMuted,
  },
  roleBadgeCritique: {
    borderColor: DesignTokens.colors.accentBlueSurface,
    backgroundColor: DesignTokens.colors.accentBlueSurface,
  },
  roleBadgeAdmin: {
    borderColor: DesignTokens.colors.accentGreenSurface,
    backgroundColor: DesignTokens.colors.accentGreenSurface,
  },
  roleBadgeText: {
    fontSize: DesignTokens.typography.micro,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  roleTextUser: {
    color: DesignTokens.colors.textSecondary,
  },
  roleTextCritique: {
    color: DesignTokens.colors.accentBlueText,
  },
  roleTextAdmin: {
    color: DesignTokens.colors.accentGreenText,
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
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: DesignTokens.spacing.xs,
    marginTop: DesignTokens.spacing.xs,
  },
  helperText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.meta,
    fontStyle: 'italic',
  },
  inlineLinkCard: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.sm,
    backgroundColor: DesignTokens.colors.surfaceMuted,
    paddingHorizontal: DesignTokens.spacing.sm,
    paddingVertical: 8,
    alignSelf: 'flex-start',
    minHeight: 44,
    justifyContent: 'center',
  },
  inlineLinkText: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.meta,
    fontWeight: '600',
  },
  emptyState: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.border,
    borderRadius: DesignTokens.radius.md,
    backgroundColor: DesignTokens.colors.surface,
    padding: DesignTokens.spacing.lg,
    gap: 6,
  },
  emptyTitle: {
    color: DesignTokens.colors.textPrimary,
    fontSize: DesignTokens.typography.body,
    fontWeight: '700',
  },
  emptyText: {
    color: DesignTokens.colors.textMuted,
    fontSize: DesignTokens.typography.bodySmall,
  },
});
