import { QueryClient, QueryClientProvider, onlineManager } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';
import { AuthProvider } from '@/context/auth-context';
import { DesktopTopNav } from '@/components/navigation/DesktopTopNav';
import { DesignTokens } from '@/constants/design-system';
import { Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
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
  const [isTouchWebDevice, setIsTouchWebDevice] = useState(false);
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

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia?.('(pointer: coarse)');

    const evaluateTouchCapabilities = () => {
      const hasTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints > 0;
      const hasCoarsePointer = mediaQuery ? mediaQuery.matches : false;
      const isMobileUA =
        typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);

      setIsTouchWebDevice(Boolean(hasTouchPoints || hasCoarsePointer || isMobileUA));
    };

    evaluateTouchCapabilities();
    mediaQuery?.addEventListener?.('change', evaluateTouchCapabilities);

    return () => {
      mediaQuery?.removeEventListener?.('change', evaluateTouchCapabilities);
    };
  }, []);

  const isWeb = Platform.OS === 'web';
  const isDesktopWeb = isWeb && !isTouchWebDevice && width >= 1024;
  const shouldShowWebTopNav = isWeb;
  const tabContentStyle = styles.stackContent;
  const nonTabContentStyle = !isDesktopWeb
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
          {shouldShowWebTopNav ? <DesktopTopNav pathname={pathname} isTouchDevice={isTouchWebDevice} /> : null}

          <View style={styles.stackArea}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: styles.stackContent,
              }}>
              <Stack.Screen name="(tabs)" options={{ contentStyle: tabContentStyle }} />
              <Stack.Screen name="login" options={{ contentStyle: nonTabContentStyle }} />
              <Stack.Screen name="register" options={{ contentStyle: nonTabContentStyle }} />
              <Stack.Screen name="album/[id]" options={{ contentStyle: nonTabContentStyle }} />
              <Stack.Screen name="artist/[id]" options={{ contentStyle: nonTabContentStyle }} />
              <Stack.Screen name="review/[id]" options={{ contentStyle: nonTabContentStyle }} />
              <Stack.Screen name="review/create" options={{ contentStyle: nonTabContentStyle }} />
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
