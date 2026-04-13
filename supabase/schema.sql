-- ─────────────────────────────────────────────
--  Housekeeping App — Supabase Schema
--  Run this in Supabase SQL Editor after creating your project.
-- ─────────────────────────────────────────────

-- ── User profiles (extends Supabase auth.users) ───────────────────────────
create table if not exists public.user_profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  display_name  text not null default '',
  role          text not null default 'housekeeper' check (role in ('admin', 'housekeeper')),
  created_at    timestamptz not null default now()
);

alter table public.user_profiles enable row level security;

-- Users can read their own profile; admins can read all
create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.user_profiles for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update profiles"
  on public.user_profiles for update
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Auto-create profile on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    -- First user becomes admin automatically
    case when (select count(*) from public.user_profiles) = 0 then 'admin' else 'housekeeper' end
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Branding config ───────────────────────────────────────────────────────
create table if not exists public.branding_config (
  id              text primary key default 'default',
  property_name   text not null default 'Hotel',
  logo_url        text,
  primary_color   text not null default '#1a56db',
  accent_color    text not null default '#0e9f6e',
  updated_at      timestamptz not null default now()
);

-- Insert default row
insert into public.branding_config (id) values ('default')
  on conflict (id) do nothing;

alter table public.branding_config enable row level security;

create policy "Anyone authenticated can read branding"
  on public.branding_config for select
  using (auth.role() = 'authenticated');

create policy "Admins can update branding"
  on public.branding_config for all
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ── Housekeeping audit log ────────────────────────────────────────────────
create table if not exists public.housekeeping_audit_log (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id),
  user_email      text,
  room_id         text not null,
  room_number     text not null,
  from_condition  text,
  to_condition    text not null,
  created_at      timestamptz not null default now()
);

alter table public.housekeeping_audit_log enable row level security;

create policy "Admins can read audit log"
  on public.housekeeping_audit_log for select
  using (
    exists (
      select 1 from public.user_profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Service role inserts (done via admin client in API routes) bypass RLS,
-- so no insert policy needed for users here.

-- ── Indexes ───────────────────────────────────────────────────────────────
create index if not exists idx_audit_log_created_at on public.housekeeping_audit_log(created_at desc);
create index if not exists idx_audit_log_room_id on public.housekeeping_audit_log(room_id);
create index if not exists idx_user_profiles_role on public.user_profiles(role);
