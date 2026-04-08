import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
    const { session, clearSession } = useAuth();



    return (
        <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Settings</Text>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account</Text>
            {session ? (
            <>
                <Text style={styles.text}>Logged in as {session.user.username}</Text>
                <Text style={styles.text}>Role: {session.user.role}</Text>
                <LiquidGlassButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
            </>
            ) : (
            <>
                <Text style={styles.text}>Your not logged in.</Text>
                <Link href="/login" style={styles.sessionLink}>
                Login
                </Link>
                <Text style={styles.text}>
                or
                </Text>
                <Link href="/register" style={styles.sessionLink}>
                Register
                </Link>
            </>
            )}
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Browse</Text>
            <Link href="/reviews" style={styles.link}>
            Notifications 
            </Link>
            <Link href="/reviews" style={styles.link}>
            Privacy and security
            </Link>
            <Link href="/reviews" style={styles.link}>
            Connected accounts
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
        paddingBottom: 10,
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
    sessionLink: {
        color: '#000000',
        textDecorationLine: 'underline',
        fontSize: 17,
    },
});
