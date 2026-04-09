import { Breakpoints, DesignTokens } from '@/constants/design-system';
import { Platform, type ViewStyle, useWindowDimensions } from 'react-native';

export type BreakpointName = 'mobile' | 'tablet' | 'desktop' | 'wide';

export function getBreakpointName(width: number): BreakpointName {
  if (width >= Breakpoints.wide) {
    return 'wide';
  }
  if (width >= Breakpoints.desktop) {
    return 'desktop';
  }
  if (width >= Breakpoints.tablet) {
    return 'tablet';
  }
  return 'mobile';
}

export function useResponsiveLayout() {
  const { width } = useWindowDimensions();
  const breakpoint = getBreakpointName(width);

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';
  const isDesktop = breakpoint === 'desktop' || breakpoint === 'wide';
  const isWide = breakpoint === 'wide';

  const horizontalPadding =
    Platform.OS === 'web'
      ? isMobile
        ? DesignTokens.spacing.md
        : DesignTokens.spacing.lg
      : isMobile
        ? DesignTokens.spacing.md
        : isTablet
          ? DesignTokens.spacing.lg
          : DesignTokens.spacing.xl;

  const desktopWebMaxWidth = Math.max(width - horizontalPadding * 2, DesignTokens.layout.maxWidthTablet);

  const contentMaxWidth =
    Platform.OS === 'web' && isDesktop
      ? desktopWebMaxWidth
      : isWide
        ? DesignTokens.layout.maxWidthWide
        : isDesktop
          ? DesignTokens.layout.maxWidthDesktop
          : DesignTokens.layout.maxWidthTablet;

  return {
    width,
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isWide,
    horizontalPadding,
    contentMaxWidth,
  };
}

type FluidGridItemStyleOptions = {
  isDesktop: boolean;
  isTablet: boolean;
  minWidth: number;
  maxWidth: number;
  nativeMobileWidth?: number | `${number}%` | '100%';
  nativeTabletWidth?: number | `${number}%` | '100%';
  nativeDesktopWidth?: number | `${number}%` | '100%';
};

export function getFluidGridItemStyle({
  isDesktop,
  isTablet,
  minWidth,
  maxWidth,
  nativeMobileWidth = '100%',
  nativeTabletWidth = '48.5%',
  nativeDesktopWidth = '49%',
}: FluidGridItemStyleOptions): ViewStyle {
  if (Platform.OS !== 'web') {
    return {
      width: isDesktop ? nativeDesktopWidth : isTablet ? nativeTabletWidth : nativeMobileWidth,
    };
  }

  if (!isDesktop && !isTablet) {
    return { width: '100%' };
  }

  return {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: minWidth,
    minWidth,
    maxWidth,
  };
}
