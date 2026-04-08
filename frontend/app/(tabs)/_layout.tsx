import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';
import { DynamicColorIOS, Platform } from 'react-native';

const iosAdaptiveTint =
  Platform.OS === 'ios'
    ? DynamicColorIOS({
        light: '#111111',
        dark: '#ffffff',
      })
    : '#111111';

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={iosAdaptiveTint}
      minimizeBehavior="onScrollDown"
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="home" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="artists">
        <Label>Artists</Label>
        <Icon
          sf={{ default: 'person.2', selected: 'person.2.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="people" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="albums">
        <Label>Albums</Label>
        <Icon
          sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="album" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon
          sf={{ default: 'gear', selected: 'gear' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="settings" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="search" role="search">
        <Label>Search</Label>
        <Icon
          sf="magnifyingglass"
          androidSrc={<VectorIcon family={MaterialIcons} name="search" />}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
