import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const { session, clearSession } = useAuth();



    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>REVIEWEO</Text>
        {session && <Text style={styles.username}>{session?.user.username}</Text>}
        {!session && (
            <Link href="/login" style={styles.sessionLink}>
                Login
            </Link>
        )}

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Featured Reviews</Text>

        </View>

        <View style={styles.section}>

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
        paddingBottom: 10,
    },
    username: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000000',
        display : 'flex',
    },

    sessionLink: {
        color: '#000000',
        textDecorationLine: 'underline',
        fontSize: 13,
        display : 'flex',
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
        borderRadius: 6,
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
