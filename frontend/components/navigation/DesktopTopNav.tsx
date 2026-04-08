import { useAuth } from '@/context/auth-context';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { desktopNavLinks, isActivePath } from '@/lib/nav-links';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

type DesktopTopNavProps = {
    pathname: string;
};

export function DesktopTopNav({ pathname }: DesktopTopNavProps) {
    const { session, clearSession } = useAuth();

    return (
        <View style={styles.wrapper}>
        <View style={styles.brandArea}>
            <Link href="/" style={styles.brand}>
            REVIEWEO
            </Link>
        </View>

        <View style={styles.linksArea}>
            {desktopNavLinks.map((item) => {
            const active = isActivePath(pathname, item.matchPatterns);

            return (
                <Link key={item.label} href={item.href} style={[styles.link, active ? styles.activeLink : null]}>
                {item.label}
                </Link>
            );
            })}
        </View>

        <View style={styles.authArea}>
            {session ? (
            <>
                <Text style={styles.userText}>{session.user.username}</Text>
                <LiquidGlassButton label="Logout" variant="nav" size="sm" onPress={clearSession} />
            </>
            ) : (
            <>
                <Link href="/login" style={styles.authLink}>
                Login
                </Link>
                <Link href="/register" style={styles.authLink}>
                Register
                </Link>
            </>
            )}
        </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottomWidth: 1,
        borderBottomColor: '#000000',
        backgroundColor: '#ffffff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        gap: 12,
    },
    brandArea: {
        minWidth: 140,
    },
    brand: {
        color: '#000000',
        fontSize: 20,
        fontWeight: '700',
        textDecorationLine: 'none',
    },
    linksArea: {
        flexDirection: 'row',
        gap: 14,
        flex: 1,
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    link: {
        color: '#000000',
        fontSize: 14,
        textDecorationLine: 'none',
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    activeLink: {
        borderWidth: 1,
        borderColor: '#000000',
    },
    authArea: {
        minWidth: 190,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 10,
        flexWrap: 'wrap',
    },
    authLink: {
        color: '#000000',
        textDecorationLine: 'underline',
        fontSize: 14,
    },
    userText: {
        color: '#000000',
        fontSize: 13,
    },
});
