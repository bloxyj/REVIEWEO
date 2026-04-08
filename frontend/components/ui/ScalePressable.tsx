import { DesignTokens } from '@/constants/design-system';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import type { ReactNode } from 'react';

type ScalePressableProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  containerStyle?: StyleProp<ViewStyle> | ((state: PressableStateCallbackType) => StyleProp<ViewStyle>);
  contentStyle?: StyleProp<ViewStyle>;
  pressScale?: number;
};

export function ScalePressable({
  children,
  containerStyle,
  contentStyle,
  pressScale = DesignTokens.motion.pressScale,
  hitSlop,
  onPressIn,
  onPressOut,
  ...props
}: ScalePressableProps) {
  const prefersReducedMotion = useReducedMotionPreference();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn: PressableProps['onPressIn'] = (event) => {
    scale.value = withTiming(prefersReducedMotion ? 1 : pressScale, {
      duration: prefersReducedMotion ? 0 : DesignTokens.motion.durationFast,
    });
    onPressIn?.(event);
  };

  const handlePressOut: PressableProps['onPressOut'] = (event) => {
    scale.value = withTiming(1, {
      duration: prefersReducedMotion ? 0 : DesignTokens.motion.durationMedium,
    });
    onPressOut?.(event);
  };

  return (
    <Pressable {...props} style={containerStyle} onPressIn={handlePressIn} onPressOut={handlePressOut} hitSlop={hitSlop ?? 6}>
      <Animated.View style={[styles.content, animatedStyle, contentStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: {
    width: '100%',
    minHeight: 44,
  },
});
