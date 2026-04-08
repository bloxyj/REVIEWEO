import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { getCharts } from '@/lib/api';
import type { ChartResponse } from '@/lib/types';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ChartsScreen() {
    const [year, setYear] = useState('');
    const [genre, setGenre] = useState('');
    const [releaseType, setReleaseType] = useState('');
    const [result, setResult] = useState<ChartResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadCharts = async () => {
        setLoading(true);
        setError(null);

        try {
        const payload = await getCharts({
            year: year.trim() === '' ? undefined : Number(year),
            genre: genre.trim() === '' ? undefined : genre.trim(),
            release_type: releaseType.trim() === '' ? undefined : releaseType.trim(),
            min_ratings: 1,
            limit: 50,
        });

        setResult(payload);
        } catch (chartsError) {
        setError(chartsError instanceof Error ? chartsError.message : 'Could not load charts.');
        } finally {
        setLoading(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <BackNavButton />
        <Text style={styles.title}>Charts</Text>

        <TextInput
            value={year}
            onChangeText={setYear}
            placeholder="Year (optional)"
            keyboardType="number-pad"
            returnKeyType="search"
            onSubmitEditing={loadCharts}
            style={styles.input}
        />
        <TextInput
            value={genre}
            onChangeText={setGenre}
            placeholder="Genre (optional)"
            returnKeyType="search"
            onSubmitEditing={loadCharts}
            style={styles.input}
        />
        <TextInput
            value={releaseType}
            onChangeText={setReleaseType}
            placeholder="release_type (optional)"
            returnKeyType="search"
            onSubmitEditing={loadCharts}
            style={styles.input}
        />

        <LiquidGlassButton
            label={loading ? 'Loading...' : 'Load charts'}
            variant="primary"
            size="sm"
            onPress={loadCharts}
            loading={loading}
        />

        {error ? <Text style={styles.text}>{error}</Text> : null}

        {result ? (
            <View style={styles.card}>
            {result.items.length === 0 ? <Text style={styles.text}>No chart entries found.</Text> : null}
            {result.items.map((item) => (
                <View key={item.id} style={styles.entry}>
                <Text style={styles.text}>
                    #{item.rank} {item.title} - {item.artist_name}
                </Text>
                <Text style={styles.text}>
                    Year: {item.release_year} | Avg: {item.average_rating} | Ratings: {item.ratings_count}
                </Text>
                <Text style={styles.text}>Genres: {item.genres.join(', ') || 'n/a'}</Text>
                <Link href={{ pathname: '/album/[id]', params: { id: String(item.id) } }} style={styles.link}>
                    Open album
                </Link>
                </View>
            ))}
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
        gap: 8,
    },
    entry: {
        gap: 3,
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        paddingBottom: 8,
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
