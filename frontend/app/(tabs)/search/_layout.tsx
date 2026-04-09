import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function SearchTabLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: Platform.OS === 'ios',
      }}
    />
  );
}
