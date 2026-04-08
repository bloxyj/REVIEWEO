import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { listReviews, toggleReviewLike } from '@/lib/api';
import type { Review } from '@/lib/types';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ReviewsScreen() {
    const { session } = useAuth();

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadReviews = async () => {
        setLoading(true);
        setError(null);

        try {
        const items = await listReviews({ limit: 200 });
        setReviews(items);
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load reviews.');
        } finally {
        setLoading(false);
        }
    };

    const onLike = async (reviewId: number) => {
        if (!session) {
        setError('Login required to like reviews.');
        return;
        }

        try {
        await toggleReviewLike(session.token, reviewId);
        await loadReviews();
        } catch (likeError) {
        setError(likeError instanceof Error ? likeError.message : 'Like action failed.');
        }
    };

    useEffect(() => {
        loadReviews();
    }, []);

    const mobileRefreshControl =
        Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadReviews} />;

    return (
        <ScrollView contentContainerStyle={styles.container} refreshControl={mobileRefreshControl}>
        <Text style={styles.title}>Reviews</Text>
        {Platform.OS === 'web' ? (
            <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadReviews} />
        ) : null}

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}
        {!loading && !error && reviews.length === 0 ? <Text style={styles.text}>No reviews found.</Text> : null}

        {reviews.map((review) => (
            <View key={review.id} style={styles.card}>
            <Text style={styles.text}>{review.album_title}</Text>
            <Text style={styles.text}>{review.artist_name}</Text>
            <Text style={styles.text}>Author: {review.author}</Text>
            <Text style={styles.text}>Rating: {review.rating}</Text>
            {review.content ? <Text style={styles.text}>{review.content}</Text> : null}
            <Text style={styles.text}>Likes: {review.likes_count}</Text>

            <View style={styles.row}>
                <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} style={styles.link}>
                Open review
                </Link>
                <LiquidGlassButton
                label="Like"
                variant="secondary"
                size="sm"
                onPress={() => onLike(review.id)}
                />
            </View>
            </View>
        ))}
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
        paddingBottom: 10,
    },
    text: {
        color: '#000000',
    },
    card: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 10,
        gap: 4,
    },
    row: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
