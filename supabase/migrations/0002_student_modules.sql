-- ============================================================================
-- MESSMATE · 0002 student modules
--
-- Run after 0001 on an existing project:
--   • SQL Editor → paste & run, or
--   • npx supabase db push
--
-- Adds what the menu, rating, feedback and report screens need:
--   1. an aggregate rating RPC (students cannot read other students' ratings)
--   2. submission rate limits enforced in the database
--   3. text length constraints that mirror the client counters
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Crowd rating summary
--
-- ratings are readable only by their owner (and admins), so the average has to
-- be computed behind a security definer function. It returns aggregates only,
-- and only for menus in the caller's mess.
-- ---------------------------------------------------------------------------
create or replace function public.meal_rating_summary(menu_ids uuid[])
returns table (
  menu_id uuid,
  avg_stars double precision,
  rating_count bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.menu_id,
    round(avg(r.stars)::numeric, 2)::double precision as avg_stars,
    count(*)::bigint as rating_count
  from public.ratings r
  where r.menu_id = any(menu_ids)
    and (
      public.is_admin()
      or exists (
        select 1
        from public.menus m
        where m.id = r.menu_id
          and m.mess_id = public.current_mess_id()
      )
    )
  group by r.menu_id;
$$;

revoke all on function public.meal_rating_summary(uuid[]) from public;
grant execute on function public.meal_rating_summary(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Submission rate limits
--
-- Keep these numbers in sync with lib/rate-limit.ts. The app checks first for a
-- friendly message; these triggers are the real guard against scripted spam.
-- ---------------------------------------------------------------------------
create or replace function public.enforce_submission_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
  allowed integer;
  window_size interval;
begin
  if tg_table_name = 'feedback' then
    allowed := 5;
    window_size := interval '10 minutes';
  elsif tg_table_name = 'reports' then
    allowed := 3;
    window_size := interval '1 hour';
  elsif tg_table_name = 'ratings' then
    allowed := 25;
    window_size := interval '10 minutes';
  else
    return new;
  end if;

  execute format(
    'select count(*) from public.%I where user_id = $1 and created_at > now() - $2',
    tg_table_name
  )
  into recent
  using new.user_id, window_size;

  if recent >= allowed then
    raise exception 'Slow down: too many % submissions', tg_table_name
      using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger feedback_rate_limit
  before insert on public.feedback
  for each row
  execute function public.enforce_submission_rate_limit();

create trigger reports_rate_limit
  before insert on public.reports
  for each row
  execute function public.enforce_submission_rate_limit();

create trigger ratings_rate_limit
  before insert on public.ratings
  for each row
  execute function public.enforce_submission_rate_limit();

-- ---------------------------------------------------------------------------
-- 3. Length limits (the UI counts to exactly these numbers)
-- ---------------------------------------------------------------------------
alter table public.feedback
  add constraint feedback_comment_length
  check (char_length(btrim(comment)) between 1 and 500);

alter table public.reports
  add constraint reports_description_length
  check (char_length(btrim(description)) between 1 and 500);

-- ---------------------------------------------------------------------------
-- 4. Indexes for the rate-limit counts and history lists
-- ---------------------------------------------------------------------------
create index feedback_user_created_idx
  on public.feedback (user_id, created_at desc);
create index reports_user_created_idx
  on public.reports (user_id, created_at desc);
create index ratings_user_created_idx
  on public.ratings (user_id, created_at desc);
