import { DesignTokens } from '@/constants/design-system';
import { useReducedMotionPreference } from '@/lib/use-reduced-motion';
import * as Haptics from 'expo-haptics';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  type AccessibilityRole,
  Platform,
  Pressable,
  type PressableStateCallbackType,
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type LiquidGlassButtonVariant = 'primary' | 'secondary' | 'toggle' | 'destructive' | 'nav';
type LiquidGlassButtonSize = 'sm' | 'md';

type LiquidGlassButtonProps = {
  label: string;
  onPress: () => void;
  variant?: LiquidGlassButtonVariant;
  size?: LiquidGlassButtonSize;
  disabled?: boolean;
  loading?: boolean;
  active?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  testID?: string;
};

export function LiquidGlassButton({
  label,
  onPress,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  loading = false,
  active = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityRole = 'button',
  style,
  textStyle,
  testID,
}: LiquidGlassButtonProps) {
  const isDisabled = disabled || loading;
  const shouldReduceMotion = useReducedMotionPreference();
  const [isFocused, setIsFocused] = useState(false);

  const handlePress = useCallback(() => {
    if (isDisabled) {
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    }

    onPress();
  }, [isDisabled, onPress]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const renderStyle = useCallback(
    ({ pressed, hovered }: PressableStateCallbackType) => {
      const emphasized = pressed || hovered;
      const isInverted = variant === 'primary' || variant === 'destructive' || (variant === 'toggle' && active);

      return [
        styles.base,
        size === 'sm' ? styles.small : styles.medium,
        variantStyles[variant],
        fullWidth ? styles.fullWidth : null,
        active && variant === 'toggle' ? styles.toggleActive : null,
        emphasized && !isDisabled ? styles.emphasized : null,
        emphasized && !isDisabled && isInverted ? styles.emphasizedInverted : null,
        pressed && !isDisabled && !shouldReduceMotion ? styles.pressed : null,
        isFocused && !isDisabled ? styles.focused : null,
        isDisabled ? styles.disabled : null,
        style,
      ];
    },
    [active, fullWidth, isDisabled, isFocused, shouldReduceMotion, size, style, variant]
  );

  const resolvedTextStyle = [
    styles.text,
    textVariantStyles[variant],
    active && variant === 'toggle' ? styles.toggleActiveText : null,
    isDisabled ? styles.disabledText : null,
    textStyle,
  ];

  const indicatorColor =
    variant === 'primary' || variant === 'destructive' || (variant === 'toggle' && active)
      ? DesignTokens.colors.inverseText
      : DesignTokens.colors.textPrimary;

  return (
    <Pressable
      testID={testID}
      onPress={handlePress}
      onFocus={handleFocus}
      onBlur={handleBlur}
      style={renderStyle}
      disabled={isDisabled}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{
        disabled: isDisabled,
        busy: loading,
        selected: variant === 'toggle' ? active : undefined,
      }}
      hitSlop={6}
    >
      {loading ? <ActivityIndicator size="small" color={indicatorColor} /> : null}
      <Text style={resolvedTextStyle}>{label}</Text>
    </Pressable>
  );
}

const variantStyles: Record<LiquidGlassButtonVariant, ViewStyle> = StyleSheet.create({
  primary: {
    borderColor: DesignTokens.colors.inverseSurface,
    backgroundColor: DesignTokens.colors.inverseSurface,
  },
  secondary: {
    borderColor: DesignTokens.colors.border,
    backgroundColor: 'rgba(255, 254, 252, 0.86)',
  },
  toggle: {
    borderColor: DesignTokens.colors.border,
    backgroundColor: 'rgba(241, 239, 234, 0.86)',
  },
  destructive: {
    borderColor: DesignTokens.colors.dangerText,
    backgroundColor: DesignTokens.colors.dangerText,
  },
  nav: {
    borderColor: DesignTokens.colors.border,
    backgroundColor: 'rgba(241, 239, 234, 0.92)',
  },
});

const textVariantStyles: Record<LiquidGlassButtonVariant, TextStyle> = StyleSheet.create({
  primary: {
    color: DesignTokens.colors.inverseText,
  },
  secondary: {
    color: DesignTokens.colors.textPrimary,
  },
  toggle: {
    color: DesignTokens.colors.textSecondary,
  },
  destructive: {
    color: DesignTokens.colors.inverseText,
  },
  nav: {
    color: DesignTokens.colors.textPrimary,
  },
});

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: DesignTokens.radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: DesignTokens.spacing.xs,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  medium: {
    minHeight: 44,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: DesignTokens.radius.md,
  },
  small: {
    minHeight: 44,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: DesignTokens.radius.sm,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  toggleActive: {
    backgroundColor: DesignTokens.colors.inverseSurface,
    borderColor: DesignTokens.colors.inverseSurface,
  },
  toggleActiveText: {
    color: DesignTokens.colors.inverseText,
  },
  emphasized: {
    backgroundColor: 'rgba(241, 239, 234, 0.96)',
  },
  emphasizedInverted: {
    backgroundColor: DesignTokens.colors.inverseSurface,
  },
  focused: {
    borderColor: DesignTokens.colors.accentBlueText,
  },
  pressed: {
    transform: [{ scale: DesignTokens.motion.pressScale }],
  },
  disabled: {
    opacity: 0.55,
  },
  text: {
    fontSize: DesignTokens.typography.bodySmall,
    fontWeight: '600',
  },
  disabledText: {
    opacity: 0.9,
  },
});
