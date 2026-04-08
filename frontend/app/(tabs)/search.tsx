import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { searchCatalog } from '@/lib/api';
import type { SearchResponse, SearchType } from '@/lib/types';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const SEARCH_TYPES: SearchType[] = ['all', 'artists', 'albums'];

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [type, setType] = useState<SearchType>('all');
    const [result, setResult] = useState<SearchResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onSearch = async () => {
        if (query.trim() === '') {
        setError('Enter a query first.');
        return;
        }

        setLoading(true);
        setError(null);

        try {
        const payload = await searchCatalog(query.trim(), type, 30);
        setResult(payload);
        } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Search failed.');
        } finally {
        setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Search</Text>

        <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search artists or albums"
            returnKeyType="search"
            onSubmitEditing={onSearch}
            style={styles.input}
        />

        <View style={styles.row}>
            {SEARCH_TYPES.map((entry) => (
            <LiquidGlassButton
                key={entry}
                label={entry}
                variant="toggle"
                size="sm"
                active={entry === type}
                onPress={() => setType(entry)}
                accessibilityRole="tab"
            />
            ))}
        </View>

        <LiquidGlassButton
            label={loading ? 'Searching...' : 'Search'}
            variant="primary"
            size="sm"
            onPress={onSearch}
            loading={loading}
        />

        {error ? <Text style={styles.text}>{error}</Text> : null}

        {result ? (
            <>
            <View style={styles.card}>
                <Text style={styles.subtitle}>Artists</Text>
                {result.artists.length === 0 ? <Text style={styles.text}>No artist matches.</Text> : null}
                {result.artists.map((artist) => (
                <View key={artist.id} style={styles.rowItem}>
                    <Text style={styles.text}>{artist.name}</Text>
                    <Link href={{ pathname: '/artist/[id]', params: { id: String(artist.id) } }} style={styles.link}>
                    Open artist
                    </Link>
                </View>
                ))}
            </View>

            <View style={styles.card}>
                <Text style={styles.subtitle}>Albums</Text>
                {result.albums.length === 0 ? <Text style={styles.text}>No album matches.</Text> : null}
                {result.albums.map((album) => (
                <View key={album.id} style={styles.rowItem}>
                    <Text style={styles.text}>
                    {album.title} - {album.artist_name}
                    </Text>
                    <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} style={styles.link}>
                    Open album
                    </Link>
                </View>
                ))}
            </View>
            </>
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
        paddingBottom: 10,
    },
    subtitle: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
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
        gap: 6,
    },
    row: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    rowItem: {
        gap: 3,
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
