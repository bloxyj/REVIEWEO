export type ApiError = {
    success: false;
    message: string;
    errors?: Record<string, string>;
};

export type ApiSuccess<T> = {
    success: true;
    data: T;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiError;

export type AuthUser = {
    id: number;
    username: string;
    email: string;
    role: 'user' | 'admin' | 'critique'; 
    created_at: string;
};

export type AuthPayload = {
    token: string;
    expires_in: number;
    user: AuthUser;
};

export type Artist = {
    id: number;
    name: string;
    birth_date: string | null;
    birth_location: string | null;
    current_location: string | null;
    work_location: string | null;
    followers: number;
    created_at: string;
};

export type ArtistGenre = {
    id: number;
    name: string;
};

export type ArtistRelated = {
    id: number;
    name: string;
    followers: number;
};

export type ArtistAlias = {
    id: number;
    alias_name: string;
};

export type ArtistMembership = {
    id: number;
    group_name: string;
};

export type ArtistDetail = Artist & {
    notes: string | null;
    aliases: ArtistAlias[];
    memberships: ArtistMembership[];
    genres: ArtistGenre[];
    related_artists: ArtistRelated[];
    discography_summary: Record<string, number | string | null>;
};

export type Album = {
    id: number;
    title: string;
    artist_id: number;
    artist_name: string;
    release_year: number;
    release_type: string;
    collaborators: string | null;
    cover_image: string | null;
    cover_image_url: string | null;
    average_rating: number | null;
    ratings_count: number;
    reviews_count: number;
    issues_count: number;
    created_at?: string;
};

export type AlbumTrack = {
    id: number;
    title: string;
    track_order: number;
    popularity_score: number | null;
    listeners_k: number | null;
    has_lyrics: 0 | 1;
};

export type ArtistTopTrack = {
    id: number;
    title: string;
    track_order: number;
    popularity_score: number | null;
    listeners_k: number | null;
    album_id: number;
    album_title: string;
    release_year: number;
};

export type Review = {
    id: number;
    album_id: number;
    album_title: string;
    release_year: number;
    release_type: string;
    artist_id: number;
    artist_name: string;
    cover_image: string | null;
    cover_image_url: string | null;
    user_id: number;
    author: string;
    title: string;
    content: string | null;
    rating: number;
    is_pinned: 0 | 1;
    created_at: string;
    updated_at: string;
    likes_count: number;
};

export type ReviewInput = {
    album_id?: number;
    rating: number;
    title?: string;
    content?: string;
};

export type SearchTrack = {
    id: number;
    title: string;
    track_order: number;
    popularity_score: number | null;
    listeners_k: number | null;
    has_lyrics: 0 | 1;
    album_id: number;
    album_title: string;
    release_year: number;
    artist_id: number;
    artist_name: string;
};

export type SearchType = 'all' | 'artists' | 'albums' | 'tracks';

export type SearchResponse = {
    query: string;
    type: SearchType;
    artists: Artist[];
    albums: Album[];
    tracks: SearchTrack[];
};

export type ChartItem = {
    rank: number;
    id: number;
    title: string;
    release_year: number;
    release_type: string;
    average_rating: number;
    ratings_count: number;
    reviews_count: number;
    artist_id: number;
    artist_name: string;
    genres: string[];
};

export type ChartResponse = {
    filters: {
        year: number | null;
        genre: string | null;
        release_type: string | null;
        min_ratings: number;
        limit: number;
    };
    items: ChartItem[];
};

export type ApiListParams = {
    limit?: number;
    [key: string]: string | number | undefined;
};
