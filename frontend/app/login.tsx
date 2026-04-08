import { useAuth } from '@/context/auth-context';
import { BackNavButton } from '@/components/navigation/BackNavButton';
import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { login } from '@/lib/api';
import { Link, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
    const router = useRouter();
    const { setSession } = useAuth();
    const passwordInputRef = useRef<TextInput | null>(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const onSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
        const payload = await login(email.trim(), password);
        setSession(payload);
        router.replace('/');
        } catch (submitError) {
        setError(submitError instanceof Error ? submitError.message : 'Login failed.');
        } finally {
        setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
        <BackNavButton />
        <Text style={styles.title}>Login</Text>

        <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            style={styles.input}
        />

        <TextInput
            ref={passwordInputRef}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            secureTextEntry
            returnKeyType="done"
            onSubmitEditing={onSubmit}
            style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <LiquidGlassButton
            label={loading ? 'Loading...' : 'Login'}
            variant="primary"
            onPress={onSubmit}
            loading={loading}
            fullWidth
        />

        <Link href="/register" style={styles.link}>
            Need an account? Register
        </Link>
        </View>
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
    input: {
        borderWidth: 1,
        borderColor: '#000000',
        padding: 10,
        color: '#000000',
    },
    error: {
        color: '#000000',
        fontSize: 13,
    },
    link: {
        color: '#000000',
        textDecorationLine: 'underline',
    },
});
