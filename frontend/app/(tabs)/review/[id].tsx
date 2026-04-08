import { useAuth } from '@/context/auth-context';
import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { deleteReview, getReview, toggleReviewLike, updateReview } from '@/lib/api';
import type { Review } from '@/lib/types';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

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

export default function ReviewDetailScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const router = useRouter();
    const reviewId = parseId(params.id);
    const { session, isAdmin } = useAuth();

    const [review, setReview] = useState<Review | null>(null);
    const [ratingInput, setRatingInput] = useState('');
    const [titleInput, setTitleInput] = useState('');
    const [contentInput, setContentInput] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const titleInputRef = useRef<TextInput | null>(null);

    const canEdit = session && review && (session.user.id === review.user_id || isAdmin);

    const loadReview = useCallback(async () => {
        if (!reviewId) {
        setError('Invalid review id.');
        setLoading(false);
        return;
        }

        setLoading(true);
        setError(null);

        try {
        const payload = await getReview(reviewId);
        setReview(payload);
        setRatingInput(String(payload.rating));
        setTitleInput(payload.title ?? '');
        setContentInput(payload.content ?? '');
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load review.');
        } finally {
        setLoading(false);
        }
    }, [reviewId]);

    useEffect(() => {
        loadReview();
    }, [loadReview]);

    const onSave = async () => {
        if (!session || !review || !canEdit) {
        setError('You are not allowed to edit this review.');
        return;
        }

        const ratingValue = Number(ratingInput);
        if (!Number.isInteger(ratingValue) || ratingValue < 1 || ratingValue > 5) {
        setError('Rating must be an integer between 1 and 5.');
        return;
        }

        setSaving(true);
        setError(null);

        try {
        await updateReview(session.token, review.id, {
            rating: ratingValue,
            title: titleInput.trim(),
            content: contentInput.trim(),
        });
        await loadReview();
        } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : 'Save failed.');
        } finally {
        setSaving(false);
        }
    };

    const onDelete = async () => {
        if (!session || !review || !canEdit) {
        return;
        }

        setSaving(true);
        setError(null);

        try {
        await deleteReview(session.token, review.id);
        router.replace('/reviews');
        } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : 'Delete failed.');
        setSaving(false);
        }
    };

    const onLike = async () => {
        if (!session || !review) {
        setError('Login required to like this review.');
        return;
        }

        try {
        await toggleReviewLike(session.token, review.id);
        await loadReview();
        } catch (likeError) {
        setError(likeError instanceof Error ? likeError.message : 'Like action failed.');
        }
    };

    const mobileRefreshControl =
        Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadReview} />;

    return (
        <ScrollView contentContainerStyle={styles.container} refreshControl={mobileRefreshControl}>
        <BackNavButton fallbackHref="/reviews" />
        <Text style={styles.title}>Review detail</Text>

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}

        {review ? (
            <View style={styles.card}>
            <Text style={styles.text}>{review.album_title}</Text>
            <Text style={styles.text}>{review.artist_name}</Text>
            <Text style={styles.text}>Author: {review.author}</Text>
            <Text style={styles.text}>Rating: {review.rating}</Text>
            {review.title ? <Text style={styles.text}>{review.title}</Text> : null}
            {review.content ? <Text style={styles.text}>{review.content}</Text> : null}
            <Text style={styles.text}>Likes: {review.likes_count}</Text>

            <View style={styles.row}>
                <Link href={{ pathname: '/album/[id]', params: { id: String(review.album_id) } }} style={styles.link}>
                Open album
                </Link>
                <LiquidGlassButton label="Like" variant="secondary" size="sm" onPress={onLike} />
            </View>
            </View>
        ) : null}

        {canEdit ? (
            <View style={styles.card}>
            <Text style={styles.subtitle}>Edit review</Text>
            <TextInput
                value={ratingInput}
                onChangeText={setRatingInput}
                placeholder="Rating (1-5)"
                keyboardType="number-pad"
                returnKeyType="next"
                onSubmitEditing={() => titleInputRef.current?.focus()}
                style={styles.input}
            />
            <TextInput
                ref={titleInputRef}
                value={titleInput}
                onChangeText={setTitleInput}
                placeholder="Title (optional)"
                returnKeyType="done"
                onSubmitEditing={onSave}
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
                label={saving ? 'Saving...' : 'Save'}
                variant="primary"
                size="sm"
                onPress={onSave}
                loading={saving}
                />
                <LiquidGlassButton
                label="Delete"
                variant="destructive"
                size="sm"
                onPress={onDelete}
                disabled={saving}
                />
            </View>
            </View>
        ) : null}
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
    row: {
        flexDirection: 'row',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
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
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
