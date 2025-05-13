create table public.profile_location_associations (
  profile_id uuid not null,
  location_id uuid not null,
  is_active boolean null default true,
  is_verified boolean null default false,
  is_main boolean null default true,
  is_primary boolean null default false,
  constraint profile_location_associations_pkey primary key (profile_id, location_id),
  constraint profile_location_associations_location_id_fkey foreign KEY (location_id) references locations (id) on delete CASCADE,
  constraint profile_location_associations_profile_id_fkey foreign KEY (profile_id) references profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create trigger after_update_profile_location_association
after INSERT
or
update on profile_location_associations for EACH row
execute FUNCTION update_main_location_id ();

create trigger auto_verify_first_user_trigger BEFORE INSERT on profile_location_associations for EACH row
execute FUNCTION auto_verify_first_user ();

[
  {
    "schemaname": "public",
    "tablename": "profile_location_associations",
    "policyname": "Gestion des associations",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "ALL",
    "qual": "((profile_id = auth.uid()) OR (is_verified = true))",
    "with_check": "((profile_id = auth.uid()) OR (EXISTS ( SELECT 1\n   FROM location_association_requests\n  WHERE ((location_association_requests.requester_id = profile_location_associations.profile_id) AND (location_association_requests.location_id = profile_location_associations.location_id) AND (location_association_requests.approver_id = auth.uid()) AND (location_association_requests.status = 'approved'::text)))))"
  },
  {
    "schemaname": "public",
    "tablename": "profile_location_associations",
    "policyname": "Insertion via trigger seulement",
    "permissive": "PERMISSIVE",
    "roles": "{public}",
    "cmd": "INSERT",
    "qual": null,
    "with_check": "(EXISTS ( SELECT 1\n   FROM location_association_requests\n  WHERE ((location_association_requests.requester_id = profile_location_associations.profile_id) AND (location_association_requests.location_id = profile_location_associations.location_id) AND (location_association_requests.status = 'approved'::text))))"
  }
]