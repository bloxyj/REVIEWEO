import { useAuth } from '@/context/auth-context';
import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { 
    adminDeleteReview, 
    adminPinReview, 
    listAdminUsers, 
    listReviews, 
    adminUpdateUserRole, 
    adminDeleteUser 
} from '@/lib/api';
import type { AuthUser, Review } from '@/lib/types';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

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
        Alert.alert("Suppression", `Supprimer l'utilisateur ${user.username} ?`, [
            { text: "Annuler", style: "cancel" },
            { 
                text: "Supprimer", 
                style: "destructive", 
                onPress: async () => {
                    try {
                        await adminDeleteUser(session!.token, user.id);
                        await loadData();
                    } catch {
                        setError('Failed to delete user.');
                    }
                } 
            }
        ]);
    };

    const onTogglePin = async (review: Review) => {
        if (!session || !isAdmin) return;
        try {
            await adminPinReview(session.token, review.id, review.is_pinned !== 1);
            await loadData();
        } catch {
            setError('Pin action failed.');
        }
    };

    const onDeleteReview = async (reviewId: number) => {
        if (!session || !isAdmin) return;
        try {
            await adminDeleteReview(session.token, reviewId);
            await loadData();
        } catch {
            setError('Delete action failed.');
        }
    };

    const mobileRefreshControl =
        Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadData} />;

    if (!session || !isAdmin) {
        return (
            <View style={styles.container}>
                <BackNavButton />
                <Text style={styles.title}>Access Denied</Text>
                <Link href="/login" style={styles.link}>Go to login</Link>
            </View>
        );
    }

    return (
        <ScrollView 
            contentContainerStyle={styles.container}
            refreshControl={mobileRefreshControl}
        >
            <BackNavButton />
            <Text style={styles.title}>Admin Dashboard</Text>
            {Platform.OS === 'web' ? (
                <LiquidGlassButton label="Refresh Data" variant="secondary" size="sm" onPress={loadData} />
            ) : null}

            {loading && !users.length ? <Text style={styles.text}>Loading...</Text> : null}
            {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

            {/* SECTION UTILISATEURS */}
            <View style={styles.card}>
                <Text style={styles.subtitle}>Users Management</Text>
                {users.length === 0 && !loading ? <Text style={styles.text}>No users found.</Text> : null}
                {users.map((user) => {
                    const isMe = session.user?.id === user.id;
                    const isOfficialCritique = user.email === 'critique@revieweo.com';
                    const isProtected = isMe || isOfficialCritique;

                    return (
                        <View key={user.id} style={styles.entry}>
                            <Text style={[styles.text, { fontWeight: '700' }]}>
                                {user.username} {isMe ? '(You)' : ''}
                                <Text style={{ fontWeight: '400', fontSize: 12 }}> ({user.email})</Text>
                            </Text>
                            <Text style={styles.text}>Role: {user.role}</Text>
                            
                            <View style={styles.row}>
                                {!isProtected ? (
                                    <>
                                        <LiquidGlassButton 
                                            label="Change Role" 
                                            size="sm" 
                                            onPress={() => onUpdateRole(user)} 
                                        />
                                        <LiquidGlassButton 
                                            label="Delete" 
                                            variant="destructive" 
                                            size="sm" 
                                            onPress={() => onDeleteUser(user)} 
                                        />
                                    </>
                                ) : (
                                    <Text style={{ fontSize: 12, color: '#666', fontStyle: 'italic' }}>
                                        Account Protected
                                    </Text>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* SECTION REVIEWS */}
            <View style={styles.card}>
                <Text style={styles.subtitle}>Review Moderation</Text>
                {reviews.length === 0 && !loading ? <Text style={styles.text}>No reviews found.</Text> : null}
                {reviews.map((review) => (
                    <View key={review.id} style={styles.entry}>
                        <Text style={styles.text}>{review.album_title} - {review.author}</Text>
                        <View style={styles.row}>
                            <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} style={styles.link}>
                                View
                            </Link>
                            <LiquidGlassButton
                                label={review.is_pinned === 1 ? 'Unpin' : 'Pin'}
                                variant="toggle"
                                size="sm"
                                active={review.is_pinned === 1}
                                onPress={() => onTogglePin(review)}
                            />
                            <LiquidGlassButton
                                label="Delete"
                                variant="destructive"
                                size="sm"
                                onPress={() => onDeleteReview(review.id)}
                            />
                        </View>
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 15 },
    title: { color: '#000', fontSize: 22, fontWeight: '700' },
    subtitle: { color: '#000', fontSize: 18, fontWeight: '600', marginBottom: 5 },
    text: { color: '#000', fontSize: 14 },
    card: { borderWidth: 1, borderColor: '#000', padding: 12, gap: 8, backgroundColor: '#fff' },
    entry: { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee', gap: 5 },
    row: { flexDirection: 'row', gap: 8, marginTop: 5, alignItems: 'center' },
    link: { color: '#000', textDecorationLine: 'underline', fontSize: 14 }
});