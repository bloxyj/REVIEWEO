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
  if (role === 'admin') return 'Admin';
  if (role === 'critique') return 'Critique';
  return 'User';
}

export default function AdminScreen() {
  const { session, isAdmin } = useAuth();

  const layout = useResponsiveLayout();
  const { horizontalPadding, contentMaxWidth } = layout;

  const [users, setUsers] = useState<AuthUser[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const adminCount = useMemo(() => users.filter(u => u.role === 'admin').length, [users]);
  const pinnedCount = useMemo(() => reviews.filter(r => r.is_pinned === 1).length, [reviews]);
  
  const fluidCardItemStyle = getFluidGridItemStyle(layout, DesignTokens.spacing.sm);

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
    const roles: AuthUser['role'][] = ["user", "critique", "admin"];
    const currentIndex = roles.indexOf(user.role);
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

    const performDelete = async () => {
      try {
        await adminDeleteUser(session.token, user.id);
        await loadData();
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Failed to delete user.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Delete ${user.username}?`)) await performDelete();
      return;
    }

    Alert.alert('Delete account', `Delete ${user.username}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: performDelete },
    ]);
  };

  const onTogglePin = async (review: Review) => {
    if (!session || !isAdmin) return;
    try {
      await adminPinReview(session.token, review.id, review.is_pinned !== 1);
      await loadData();
    } catch (pinError) {
      setError(pinError instanceof Error ? pinError.message : 'Pin action failed.');
    }
  };

  const onDeleteReview = async (reviewId: number) => {
    if (!session || !isAdmin) return;
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
          <BackNavButton />
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
        <View style={styles.topBar}>
          <BackNavButton />
          {Platform.OS === 'web' && (
            <AppButton label="Refresh data" variant="secondary" size="sm" onPress={loadData} />
          )}
        </View>

        <View>
          <Text style={styles.heroEyebrow}>Administration</Text>
          <Text style={styles.heroTitle}>Moderation and user controls</Text>
          <Text style={styles.heroSubtitle}>
            Keep member permissions up to date and manage the public review stream.
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
              <Text style={styles.metricLabel}>Pinned</Text>
              <Text style={styles.metricValue}>{pinnedCount.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Users management</Text>
            <Text style={styles.sectionMeta}>{users.length} accounts</Text>
          </View>

          <View style={styles.grid}>
            {users.map((user) => {
              const isMe = session.user?.id === user.id;
              const isProtected = isMe || user.email === 'critique@revieweo.com';
              
              const roleStyle = user.role === 'admin' ? styles.roleTextAdmin : 
                                user.role === 'critique' ? styles.roleTextCritique : styles.roleTextUser;

              return (
                <View key={user.id} style={[styles.card, fluidCardItemStyle]}>
                  <View style={styles.cardHeader}>
                    <Text numberOfLines={1} style={styles.cardTitle}>{user.username}{isMe ? ' (you)' : ''}</Text>
                    <View style={[styles.roleBadge]}>
                      <Text style={[styles.roleBadgeText, roleStyle]}>{formatRole(user.role)}</Text>
                    </View>
                  </View>
                  <Text style={styles.cardMeta}>{user.email}</Text>
                  <View style={styles.actionRow}>
                    {!isProtected ? (
                      <>
                        <AppButton label="Role" size="sm" onPress={() => onUpdateRole(user)} />
                        <AppButton label="Delete" variant="destructive" size="sm" onPress={() => onDeleteUser(user)} />
                      </>
                    ) : (
                      <Text style={styles.helperText}>Protected</Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        <View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Review moderation</Text>
            <Text style={styles.sectionMeta}>{reviews.length} reviews</Text>
          </View>

          <View style={styles.grid}>
            {reviews.map((review) => (
              <View key={review.id} style={[styles.card, fluidCardItemStyle]}>
                <View style={styles.cardHeader}>
                  <Text numberOfLines={1} style={styles.cardTitle}>{review.album_title}</Text>
                  {review.is_pinned === 1 && (
                    <View style={styles.pinnedBadge}>
                      <Text style={styles.pinnedBadgeText}>Pinned</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardMeta}>{review.artist_name}</Text>
                <View style={styles.actionRow}>
                  <AppButton
                    label={review.is_pinned === 1 ? 'Unpin' : 'Pin'}
                    variant="toggle"
                    size="sm"
                    active={review.is_pinned === 1}
                    onPress={() => onTogglePin(review)}
                  />
                  <AppButton label="Delete" variant="destructive" size="sm" onPress={() => onDeleteReview(review.id)} />
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: DesignTokens.colors.canvas },
  container: { alignItems: 'center', paddingTop: DesignTokens.spacing.lg, paddingBottom: 96 },
  content: { width: '100%', gap: DesignTokens.spacing.xl },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroEyebrow: { color: DesignTokens.colors.textMuted, fontSize: DesignTokens.typography.micro, fontWeight: '700', textTransform: 'uppercase' },
  heroTitle: { color: DesignTokens.colors.textPrimary, fontSize: DesignTokens.typography.h1, fontWeight: '700' },
  heroSubtitle: { color: DesignTokens.colors.textSecondary, fontSize: DesignTokens.typography.bodySmall },
  metricRow: { flexDirection: 'row', flexWrap: 'wrap', gap: DesignTokens.spacing.xs, marginTop: DesignTokens.spacing.xs },
  metricPill: { borderWidth: 1, borderColor: DesignTokens.colors.border, borderRadius: DesignTokens.radius.md, padding: 8, minWidth: 100 },
  metricPillBlue: { backgroundColor: DesignTokens.colors.accentBlueSurface },
  metricPillGreen: { backgroundColor: DesignTokens.colors.accentGreenSurface },
  metricPillRose: { backgroundColor: DesignTokens.colors.accentRoseSurface },
  metricLabel: { color: DesignTokens.colors.textMuted, fontSize: 10, fontWeight: '600' },
  metricValue: { color: DesignTokens.colors.textPrimary, fontSize: 16, fontWeight: '700' },
  errorBanner: { backgroundColor: DesignTokens.colors.dangerSurface, padding: 12, borderRadius: 8 },
  errorText: { color: DesignTokens.colors.dangerText, fontSize: 12 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: DesignTokens.colors.textPrimary },
  sectionMeta: { fontSize: 12, color: DesignTokens.colors.textMuted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { backgroundColor: DesignTokens.colors.surface, borderRadius: 8, padding: 12, borderWidth: 1, borderColor: DesignTokens.colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  cardTitle: { flex: 1, fontWeight: '700', color: DesignTokens.colors.textPrimary },
  cardMeta: { fontSize: 12, color: DesignTokens.colors.textMuted },
  roleBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: DesignTokens.colors.surfaceMuted },
  roleBadgeText: { fontSize: 10, fontWeight: '700' },
  roleTextAdmin: { color: DesignTokens.colors.accentGreenText },
  roleTextCritique: { color: DesignTokens.colors.accentBlueText },
  roleTextUser: { color: DesignTokens.colors.textSecondary },
  pinnedBadge: { backgroundColor: DesignTokens.colors.accentBlueSurface, paddingHorizontal: 6, borderRadius: 4 },
  pinnedBadgeText: { color: DesignTokens.colors.accentBlueText, fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  helperText: { fontSize: 12, color: DesignTokens.colors.textMuted, fontStyle: 'italic' },
  inlineLinkCard: { padding: 10, backgroundColor: DesignTokens.colors.surfaceMuted, borderRadius: 6, marginTop: 10 },
  inlineLinkText: { fontWeight: '600', color: DesignTokens.colors.textPrimary },
});