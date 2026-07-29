-- 001-init.sql — natalie schema on self-hosted Supabase (idempotent; applied 2026-07-29)
-- Run as: docker exec -i supabase-db psql -U postgres -v ON_ERROR_STOP=1 < 001-init.sql
-- After any change: NOTIFY pgrst, 'reload schema';
-- NATALIE_UID is the immutable auth.users id for natalichn@gmail.com (see RUNBOOK.md §1).

\set NATALIE_UID '696378f9-f9f9-4a72-8f5d-66ec03a09312'

begin;
create schema if not exists natalie;

create table if not exists natalie.properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  location_area text not null,
  price integer,
  status text not null default 'available' check (status in ('available','under_offer','sold')),
  type text not null default 'apartment' check (type in ('apartment','house','villa','townhouse','penthouse','plot','commercial')),
  bedrooms int,
  bathrooms int,
  area_built int,
  area_plot int,
  floor text,
  year_built int,
  energy_rating text,
  description text,
  amenities jsonb not null default '[]',
  photos jsonb not null default '[]',      -- array of storage OBJECT KEYS (not URLs)
  featured boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table natalie.properties enable row level security;

drop policy if exists "public read published" on natalie.properties;
create policy "public read published" on natalie.properties
  for select using (published = true or auth.uid() = :'NATALIE_UID'::uuid);
drop policy if exists "natalie insert" on natalie.properties;
create policy "natalie insert" on natalie.properties
  for insert to authenticated with check (auth.uid() = :'NATALIE_UID'::uuid);
drop policy if exists "natalie update" on natalie.properties;
create policy "natalie update" on natalie.properties
  for update to authenticated using (auth.uid() = :'NATALIE_UID'::uuid)
  with check (auth.uid() = :'NATALIE_UID'::uuid);
drop policy if exists "natalie delete" on natalie.properties;
create policy "natalie delete" on natalie.properties
  for delete to authenticated using (auth.uid() = :'NATALIE_UID'::uuid);

grant usage on schema natalie to anon, authenticated, service_role;
grant select on natalie.properties to anon;
grant select, insert, update, delete on natalie.properties to authenticated;
grant all on natalie.properties to service_role;

-- validation
alter table natalie.properties drop constraint if exists title_not_blank;
alter table natalie.properties add constraint title_not_blank check (char_length(btrim(title)) > 0);
alter table natalie.properties drop constraint if exists location_not_blank;
alter table natalie.properties add constraint location_not_blank check (char_length(btrim(location_area)) > 0);
alter table natalie.properties drop constraint if exists nonnegative_facts;
alter table natalie.properties add constraint nonnegative_facts check (
  coalesce(price,0) >= 0 and coalesce(bedrooms,0) >= 0 and coalesce(bathrooms,0) >= 0
  and coalesce(area_built,0) >= 0 and coalesce(area_plot,0) >= 0
  and (year_built is null or year_built between 1500 and 2100));
alter table natalie.properties drop constraint if exists amenities_is_known_array;
alter table natalie.properties add constraint amenities_is_known_array check (
  jsonb_typeof(amenities) = 'array'
  and amenities <@ '["parking","garage","elevator","pool","garden","terrace","sea_view","air_con","storage","furnished"]'::jsonb);
-- photos: array of ≤12 unique '<uuid>.jpg' object keys
create or replace function natalie.valid_photos(p jsonb) returns boolean immutable language sql as
$fn$
  select jsonb_typeof(p) = 'array'
    and jsonb_array_length(p) <= 12
    and not exists (
      select 1 from jsonb_array_elements(p) e
      where jsonb_typeof(e) <> 'string'
         or e #>> '{}' !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$')
    and (select count(distinct e #>> '{}') from jsonb_array_elements(p) e) = jsonb_array_length(p)
$fn$;
alter table natalie.properties drop constraint if exists photos_is_array;
alter table natalie.properties drop constraint if exists photos_valid;
alter table natalie.properties add constraint photos_valid check (natalie.valid_photos(photos));
-- PT energy certificate scale + the statutory exemption case
alter table natalie.properties drop constraint if exists energy_rating_known;
alter table natalie.properties add constraint energy_rating_known check (
  energy_rating is null or energy_rating in ('A+','A','B','B-','C','D','E','F','exempt'));
-- A published listing IS a property advertisement. DL 101-D/2020 art. 22(3) makes the
-- energy class mandatory in property ads (art. 35(1)(e): EUR 250-3.740 / 2.500-44.890),
-- so publication is blocked at the DB rather than merely discouraged in the UI.
alter table natalie.properties drop constraint if exists published_needs_content;
alter table natalie.properties add constraint published_needs_content check (
  (not published) or (
    jsonb_array_length(photos) >= 1
    and description is not null and char_length(btrim(description)) > 0
    and energy_rating is not null));

-- updated_at is server-owned
create or replace function natalie.set_updated_at() returns trigger language plpgsql as
$$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_updated_at on natalie.properties;
create trigger trg_updated_at before update on natalie.properties
  for each row execute function natalie.set_updated_at();

-- storage: public-read bucket, writes bound to Natalie's uid, JPEG ≤5MB
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values ('natalie-properties','natalie-properties', true, 5242880, '{image/jpeg}')
  on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = '{image/jpeg}';

drop policy if exists "natalie props write" on storage.objects;
create policy "natalie props write" on storage.objects
  for insert to authenticated with check (bucket_id = 'natalie-properties' and auth.uid() = :'NATALIE_UID'::uuid);
drop policy if exists "natalie props update" on storage.objects;  -- deliberately none: object keys are immutable UUIDs
drop policy if exists "natalie props delete" on storage.objects;
create policy "natalie props delete" on storage.objects
  for delete to authenticated using (bucket_id = 'natalie-properties' and auth.uid() = :'NATALIE_UID'::uuid);
-- NO anon select policy: public URLs are served via the bucket's public flag; a select
-- policy would let anon LIST the bucket and expose draft photo keys.
drop policy if exists "natalie props public read" on storage.objects;
-- owner select IS required: the Storage API resolves objects via select before delete
drop policy if exists "natalie props owner read" on storage.objects;
create policy "natalie props owner read" on storage.objects
  for select to authenticated
  using (bucket_id = 'natalie-properties' and auth.uid() = :'NATALIE_UID'::uuid);

commit;
notify pgrst, 'reload schema';
