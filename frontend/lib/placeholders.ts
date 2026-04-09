import { API_BASE_URL } from '@/lib/config';

function normalizeSeed(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function hashSeed(seed: string): number {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function buildUnsplashUrl(seed: string, width: number, height: number, keywords: string): string {
  const normalized = normalizeSeed(seed) || 'revieweo';
  const signature = hashSeed(normalized) % 10_000;
  return `https://source.unsplash.com/random/${width}x${height}/?${keywords},${normalized}&sig=${signature}`;
}

export function getAlbumCoverPlaceholder(id: number, title: string, artist: string): string {
  return buildUnsplashUrl(`album-${id}-${title}-${artist}`, 1200, 1200, 'music,album,vinyl,cover-art');
}

type AlbumCoverSource = {
  albumId: number;
  title: string;
  artist: string;
  coverImageUrl?: string | null;
  coverImage?: string | null;
};

export function getAlbumCoverUri(source: AlbumCoverSource): string {
  const directUrl = source.coverImageUrl?.trim();
  if (directUrl) {
    return directUrl;
  }

  const hasMappedCover = source.coverImage?.trim();
  if (hasMappedCover && source.albumId > 0) {
    return `${API_BASE_URL}/images/albums/${source.albumId}`;
  }

  return getAlbumCoverPlaceholder(source.albumId, source.title, source.artist);
}

export function getArtistPortraitPlaceholder(id: number, name: string): string {
  const normalizedName = normalizeSeed(name);

  if (id === 1 || normalizedName === 'kanye-west' || normalizedName === 'ye') {
    return `${API_BASE_URL}/images/kanye/kanye.webp`;
  }

  return buildUnsplashUrl(`artist-${id}-${name}`, 800, 1000, 'musician,portrait,studio');
}

export function getUserAvatarPlaceholder(id: number, username: string): string {
  return buildUnsplashUrl(`user-${id}-${username}`, 400, 400, 'portrait,headshot,person');
}
