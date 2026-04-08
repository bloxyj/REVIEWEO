import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { router, type Href } from 'expo-router';
import { Platform, type StyleProp, type ViewStyle } from 'react-native';

type BackNavButtonProps = {
    label?: string;
    fallbackHref?: Href;
    style?: StyleProp<ViewStyle>;
};

export function BackNavButton({
    label = 'Back',
    fallbackHref = '/',
    style,
}: BackNavButtonProps) {
    const handlePress = () => {
        if (Platform.OS === 'web') {
            try {
                router.back();
                return;
            } catch {
                router.replace(fallbackHref);
                return;
            }
        }

        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace(fallbackHref);
    };

    return (
        <LiquidGlassButton
            label={label}
            variant="secondary"
            size="sm"
            onPress={handlePress}
            accessibilityLabel="Go back"
            style={style}
            testID="back-nav-button"
        />
    );
}
