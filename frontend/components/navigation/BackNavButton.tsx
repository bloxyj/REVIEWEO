import { AppButton } from '@/components/ui/AppButton';
import { type Href, useNavigation, useRouter } from 'expo-router';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';

type BackNavButtonProps = {
    fallbackHref?: Href;
    label?: string;
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
};

export function BackNavButton({ fallbackHref = '/', label = 'Back', style, textStyle }: BackNavButtonProps) {
    const router = useRouter();
    const navigation = useNavigation();

    const onPress = () => {
        if (navigation.canGoBack()) {
            navigation.goBack();
            return;
        }

        router.replace(fallbackHref);
    };

    return <AppButton label={label} variant="secondary" size="sm" onPress={onPress} style={style} textStyle={textStyle} />;
}
