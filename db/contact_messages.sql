-- À exécuter une fois dans Neon (SQL Editor, base "portfolio")
create table if not exists contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  message    text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_idx on contact_messages (created_at desc);
