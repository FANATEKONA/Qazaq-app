create table if not exists public.app_state (
  id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.app_state enable row level security;

drop policy if exists "deny anon direct access" on public.app_state;
create policy "deny anon direct access"
on public.app_state
for all
to public
using (false)
with check (false);

insert into public.app_state (id, payload)
values (
  'main',
  '{
    "meta": { "version": 3, "createdAt": "2026-01-01T00:00:00.000Z", "updatedAt": "2026-01-01T00:00:00.000Z" },
    "users": [],
    "sessions": [],
    "diagnosticAttempts": [],
    "videoProgress": [],
    "grammarProgress": [],
    "shadowingProgress": [],
    "skillProgress": [],
    "miniGameAttempts": [],
    "moduleTestAttempts": [],
    "teacherTasks": [],
    "teacherChangeRequests": [],
    "feedbackMessages": [],
    "achievementUnlocks": [],
    "rewardClaims": [],
    "certificates": []
  }'::jsonb
)
on conflict (id) do nothing;
