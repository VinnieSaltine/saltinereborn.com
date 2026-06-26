# Reading Room Discussion

Private chapter discussion for invited Saltine Reborn readers.

## Scope

- Authenticated invited readers only.
- One chronological comment list per chapter.
- Reader name, timestamp, and plain text body.
- Author replies are ordinary comments from `Matt`.
- No avatars, likes, reactions, markdown, threading, notifications, or
  moderation tools.

## Backend

Use Vercel KV / Upstash for Saltine Reborn comments.

Suggested store name:

```text
Saltine Reborn Reading Room
```

Do not use the LandOS Supabase project `kesgikfvchfvyltfzwqu`.

## Environment variables

Configure these in Vercel for the Saltine Reborn project:

```bash
KV_REST_API_URL=
KV_REST_API_TOKEN=
READING_ROOM_TOKEN_SECRET=
READING_ROOM_READERS=
```

`READING_ROOM_READERS` is a JSON array. Example:

```json
[
  { "name": "Clayton", "password": "replace-me", "role": "reader" },
  { "name": "Steve", "password": "replace-me", "role": "reader" },
  { "name": "Matt", "password": "replace-me", "role": "author" }
]
```

For a private beta with three people, plain environment-managed reader passwords
are acceptable. If this grows, move to a full auth provider.

## Storage model

Each chapter stores a Redis list:

```text
saltine-reborn:comments:<chapter-slug>
```

Comments are appended with `RPUSH` and read with `LRANGE 0 -1`, which keeps the
discussion chronological.

The site talks to KV only through Vercel serverless functions. Do not expose the
KV token in browser code.
