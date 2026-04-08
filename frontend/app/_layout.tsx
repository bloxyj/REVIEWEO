import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider } from '@/context/auth-context';
import { DesktopTopNav } from '@/components/navigation/DesktopTopNav';
import { DesignTokens } from '@/constants/design-system';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

onlineManager.setEventListener((setOnline) => {
  return NetInfo.addEventListener((state) => {
    const hasInternet = state.isInternetReachable ?? true;
    setOnline(Boolean(state.isConnected) && hasInternet);
  });
});

export default function RootLayout() {
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 0,
          },
        },
      })
  );

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
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>

      <StatusBar style="dark" />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: DesignTokens.colors.canvas,
  },
  stackArea: {
    flex: 1,
  },
  stackContent: {
    backgroundColor: DesignTokens.colors.canvas,
  },
});
