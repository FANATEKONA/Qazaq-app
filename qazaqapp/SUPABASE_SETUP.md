**Supabase Setup**
Use Supabase Free with one JSON state table for the current backend.

1. Create a new Supabase project.
2. Open `SQL Editor`.
3. Run [supabase/app_state.sql](/C:/Users/a1mas/Downloads/Qazaq/qazaqapp/supabase/app_state.sql:1).
4. In Supabase project settings, copy:
   - `Project URL`
   - `service_role` key
5. In Vercel project settings, add these environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STATE_TABLE=app_state`
   - `SUPABASE_STATE_ROW_ID=main`
6. Redeploy the project.

**Local .env**
```env
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
SUPABASE_STATE_TABLE=app_state
SUPABASE_STATE_ROW_ID=main
```

**Notes**
- The backend uses the `service_role` key only on the server.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are missing, the app falls back to local file storage.
- This setup keeps the current app logic intact, but stores the whole app state as one JSON document. It is enough for now, but later it should be normalized into real tables.
