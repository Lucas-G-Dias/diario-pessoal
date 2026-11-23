-- Diário Pessoal: estrutura do banco
-- Cada pessoa só lê e escreve os próprios documentos (RLS por user_id).

create table if not exists public.docs (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  path text not null,
  data jsonb not null default '{}'::jsonb,
  deleted boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (user_id, path)
);
create index if not exists docs_user_updated on public.docs (user_id, updated_at);

create table if not exists public.push_subs (
  endpoint text primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  sub jsonb not null,
  tz text not null default 'America/Sao_Paulo',
  created_at timestamptz not null default now()
);

-- evita mandar o mesmo lembrete duas vezes
create table if not exists public.notif_log (
  user_id uuid not null references auth.users on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, key)
);

alter table public.docs enable row level security;
alter table public.push_subs enable row level security;
alter table public.notif_log enable row level security;

drop policy if exists docs_own on public.docs;
create policy docs_own on public.docs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists push_own on public.push_subs;
create policy push_own on public.push_subs for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
grant select, insert, update, delete on public.docs, public.push_subs to authenticated;
revoke all on public.docs, public.push_subs, public.notif_log from anon;
-- notif_log: só a função de lembretes (chave de serviço) usa; sem política = ninguém de fora acessa.

-- Lembretes: chama a função a cada 15 minutos.
-- (já aplicado no projeto kvywtrdukwevesgbjghd) Rode depois de publicar a função e guardar o segredo no Vault:
--   select vault.create_secret('<SEGREDO_DO_CRON>', 'cron_secret');
-- create extension if not exists pg_cron; create extension if not exists pg_net;
-- select cron.schedule('lembretes', '*/15 * * * *', $$
--   select net.http_post(
--     url := 'https://<PROJETO>.supabase.co/functions/v1/lembretes',
--     headers := jsonb_build_object('Content-Type','application/json','x-cron-secret',
--       (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
--     body := '{}'::jsonb)
-- $$);
