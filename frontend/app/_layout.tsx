import { AuthProvider } from '@/context/auth-context';
import { DesktopTopNav } from '@/components/navigation/DesktopTopNav';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function RootLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isDesktop = Platform.OS === 'web' && width >= 1024;
  const tabContentStyle = styles.stackContent;
  const nonTabContentStyle = !isDesktop
    ? [
        styles.stackContent,
        {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]
    : styles.stackContent;

  return (
    <AuthProvider>
      <View style={styles.shell}>
        {isDesktop ? <DesktopTopNav pathname={pathname} /> : null}

        <View style={styles.stackArea}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: styles.stackContent,
            }}>
            <Stack.Screen name="(tabs)" options={{ contentStyle: tabContentStyle }} />
            <Stack.Screen name="login" options={{ contentStyle: nonTabContentStyle }} />
            <Stack.Screen name="register" options={{ contentStyle: nonTabContentStyle }} />
            <Stack.Screen name="charts" options={{ contentStyle: nonTabContentStyle }} />
            <Stack.Screen name="admin" options={{ contentStyle: nonTabContentStyle }} />
          </Stack>
        </View>
      </View>

      <StatusBar style="dark" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  stackArea: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: '#ffffff',
  },
});
