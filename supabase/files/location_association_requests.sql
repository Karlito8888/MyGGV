create table public.location_association_requests (
  id uuid not null default gen_random_uuid (),
  requester_id uuid not null,
  location_id uuid not null,
  approver_id uuid not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint location_association_requests_pkey primary key (id),
  constraint location_association_requests_requester_id_location_id_key unique (requester_id, location_id),
  constraint location_association_requests_approver_id_fkey foreign KEY (approver_id) references profiles (id) on delete CASCADE,
  constraint location_association_requests_location_id_fkey foreign KEY (location_id) references locations (id) on delete CASCADE,
  constraint location_association_requests_requester_id_fkey foreign KEY (requester_id) references profiles (id) on delete CASCADE,
  constraint location_association_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger on_location_request_approved
after
update on location_association_requests for EACH row
execute FUNCTION update_association_on_request_approval ();

create trigger on_location_request_created
after INSERT on location_association_requests for EACH row
execute FUNCTION create_location_request_notification ();

create trigger on_location_request_updated
after
update on location_association_requests for EACH row
execute FUNCTION create_location_response_notification ();

[
  {
    "schemaname": "public",
    "tablename": "location_association_requests",
    "policyname": "Création des demandes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "((requester_id = auth.uid()) AND (status = 'pending'::text))"
  },
  {
    "schemaname": "public",
    "tablename": "location_association_requests",
    "policyname": "Lecture des demandes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "SELECT",
    "qual": "((requester_id = auth.uid()) OR (approver_id = auth.uid()))",
    "with_check": null
  },
  {
    "schemaname": "public",
    "tablename": "location_association_requests",
    "policyname": "Mise à jour des demandes",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "UPDATE",
    "qual": "(((approver_id = auth.uid()) AND (status = 'pending'::text)) OR (EXISTS ( SELECT 1\n   FROM profiles\n  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))))",
    "with_check": "(status = ANY (ARRAY['approved'::text, 'rejected'::text]))"
  }
]