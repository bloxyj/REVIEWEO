import type { Href } from 'expo-router';

export type NavLink = {
    label: string;
    href: Href;
    matchPatterns: string[];
};

export const desktopNavLinks: NavLink[] = [
    { label: 'Home', href: '/', matchPatterns: ['/'] },
    { label: 'Artists', href: '/artists', matchPatterns: ['/artists', '/artist'] },
    { label: 'Albums', href: '/albums', matchPatterns: ['/albums', '/album'] },
    { label: 'Reviews', href: '/reviews', matchPatterns: ['/reviews', '/review'] },
    { label: 'Search', href: '/search', matchPatterns: ['/search'] },
    { label: 'Charts', href: '/charts', matchPatterns: ['/charts'] },
    { label: 'Admin', href: '/admin', matchPatterns: ['/admin'] },
];

export function isActivePath(pathname: string, patterns: string[]): boolean {
    const cleanPath = pathname.replace(/\/$/, '') || '/';

    return patterns.some((pattern) => {
        const cleanPattern = pattern.replace(/\/$/, '') || '/';

        if (cleanPattern === '/') {
        return cleanPath === '/';
        }

        return cleanPath === cleanPattern || cleanPath.startsWith(`${cleanPattern}/`);
    });
}
