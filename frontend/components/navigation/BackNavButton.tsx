import { LiquidGlassButton } from '@/components/ui/LiquidGlassButton';
import { type Href, useNavigation, useRouter } from 'expo-router';

type BackNavButtonProps = {
    fallbackHref?: Href;
    label?: string;
};

export function BackNavButton({ fallbackHref = '/', label = 'Back' }: BackNavButtonProps) {
    const router = useRouter();
    const navigation = useNavigation();

    const onPress = () => {
        if (navigation.canGoBack()) {
        navigation.goBack();
        return;
        }

        router.replace(fallbackHref);
    };

    return <LiquidGlassButton label={label} variant="secondary" size="sm" onPress={onPress} />;
}
