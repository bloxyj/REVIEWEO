import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const { session, clearSession } = useAuth();

    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>REVIEWEO</Text>
        <Text style={styles.text}>Minimal cross-platform frontend (mobile + web).</Text>
        <Text style={styles.text}>API routes are connected to the backend.</Text>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Session</Text>
            {session ? (
            <>
                <Text style={styles.text}>Logged in as {session.user.username}</Text>
                <Text style={styles.text}>Role: {session.user.role}</Text>
                <LiquidGlassButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
            </>
            ) : (
            <>
                <Text style={styles.text}>Not logged in.</Text>
                <Link href="/login" style={styles.link}>
                Go to Login
                </Link>
                <Link href="/register" style={styles.link}>
                Go to Register
                </Link>
            </>
            )}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse</Text>
            <Link href="/artists" style={styles.link}>
            Artists
            </Link>
            <Link href="/albums" style={styles.link}>
            Albums
            </Link>
            <Link href="/reviews" style={styles.link}>
            Reviews
            </Link>
            <Link href="/search" style={styles.link}>
            Search
            </Link>
            <Link href="/charts" style={styles.link}>
            Charts
            </Link>
            <Link href="/admin" style={styles.link}>
            Admin
            </Link>
        </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        gap: 12,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000000',
    },
    text: {
        color: '#000000',
        fontSize: 14,
    },
    section: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 12,
        gap: 8,
    },
    sectionTitle: {
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
        fontSize: 15,
    },
});
