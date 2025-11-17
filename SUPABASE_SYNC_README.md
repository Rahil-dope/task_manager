# Supabase Sync: Edge Function & Server examples

This folder contains two secure examples for syncing tasks to Supabase using the `service_role` key on the server side.

Files added:

- `netlify/functions/sync.js` — Netlify serverless function (recommended for Netlify deploys).
- `server/sync-server.js` — Minimal Express server you can run anywhere (Heroku, Railway, Vercel serverless, etc.).

## Environment variables (required)

Both examples require these environment variables to be set:

- `SUPABASE_URL` — your Supabase project URL, e.g. `https://xyzabc.supabase.co`
- `SUPABASE_SERVICE_ROLE` — Supabase service_role key (keep secret; never expose to client)

For Netlify functions: set them in Netlify dashboard (Site > Site settings > Build & deploy > Environment).
For the Express server: set them in your host or local environment (e.g., `.env`) before running.

## How it works

1. Client obtains a Supabase user access token via Supabase Auth (or your own auth flow).
2. Client POSTs to the server function with header `Authorization: Bearer <user_access_token>` and body `{ tasks: [ ... ] }`.
3. Server validates the token using Supabase `auth.getUser(token)` and extracts `user.id`.
4. Server attaches `user_id` to each task and performs an `upsert` into the `tasks` table using the `service_role` key.

This keeps your `service_role` key secret and ensures per-user data is stored safely (combine with RLS if desired).

## Example client call

```js
// from your app (e.g., in js/sync.js)
async function pushToSyncEndpoint(syncUrl, accessToken, tasks) {
  const res = await fetch(syncUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + accessToken
    },
    body: JSON.stringify({ tasks })
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || 'Sync failed');
  return json;
}

// usage
// const syncUrl = 'https://yoursite.netlify.app/.netlify/functions/sync';
// const accessToken = supabase.auth.getSession().access_token;
// await pushToSyncEndpoint(syncUrl, accessToken, getTasks());
```

## SQL: `tasks` table (recommended)

Run this SQL in Supabase SQL editor:

```sql
create table tasks (
  id text primary key,
  user_id uuid,
  title text,
  desc text,
  category text,
  priority text,
  status text,
  deadline timestamptz,
  tags jsonb,
  createdAt bigint,
  "order" int,
  color text,
  recurring jsonb,
  completedAt bigint
);

-- Optional: enable RLS and a policy to allow authenticated users to manage their rows
alter table tasks enable row level security;
create policy "users can manage own tasks" on tasks
  for all using (auth.uid() = user_id);
```

## Deploy notes

- Netlify: Add `netlify/functions/sync.js` to repo and set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE` in Netlify site env vars. Install `@supabase/supabase-js` as a dependency so Netlify can bundle it (`npm install @supabase/supabase-js`).

- Express server: install deps and run:

```bash
npm install express body-parser @supabase/supabase-js
SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE=... node server/sync-server.js
```

## Next steps / hardening

- Add input validation and size limits.
- Add rate limiting / auth checks to avoid abuse.
- If you only want per-user operations, keep RLS enabled and still use service_role to perform upserts but ensure `user_id` is set.
- Consider conflict resolution strategy (timestamps, last-write-wins, or merging changes client-side first).

If you want, I can:
- Implement the client-side call in `js/sync.js` to call your deployed function, or
- Add a `package.json` and `netlify.toml` changes to ensure the Netlify function builds with dependencies.

Which would you like next?