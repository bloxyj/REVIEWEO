# REVIEWEO Frontend

Minimal Expo frontend for REVIEWEO, designed for both web and mobile.

The UI is intentionally simple: black text on white background with layout-only styling.

## Setup

1. Install dependencies

```bash
npm install
```

1. Configure API base URL

```bash
cp .env.example .env
```

Set `EXPO_PUBLIC_API_BASE_URL` in `.env`:

- Web local: `http://localhost/api`
- Physical phone: `http://<YOUR_LAN_IP>/api`

1. Start the app

```bash
npm run start
```

Use `npm run web`, `npm run ios`, or `npm run android` for a specific target.

## Routes

- `/` Home
- `/login` Login
- `/register` Register
- `/artists` Artists list
- `/artist/[id]` Artist detail
- `/albums` Albums list
- `/album/[id]` Album detail + reviews
- `/reviews` Reviews list
- `/review/[id]` Review detail
- `/search` Search (artists/albums)
- `/charts` Top-rated charts (year/genre/release_type filters)
- `/admin` Admin users + review moderation

## API Coverage

Frontend is connected to backend endpoints for:

- Authentication (`/auth/*`)
- Artists (`/artists/*`)
- Albums (`/albums/*`)
- Release-linked reviews (`/reviews`, `/albums/{id}/reviews`)
- Likes (`/likes/{id_review}`)
- Admin moderation (`/admin/users`, `/admin/reviews/{id}`, `/admin/pin/{id}`)
- Search (`/search`)
- Charts (`/charts`)
