import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import {
    createAlbumReview,
    deleteReview,
    getAlbum,
    getAlbumReviews,
    getAlbumTracks,
    toggleReviewLike,
    updateReview,
} from '@/lib/api';
import type { Album, AlbumTrack, Review } from '@/lib/types';
import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

function parseId(input: string | string[] | undefined): number | null {
    if (!input) {
        return null;
    }

    const value = Array.isArray(input) ? input[0] : input;
    const parsed = Number(value);

    if (!Number.isInteger(parsed) || parsed < 1) {
        return null;
    }

    return parsed;
}

export default function AlbumDetailScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const albumId = parseId(params.id);
    const { session } = useAuth();

    const [album, setAlbum] = useState<Album | null>(null);
    const [tracks, setTracks] = useState<AlbumTrack[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [ratingInput, setRatingInput] = useState('');
    const [titleInput, setTitleInput] = useState('');
    const [contentInput, setContentInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const ownReview = useMemo(() => {
        if (!session) {
        return null;
        }

        return reviews.find((review) => review.user_id === session.user.id) ?? null;
    }, [reviews, session]);

    const loadData = useCallback(async () => {
        if (!albumId) {
        setError('Invalid album id.');
        setLoading(false);
        return;
        }

        setLoading(true);
        setError(null);

        try {
        const [albumPayload, tracksPayload, reviewsPayload] = await Promise.all([
            getAlbum(albumId),
            getAlbumTracks(albumId),
            getAlbumReviews(albumId, 200),
        ]);

        setAlbum(albumPayload);
        setTracks(tracksPayload);
        setReviews(reviewsPayload);
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load album data.');
        } finally {
        setLoading(false);
        }
    }, [albumId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (ownReview) {
        setRatingInput(String(ownReview.rating));
        setTitleInput(ownReview.title ?? '');
        setContentInput(ownReview.content ?? '');
        return;
        }

        setRatingInput('');
        setTitleInput('');
        setContentInput('');
    }, [ownReview]);

    const onSubmit = async () => {
        if (!albumId || !session) {
        setError('Login required to submit a review.');
        return;
        }

        const ratingValue = Number(ratingInput);
        if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        setError('Rating must be an integer between 1 and 5.');
        return;
        }

        setSubmitting(true);
        setError(null);

        try {
        if (ownReview) {
            await updateReview(session.token, ownReview.id, {
            rating: ratingValue,
            title: titleInput.trim(),
            content: contentInput.trim(),
            });
        } else {
            await createAlbumReview(session.token, albumId, {
            rating: ratingValue,
            title: titleInput.trim(),
            content: contentInput.trim(),
            });
        }

        await loadData();
        } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Review submission failed.');
        } finally {
        setSubmitting(false);
        }
    };

    const onDeleteOwnReview = async () => {
        if (!ownReview || !session) {
        return;
        }

        setSubmitting(true);
        setError(null);

        try {
        await deleteReview(session.token, ownReview.id);
        await loadData();
        } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
        } finally {
        setSubmitting(false);
        }
    };

    const onLikeReview = async (reviewId: number) => {
        if (!session) {
        setError('Login required to like a review.');
        return;
        }

        try {
        await toggleReviewLike(session.token, reviewId);
        await loadData();
        } catch (likeError) {
        setError(likeError instanceof Error ? likeError.message : 'Like action failed.');
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Album detail</Text>
        <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadData} />

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}

        {album ? (
            <View style={styles.card}>
            <Text style={styles.text}>{album.title}</Text>
            <Text style={styles.text}>{album.artist_name}</Text>
            <Text style={styles.text}>Year: {album.release_year}</Text>
            <Text style={styles.text}>Average: {album.average_rating ?? 'n/a'}</Text>
            <Text style={styles.text}>
                Ratings: {album.ratings_count} | Reviews: {album.reviews_count}
            </Text>
            </View>
        ) : null}

        <View style={styles.card}>
            <Text style={styles.subtitle}>Tracks</Text>
            {tracks.length === 0 ? <Text style={styles.text}>No tracks available.</Text> : null}
            {tracks.map((track) => (
            <Text key={track.id} style={styles.text}>
                {track.track_order}. {track.title}
            </Text>
            ))}
        </View>

        <View style={styles.card}>
            <Text style={styles.subtitle}>{ownReview ? 'Update your review' : 'Add your review'}</Text>
            {!session ? (
            <>
                <Text style={styles.text}>You must be logged in to review this album.</Text>
                <Link href="/login" style={styles.link}>
                Go to login
                </Link>
            </>
            ) : (
            <>
                <TextInput
                value={ratingInput}
                onChangeText={setRatingInput}
                placeholder="Rating (1-5)"
                keyboardType="number-pad"
                style={styles.input}
                />
                <TextInput
                value={titleInput}
                onChangeText={setTitleInput}
                placeholder="Title (optional)"
                style={styles.input}
                />
                <TextInput
                value={contentInput}
                onChangeText={setContentInput}
                placeholder="Review text (optional)"
                multiline
                style={[styles.input, styles.textArea]}
                />

                <View style={styles.row}>
                <LiquidGlassButton
                    label={submitting ? 'Saving...' : ownReview ? 'Update' : 'Create'}
                    variant="primary"
                    size="sm"
                    onPress={onSubmit}
                    loading={submitting}
                />
                {ownReview ? (
                    <LiquidGlassButton
                    label="Delete"
                    variant="destructive"
                    size="sm"
                    onPress={onDeleteOwnReview}
                    disabled={submitting}
                    />
                ) : null}
                </View>
            </>
            )}
        </View>

        <View style={styles.card}>
            <Text style={styles.subtitle}>Reviews</Text>
            {reviews.length === 0 ? <Text style={styles.text}>No reviews yet.</Text> : null}

            {reviews.map((review) => (
            <View key={review.id} style={styles.entry}>
                <Text style={styles.text}>Author: {review.author}</Text>
                <Text style={styles.text}>Rating: {review.rating}</Text>
                {review.title ? <Text style={styles.text}>{review.title}</Text> : null}
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
                    onPress={() => onLikeReview(review.id)}
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
    input: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 10,
        color: '#000000',
    },
    textArea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    entry: {
        gap: 4,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 8,
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
