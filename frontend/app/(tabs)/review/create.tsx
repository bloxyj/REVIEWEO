import { useAuth } from '@/context/auth-context';
import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { createAlbumReview } from '@/lib/api';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View, ScrollView, Alert } from 'react-native';

export default function CreateReviewScreen() {
    const router = useRouter();
    const { session, isAdmin } = useAuth();

    const [albumId, setAlbumId] = useState('');
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [rating, setRating] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const titleInputRef = useRef<TextInput | null>(null);
    const ratingInputRef = useRef<TextInput | null>(null);

    const isCritique = session?.user.role === 'critique';
    if (!isAdmin && !isCritique) {
        return (
            <View style={styles.container}>
                <BackNavButton />
                <Text style={styles.title}>Access Denied</Text>
                <Text style={styles.text}>Only critics and admins can write reviews.</Text>
            </View>
        );
    }

    const onSubmit = async () => {
        if (!albumId || !title || !content || !rating) {
            setError('Please fill all fields.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await createAlbumReview(session!.token, Number(albumId), {
                title: title.trim(),
                content: content.trim(),
                rating: Number(rating),
            });
            Alert.alert('Success', 'Your review has been published!');
            router.replace('/reviews'); 
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to publish review.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <BackNavButton />
            <Text style={styles.title}>Write a Review</Text>
            
            <View style={styles.section}>
                <TextInput
                    value={albumId}
                    onChangeText={setAlbumId}
                    placeholder="Album ID (e.g. 1)"
                    keyboardType="number-pad"
                    returnKeyType="next"
                    onSubmitEditing={() => titleInputRef.current?.focus()}
                    style={styles.input}
                />
                <TextInput
                    ref={titleInputRef}
                    value={title}
                    onChangeText={setTitle}
                    placeholder="Review Title"
                    returnKeyType="next"
                    onSubmitEditing={() => ratingInputRef.current?.focus()}
                    style={styles.input}
                />
                <TextInput
                    ref={ratingInputRef}
                    value={rating}
                    onChangeText={setRating}
                    placeholder="Rating (1-5)"
                    keyboardType="number-pad"
                    maxLength={1}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                    style={styles.input}
                />
                <TextInput
                    value={content}
                    onChangeText={setContent}
                    placeholder="Your detailed review..."
                    multiline
                    numberOfLines={6}
                    style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                />

                {error ? <Text style={{ color: 'red' }}>{error}</Text> : null}

                <LiquidGlassButton
                    label={loading ? 'Publishing...' : 'Publish Review'}
                    variant="primary"
                    onPress={onSubmit}
                    loading={loading}
                />
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { padding: 16, gap: 12 },
    title: { fontSize: 22, fontWeight: '700', color: '#000' },
    text: { color: '#000' },
    section: { borderWidth: 1, borderColor: '#000', padding: 12, gap: 10 },
    input: { borderWidth: 1, borderColor: '#000', padding: 10, color: '#000' },
});
