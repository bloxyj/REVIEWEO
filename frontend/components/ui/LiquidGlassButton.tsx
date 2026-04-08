import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';
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

    const handlePress = useCallback(() => {
        if (isDisabled) {
            return;
        }

        if (Platform.OS !== 'web') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        }

        onPress();
    }, [isDisabled, onPress]);

    const renderStyle = useCallback(
        ({ pressed, hovered }: PressableStateCallbackType) => {
            const emphasized = pressed || hovered;
            const isInverted = variant === 'destructive' || (variant === 'toggle' && active);

            return [
                styles.base,
                size === 'sm' ? styles.small : styles.medium,
                variantStyles[variant],
                fullWidth ? styles.fullWidth : null,
                active && variant === 'toggle' ? styles.toggleActive : null,
                emphasized && !isDisabled ? styles.emphasized : null,
                emphasized && !isDisabled && isInverted ? styles.emphasizedInverted : null,
                isDisabled ? styles.disabled : null,
                style,
            ];
        },
        [active, fullWidth, isDisabled, size, style, variant]
    );

    const resolvedTextStyle = [
        styles.text,
        textVariantStyles[variant],
        active && variant === 'toggle' ? styles.toggleActiveText : null,
        isDisabled ? styles.disabledText : null,
        textStyle,
    ];

    const indicatorColor =
        variant === 'primary' || variant === 'destructive' || (variant === 'toggle' && active) ? '#ffffff' : '#000000';

    return (
        <Pressable
            testID={testID}
            onPress={handlePress}
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
        borderColor: '#000000',
        backgroundColor: '#000000',
    },
    secondary: {
        borderColor: '#000000',
        backgroundColor: '#ffffff',
    },
    toggle: {
        borderColor: '#000000',
        backgroundColor: '#ffffff',
    },
    destructive: {
        borderColor: '#000000',
        backgroundColor: '#8f1d1d',
    },
    nav: {
        borderColor: '#000000',
        backgroundColor: '#ffffff',
    },
});

const textVariantStyles: Record<LiquidGlassButtonVariant, TextStyle> = StyleSheet.create({
    primary: {
        color: '#ffffff',
    },
    secondary: {
        color: '#000000',
    },
    toggle: {
        color: '#000000',
    },
    destructive: {
        color: '#ffffff',
    },
    nav: {
        color: '#000000',
    },
});

const styles = StyleSheet.create({
    base: {
        minHeight: 40,
        borderWidth: 1,
        borderRadius: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingHorizontal: 14,
        paddingVertical: 9,
    },
    medium: {
        minHeight: 40,
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 18,
    },
    small: {
        minHeight: 34,
        paddingHorizontal: 10,
        paddingVertical: 7,
        borderRadius: 14,
    },
    fullWidth: {
        alignSelf: 'stretch',
    },
    toggleActive: {
        backgroundColor: '#000000',
        borderColor: '#000000',
    },
    toggleActiveText: {
        color: '#ffffff',
    },
    emphasized: {
        borderColor: '#000000',
        backgroundColor: '#f2f2f2',
    },
    emphasizedInverted: {
        backgroundColor: '#111111',
    },
    disabled: {
        opacity: 0.5,
    },
    text: {
        fontSize: 14,
        fontWeight: '600',
    },
    disabledText: {
        opacity: 0.85,
    },
});
