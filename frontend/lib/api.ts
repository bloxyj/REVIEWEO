import { API_BASE_URL } from '@/lib/config';
import type {
    Album,
    AlbumTrack,
    ApiEnvelope,
    ApiListParams,
    Artist,
    ArtistDetail,
    ArtistGenre,
    ArtistRelated,
    ArtistTopTrack,
    AuthPayload,
    AuthUser,
    ChartResponse,
    Review,
    ReviewInput,
    SearchResponse,
    SearchType,
} from '@/lib/types';

type RequestOptions = {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    token?: string;
    body?: unknown;
};

function toQuery(params?: ApiListParams): string {
    if (!params) {
        return '';
    }
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
            query.set(key, String(value));
        }
    });
    const serialized = query.toString();
    return serialized === '' ? '' : `?${serialized}`;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? 'GET';
    const headers: Record<string, string> = {
        Accept: 'application/json',
    };

    if (options.body !== undefined) {
        headers['Content-Type'] = 'application/json';
    }

    if (options.token) {
        headers.Authorization = `Bearer ${options.token}`;
    }

    const fullUrl = `${API_BASE_URL}${path}`;

    const response = await fetch(fullUrl, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    const raw = await response.text();

    let payload: ApiEnvelope<T> | null = null;

    if (raw.trim() !== '') {
        try {
            payload = JSON.parse(raw) as ApiEnvelope<T>;
        } catch {
            throw new Error(`Le serveur a renvoyé une erreur formatée en HTML (Status ${response.status})`);
        }
    }

    if (!response.ok) {
        const message = payload && 'message' in payload ? payload.message : `Request failed (${response.status})`;
        throw new Error(message);
    }

    if (!payload) {
        throw new Error('Empty server response.');
    }

    if (!payload.success) {
        throw new Error(payload.message || 'Request failed.');
    }

    return payload.data;
}

export function register(username: string, email: string, password: string): Promise<AuthPayload> {
    return request<AuthPayload>('/auth/register', { method: 'POST', body: { username, email, password } });
}

export function login(email: string, password: string): Promise<AuthPayload> {
    return request<AuthPayload>('/auth/login', { method: 'POST', body: { email, password } });
}

export function logout(token: string): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/logout', { method: 'POST', token });
}

// --- ARTISTES & ALBUMS ---
export function listArtists(): Promise<Artist[]> { return request<Artist[]>('/artists'); }
export function getArtist(id: number): Promise<ArtistDetail> { return request<ArtistDetail>(`/artists/${id}`); }
export function getArtistAlbums(id: number, params?: ApiListParams): Promise<Album[]> {
    return request<Album[]>(`/artists/${id}/albums${toQuery(params)}`);
}
export function getArtistGenres(id: number): Promise<ArtistGenre[]> { return request<ArtistGenre[]>(`/artists/${id}/genres`); }
export function getArtistRelated(id: number): Promise<ArtistRelated[]> { return request<ArtistRelated[]>(`/artists/${id}/related`); }
export function getArtistTopTracks(id: number, limit?: number): Promise<ArtistTopTrack[]> {
    return request<ArtistTopTrack[]>(`/artists/${id}/top-tracks${toQuery({ limit })}`);
}
export function listAlbums(params?: ApiListParams): Promise<Album[]> { return request<Album[]>(`/albums${toQuery(params)}`); }
export function getAlbum(id: number): Promise<Album> { return request<Album>(`/albums/${id}`); }
export function getAlbumTracks(id: number): Promise<AlbumTrack[]> { return request<AlbumTrack[]>(`/albums/${id}/tracks`); }

// --- REVIEWS ---
export function listReviews(params?: ApiListParams): Promise<Review[]> { return request<Review[]>(`/reviews${toQuery(params)}`); }
export function getReview(id: number): Promise<Review> { return request<Review>(`/reviews/${id}`); }
export function getAlbumReviews(id: number, limit?: number): Promise<Review[]> {
    return request<Review[]>(`/albums/${id}/reviews${toQuery({ limit })}`);
}
export function createReview(token: string, input: ReviewInput): Promise<Review> {
    return request<Review>('/reviews', { method: 'POST', token, body: input });
}
export function createAlbumReview(token: string, albumId: number, input: Omit<ReviewInput, 'album_id'>): Promise<Review> {
    return request<Review>(`/albums/${albumId}/reviews`, { method: 'POST', token, body: input });
}
export function updateReview(token: string, reviewId: number, input: Omit<ReviewInput, 'album_id'>): Promise<Review> {
    return request<Review>(`/reviews/${reviewId}`, { method: 'PUT', token, body: input });
}
export function deleteReview(token: string, reviewId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/reviews/${reviewId}`, { method: 'DELETE', token });
}
export function toggleReviewLike(token: string, reviewId: number): Promise<{ review_id: number; liked: boolean; total_likes: number }> {
    return request<{ review_id: number; liked: boolean; total_likes: number }>(`/likes/${reviewId}`, { method: 'POST', token });
}

export function listAdminUsers(token: string): Promise<AuthUser[]> {
    return request<AuthUser[]>('/admin/users', { token });
}

export function adminDeleteReview(token: string, reviewId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/admin/reviews/${reviewId}`, { method: 'DELETE', token });
}

export function adminPinReview(token: string, reviewId: number, isPinned: boolean): Promise<Review> {
    return request<Review>(`/admin/pin/${reviewId}`, { method: 'POST', token, body: { is_pinned: isPinned } });
}

export function adminUpdateUserRole(token: string, userId: number, role: string): Promise<AuthUser> {
    return request<AuthUser>(`/admin/users/${userId}/role`, {
        method: 'PUT',
        token,
        body: { role },
    });
}

export function adminDeleteUser(token: string, userId: number): Promise<{ message: string }> {
    return request<{ message: string }>(`/admin/users/${userId}`, {
        method: 'DELETE',
        token,
    });
}

export function searchCatalog(query: string, type: SearchType = 'all', limit = 20): Promise<SearchResponse> {
    return request<SearchResponse>(`/search${toQuery({ q: query, type, limit })}`);
}
export function getCharts(params?: { year?: number; genre?: string; release_type?: string; min_ratings?: number; limit?: number; }): Promise<ChartResponse> {
    return request<ChartResponse>(`/charts${toQuery(params)}`);
}