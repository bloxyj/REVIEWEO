import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { useAuth } from '@/context/auth-context';
import { listAlbums, listArtists, listReviews } from '@/lib/api';
import type { Album, Artist, Review } from '@/lib/types';
import { Link } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const { session, clearSession } = useAuth();
    const [albums, setAlbums] = useState<Album[]>([]);
    const [artists, setArtists] = useState<Artist[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadHome = async () => {
        setLoading(true);
        setError(null);

        try {
        const [albumsPayload, artistsPayload, reviewsPayload] = await Promise.all([
            listAlbums({ limit: 60 }),
            listArtists(),
            listReviews({ limit: 60 }),
        ]);

        setAlbums(albumsPayload);
        setArtists(artistsPayload);
        setReviews(reviewsPayload);
        } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Could not load home feed.');
        } finally {
        setLoading(false);
        }
    };

    useEffect(() => {
        loadHome();
    }, []);

    const topAlbums = useMemo(() => {
        return [...albums]
        .sort((left, right) => {
            const leftAverage = left.average_rating ?? 0;
            const rightAverage = right.average_rating ?? 0;

            if (leftAverage !== rightAverage) {
            return rightAverage - leftAverage;
            }

            return right.ratings_count - left.ratings_count;
        })
        .slice(0, 6);
    }, [albums]);

    const trendingArtists = useMemo(() => {
        return [...artists].sort((left, right) => right.followers - left.followers).slice(0, 6);
    }, [artists]);

    const featuredReviews = useMemo(() => {
        return reviews.slice(0, 6);
    }, [reviews]);

    const mobileRefreshControl =
        Platform.OS === 'web' ? undefined : <RefreshControl refreshing={loading} onRefresh={loadHome} />;

    return (
        <ScrollView contentContainerStyle={styles.container} refreshControl={mobileRefreshControl}>
        <View style={styles.hero}>
            <Text style={styles.brand}>REVIEWEO</Text>
            <Text style={styles.subtitle}>Discover releases, track charts, and follow what people are rating now.</Text>

            <View style={styles.pillRow}>
            <Link href="/charts" style={styles.pillLink}>
                Charts
            </Link>
            <Link href="/reviews" style={styles.pillLink}>
                Reviews
            </Link>
            <Link href="/search" style={styles.pillLink}>
                Search
            </Link>
            </View>

            {session ? (
            <View style={styles.authRow}>
                <Text style={styles.authText}>Signed in as {session.user.username}</Text>
                <LiquidGlassButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
            </View>
            ) : (
            <View style={styles.authRow}>
                <Text style={styles.authText}>Sign in to write ratings and reviews.</Text>
                <View style={styles.pillRow}>
                <Link href="/login" style={styles.pillLink}>
                    Login
                </Link>
                <Link href="/register" style={styles.pillLink}>
                    Register
                </Link>
                </View>
            </View>
            )}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Community Snapshot</Text>
            <View style={styles.statsRow}>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>{albums.length}</Text>
                <Text style={styles.statLabel}>Albums tracked</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>{artists.length}</Text>
                <Text style={styles.statLabel}>Artists</Text>
            </View>
            <View style={styles.statCard}>
                <Text style={styles.statValue}>{reviews.length}</Text>
                <Text style={styles.statLabel}>Recent reviews</Text>
            </View>
            </View>
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Albums Right Now</Text>
            {topAlbums.length === 0 ? <Text style={styles.text}>No album data available.</Text> : null}
            {topAlbums.map((album, index) => (
            <View key={album.id} style={styles.listRow}>
                <Text style={styles.rowTitle}>
                #{index + 1} {album.title}
                </Text>
                <Text style={styles.text}>
                {album.artist_name} • {album.release_year} • Avg {album.average_rating ?? 'n/a'}
                </Text>
                <Link href={{ pathname: '/album/[id]', params: { id: String(album.id) } }} style={styles.rowLink}>
                Open album
                </Link>
            </View>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Reviews</Text>
            {featuredReviews.length === 0 ? <Text style={styles.text}>No review data available.</Text> : null}
            {featuredReviews.map((review) => (
            <View key={review.id} style={styles.listRow}>
                <Text style={styles.rowTitle}>{review.title || `${review.album_title} review`}</Text>
                <Text style={styles.text}>
                {review.author} • {review.artist_name} • Rating {review.rating}
                </Text>
                {review.content ? <Text style={styles.text}>{review.content}</Text> : null}
                <Link href={{ pathname: '/review/[id]', params: { id: String(review.id) } }} style={styles.rowLink}>
                Open review
                </Link>
            </View>
            ))}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Trending Artists</Text>
            {trendingArtists.length === 0 ? <Text style={styles.text}>No artist data available.</Text> : null}
            {trendingArtists.map((artist) => (
            <View key={artist.id} style={styles.listRow}>
                <Text style={styles.rowTitle}>{artist.name}</Text>
                <Text style={styles.text}>Followers: {artist.followers}</Text>
                <Link href={{ pathname: '/artist/[id]', params: { id: String(artist.id) } }} style={styles.rowLink}>
                Open artist
                </Link>
            </View>
            ))}
        </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 12,
    },
    hero: {
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 8,
        padding: 14,
        gap: 10,
        backgroundColor: '#ffffff',
    },
    brand: {
        color: '#000000',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: 0.4,
    },
    subtitle: {
        color: '#000000',
        fontSize: 14,
    },
    authRow: {
        gap: 8,
    },
    authText: {
        color: '#000000',
        fontSize: 14,
        fontWeight: '500',
    },
    pillRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    pillLink: {
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 999,
        paddingHorizontal: 10,
        paddingVertical: 6,
        color: '#000000',
        textDecorationLine: 'none',
        fontSize: 13,
        fontWeight: '600',
    },
    section: {
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 8,
        padding: 12,
        gap: 8,
        backgroundColor: '#ffffff',
    },
    sectionTitle: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '700',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    statCard: {
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 6,
        paddingHorizontal: 10,
        paddingVertical: 8,
        minWidth: 120,
        gap: 2,
    },
    statValue: {
        color: '#000000',
        fontSize: 20,
        fontWeight: '700',
    },
    statLabel: {
        color: '#000000',
        fontSize: 12,
    },
    listRow: {
        borderTopWidth: 1,
        borderTopColor: '#000000',
        paddingTop: 8,
        gap: 4,
    },
    rowTitle: {
        color: '#000000',
        fontSize: 15,
        fontWeight: '700',
    },
    rowLink: {
        color: '#000000',
        textDecorationLine: 'underline',
        fontSize: 14,
        alignSelf: 'flex-start',
    },
    text: {
        color: '#000000',
        fontSize: 14,
    },
    errorText: {
        color: '#000000',
        fontSize: 14,
        borderWidth: 1,
        borderColor: '#000000',
        borderRadius: 8,
        padding: 10,
    },
});
