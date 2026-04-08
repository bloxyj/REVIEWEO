import { Breakpoints, DesignTokens } from '@/constants/design-system';
import { Platform, useWindowDimensions } from 'react-native';

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
