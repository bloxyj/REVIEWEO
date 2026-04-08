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

  return (
    <AuthProvider>
      <View style={styles.shell}>
        {isDesktop ? <DesktopTopNav pathname={pathname} /> : null}

        <View style={styles.stackArea}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: [
                styles.stackContent,
                !isDesktop
                  ? [
                      {
                        paddingTop: Math.max(insets.top, 16),
                        paddingBottom: Platform.OS === 'ios' ? Math.max(insets.bottom, 16) : 0,
                      },
                    ]
                  : null,
              ],
            }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="login" />
            <Stack.Screen name="register" />
            <Stack.Screen name="charts" />
            <Stack.Screen name="admin" />
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
