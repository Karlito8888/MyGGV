create table public.profiles (
  id uuid not null,
  display_name text null,
  email text null,
  occupation text null,
  profile_picture_url text null default 'https://wlrrruemchacgyypexsu.supabase.co/storage/v1/object/sign/avatars/ggv-100.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJhdmF0YXJzL2dndi0xMDAucG5nIiwiaWF0IjoxNzQyMzg1NzM4LCJleHAiOjE5MDAwNjU3Mzh9.Gim-LkcsEnVmu25JTAxi3mBoOYi_pEOQ7A8skjhhvHU'::text,
  description text null,
  facebook text null,
  messenger text null,
  whatsapp text null,
  viber text null,
  coins integer null default 0,
  main_location_id uuid null,
  has_a_service boolean null default false,
  service_location uuid null,
  has_a_business_inside boolean null default false,
  business_inside_location uuid null,
  has_a_business_outside boolean null default false,
  business_outside_location uuid null,
  role text not null default 'user'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  deleted_at timestamp with time zone null,
  last_login_at timestamp with time zone null,
  is_public_profile boolean null default true,
  full_name text null,
  constraint profiles_pkey primary key (id),
  constraint profiles_email_key unique (email),
--   constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_coins_check check ((coins >= 0)),
  constraint profiles_role_check check (
    (
      role = any (
        array['user'::text, 'admin'::text, 'moderator'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_profiles_email on public.profiles using btree (email) TABLESPACE pg_default;

create trigger update_profiles_updated_at BEFORE
update on profiles for EACH row
execute FUNCTION update_updated_at_column ();

[
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Admins have full access to profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "ALL",
    "qual": "(auth.role() = 'admin'::text)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Authenticated users can read public profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(is_public_profile = true)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can delete their own profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "DELETE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can insert their own profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(auth.uid() = id)"
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can read their own profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "SELECT",
    "qual": "(auth.uid() = id)",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "profiles",
    "policyname": "Users can update their own profiles",
    "permissive": "PERMISSIVE",
    "roles": "{authenticated}",
    "cmd": "UPDATE",
    "qual": "(auth.uid() = id)",
    "with_check": null
  }
]