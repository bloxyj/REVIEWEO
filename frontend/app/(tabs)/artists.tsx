import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { listArtists } from '@/lib/api';
import type { Artist } from '@/lib/types';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function ArtistsScreen() {
    const [artists, setArtists] = useState<Artist[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadArtists = async () => {
        setLoading(true);
        setError(null);

        try {
        const items = await listArtists();
        setArtists(items);
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load artists.');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadArtists();
    }, []);

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Artists</Text>
        <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadArtists} />

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}

        {!loading && !error && artists.length === 0 ? <Text style={styles.text}>No artists found.</Text> : null}

        {artists.map((artist) => (
            <View key={artist.id} style={styles.card}>
            <Text style={styles.text}>{artist.name}</Text>
            <Text style={styles.text}>Followers: {artist.followers}</Text>
            <Link href={`/artist/${artist.id}`} style={styles.link}>
                Open artist
            </Link>
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
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
