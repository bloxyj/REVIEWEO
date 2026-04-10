# REVIEWEO Frontend Routes

This document lists the Expo Router paths exposed by the frontend app.

## Tab Routes

- `/` Home feed
- `/reviews` Reviews feed
- `/create-review` Create review tab
- `/artists` Artists list
- `/albums` Albums list
- `/search` Search screen
- `/settings` Settings

## Routes

- `/login` Login
- `/register` Register
- `/charts` Charts
- `/admin` Admin panel
- `/album/[id]` Album detail + reviews
- `/artist/[id]` Artist detail
- `/review/[id]` Review detail
- `/review/create` Review creation form

## Route Notes

- `(tabs)` is a route group and is not part of the URL.
- Search supports query parameters on `/search`.
- Example: `/search?q=graduation`
- Example: `/search?q=ye&type=artists`
