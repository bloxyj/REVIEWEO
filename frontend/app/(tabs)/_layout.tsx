import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { DesignTokens } from '@/constants/design-system';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  return (
    <NativeTabs
      tintColor={DesignTokens.colors.textPrimary}
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

      <NativeTabs.Trigger name="reviews">
        <Label>Reviews</Label>
        <Icon
          sf={{ default: 'rectangle.stack', selected: 'rectangle.stack.fill' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="album" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="create-review">
        <Label>Write</Label>
        <Icon
          sf={{ default: 'square.and.pencil', selected: 'square.and.pencil' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="edit" />}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Label>Settings</Label>
        <Icon
          sf={{ default: 'gear', selected: 'gear' }}
          androidSrc={<VectorIcon family={MaterialIcons} name="person" />}
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
