import { getArtist, getArtistAlbums, getArtistTopTracks } from '@/lib/api';
import type { Album, ArtistDetail, ArtistTopTrack } from '@/lib/types';
import { Link, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

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

export default function ArtistDetailScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const artistId = parseId(params.id);

    const [artist, setArtist] = useState<ArtistDetail | null>(null);
    const [albums, setAlbums] = useState<Album[]>([]);
    const [topTracks, setTopTracks] = useState<ArtistTopTrack[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        if (!artistId) {
        setError('Invalid artist id.');
        setLoading(false);
        return;
        }

        setLoading(true);
        setError(null);

        try {
        const [artistPayload, albumsPayload, tracksPayload] = await Promise.all([
            getArtist(artistId),
            getArtistAlbums(artistId, { limit: 50 }),
            getArtistTopTracks(artistId, 10),
        ]);

        setArtist(artistPayload);
        setAlbums(albumsPayload);
        setTopTracks(tracksPayload);
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load artist details.');
        } finally {
        setLoading(false);
        }
    }, [artistId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const mobileRefreshControl =
        Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadData} />;

    return (
        <ScrollView contentContainerStyle={styles.container} refreshControl={mobileRefreshControl}>
        <Text style={styles.title}>Artist detail</Text>

        {loading ? <Text style={styles.text}>Loading...</Text> : null}
        {error ? <Text style={styles.text}>{error}</Text> : null}

        {artist ? (
            <View style={styles.card}>
            <Text style={styles.text}>{artist.name}</Text>
            <Text style={styles.text}>Followers: {artist.followers}</Text>
            <Text style={styles.text}>Genres: {artist.genres.map((genre) => genre.name).join(', ') || 'n/a'}</Text>
            <Text style={styles.text}>Related: {artist.related_artists.map((related) => related.name).join(', ') || 'n/a'}</Text>
            </View>
        ) : null}

        <View style={styles.card}>
            <Text style={styles.subtitle}>Albums</Text>
            {albums.length === 0 ? <Text style={styles.text}>No albums found.</Text> : null}
            {albums.map((album) => (
            <View key={album.id} style={styles.row}>
                <Text style={styles.text}>
                {album.title} ({album.release_year})
                </Text>
                <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} style={styles.link}>
                Open album
                </Link>
            </View>
            ))}
        </View>

        <View style={styles.card}>
            <Text style={styles.subtitle}>Top tracks</Text>
            {topTracks.length === 0 ? <Text style={styles.text}>No tracks found.</Text> : null}
            {topTracks.map((track) => (
            <Text key={track.id} style={styles.text}>
                {track.title} - {track.album_title}
            </Text>
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
    row: {
        gap: 4,
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
