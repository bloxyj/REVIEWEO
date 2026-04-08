import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { listAlbums } from '@/lib/api';
import type { Album } from '@/lib/types';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function AlbumsScreen() {
    const [albums, setAlbums] = useState<Album[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');

    const loadAlbums = async () => {
    setLoading(true);
    setError(null);

    try {
        const items = await listAlbums({ limit: 200 });
        setAlbums(items);
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load albums.');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadAlbums();
    }, []);

    const filtered = useMemo(() => {
        const normalized = query.trim().toLowerCase();

        if (normalized === '') {
        return albums;
        }

        return albums.filter(
        (album) =>
            album.title.toLowerCase().includes(normalized) || album.artist_name.toLowerCase().includes(normalized)
        );
    }, [albums, query]);

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Albums</Text>
        <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filter by album or artist"
            style={styles.input}
        />
        <LiquidGlassButton label="Refresh" variant="secondary" size="sm" onPress={loadAlbums} />

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}
        {!loading && !error && filtered.length === 0 ? <Text style={styles.text}>No albums found.</Text> : null}

        {filtered.map((album) => (
            <View key={album.id} style={styles.card}>
            <Text style={styles.text}>{album.title}</Text>
            <Text style={styles.text}>{album.artist_name}</Text>
            <Text style={styles.text}>Year: {album.release_year}</Text>
            <Text style={styles.text}>Avg: {album.average_rating ?? 'n/a'}</Text>
            <Link href={`/album/${album.id}`} style={styles.link}>
                Open album
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
        paddingBottom: 10,
    },
    text: {
        color: '#000000',
    },
    input: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 10,
        color: '#000000',
    },
    card: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 10,
        gap: 4,
        borderRadius: 6,
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
        fontSize: 15,
        borderColor: '#000000',
        borderWidth: 1,
        padding: 6,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
});
