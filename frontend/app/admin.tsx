import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { adminDeleteReview, adminPinReview, listAdminUsers, listReviews } from '@/lib/api';
import type { AuthUser, Review } from '@/lib/types';
import { Link } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

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

    const onDelete = async (reviewId: number) => {
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

    if (!session) {
        return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.text}>Login required.</Text>
            <Link href="/login" style={styles.link}>
            Go to login
            </Link>
        </View>
        );
    }

    if (!isAdmin) {
        return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.text}>This page is only accessible to admin users.</Text>
        </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Admin</Text>
        <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadData} />

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}

        <View style={styles.card}>
            <Text style={styles.subtitle}>Users</Text>
            {users.length === 0 ? <Text style={styles.text}>No users found.</Text> : null}
            {users.map((user) => (
            <Text key={user.id} style={styles.text}>
                {user.username} ({user.role})
            </Text>
            ))}
        </View>

        <View style={styles.card}>
            <Text style={styles.subtitle}>Review moderation</Text>
            {reviews.length === 0 ? <Text style={styles.text}>No reviews found.</Text> : null}

            {reviews.map((review) => (
            <View key={review.id} style={styles.entry}>
                <Text style={styles.text}>
                {review.album_title} - {review.author}
                </Text>
                <Text style={styles.text}>Pinned: {review.is_pinned === 1 ? 'yes' : 'no'}</Text>

                <View style={styles.row}>
                <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} style={styles.link}>
                    Open review
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
                    onPress={() => onDelete(review.id)}
                />
                </View>
            </View>
            ))}
        </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 10,
    },
    title: {
        color: '#000000',
        fontSize: 22,
        fontWeight: '700',
    },
    subtitle: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    text: {
        color: '#000000',
    },
    card: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 10,
        gap: 6,
    },
    entry: {
        gap: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 8,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
