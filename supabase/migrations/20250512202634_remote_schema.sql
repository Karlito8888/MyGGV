drop trigger if exists "on_request_approval" on "public"."location_association_requests";

drop policy "Allow admin or requester to manage requests" on "public"."location_association_requests";

drop policy "Allow updates for authenticated users" on "public"."location_association_requests";

drop policy "Primary users can approve or reject requests" on "public"."location_association_requests";

drop policy "Users can create their own requests" on "public"."location_association_requests";

drop policy "Users can read their own requests" on "public"."location_association_requests";

drop policy "Allow admin or primary owner to manage associations" on "public"."profile_location_associations";

drop policy "Allow admin or primary owner to update associations" on "public"."profile_location_associations";

drop policy "Allow system to verify new associations" on "public"."profile_location_associations";

drop policy "Only associated users can deactivate associations" on "public"."profile_location_associations";

drop policy "Users can mark their own associations as main" on "public"."profile_location_associations";

drop policy "Users can only read verified associations" on "public"."profile_location_associations";

drop policy "Users can remove their own location associations" on "public"."profile_location_associations";

drop policy "Users can request associations, but they must be verified" on "public"."profile_location_associations";

revoke delete on table "public"."spatial_ref_sys" from "anon";

revoke insert on table "public"."spatial_ref_sys" from "anon";

revoke references on table "public"."spatial_ref_sys" from "anon";

revoke select on table "public"."spatial_ref_sys" from "anon";

revoke trigger on table "public"."spatial_ref_sys" from "anon";

revoke truncate on table "public"."spatial_ref_sys" from "anon";

revoke update on table "public"."spatial_ref_sys" from "anon";

revoke delete on table "public"."spatial_ref_sys" from "authenticated";

revoke insert on table "public"."spatial_ref_sys" from "authenticated";

revoke references on table "public"."spatial_ref_sys" from "authenticated";

revoke select on table "public"."spatial_ref_sys" from "authenticated";

revoke trigger on table "public"."spatial_ref_sys" from "authenticated";

revoke truncate on table "public"."spatial_ref_sys" from "authenticated";

revoke update on table "public"."spatial_ref_sys" from "authenticated";

revoke delete on table "public"."spatial_ref_sys" from "postgres";

revoke insert on table "public"."spatial_ref_sys" from "postgres";

revoke references on table "public"."spatial_ref_sys" from "postgres";

revoke select on table "public"."spatial_ref_sys" from "postgres";

revoke trigger on table "public"."spatial_ref_sys" from "postgres";

revoke truncate on table "public"."spatial_ref_sys" from "postgres";

revoke update on table "public"."spatial_ref_sys" from "postgres";

revoke delete on table "public"."spatial_ref_sys" from "service_role";

revoke insert on table "public"."spatial_ref_sys" from "service_role";

revoke references on table "public"."spatial_ref_sys" from "service_role";

revoke select on table "public"."spatial_ref_sys" from "service_role";

revoke trigger on table "public"."spatial_ref_sys" from "service_role";

revoke truncate on table "public"."spatial_ref_sys" from "service_role";

revoke update on table "public"."spatial_ref_sys" from "service_role";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.update_association_on_request_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Créer l'association avec les droits étendus
    INSERT INTO profile_location_associations (
      profile_id, location_id, is_verified, is_active
    )
    VALUES (
      NEW.requester_id, NEW.location_id, TRUE, TRUE
    )
    ON CONFLICT (profile_id, location_id) 
    DO UPDATE SET is_verified = TRUE, is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$function$
;

create policy "Création des demandes"
on "public"."location_association_requests"
as permissive
for insert
to public
with check (((requester_id = auth.uid()) AND (status = 'pending'::text)));


create policy "Lecture des demandes"
on "public"."location_association_requests"
as permissive
for select
to public
using (((requester_id = auth.uid()) OR (approver_id = auth.uid())));


create policy "Mise à jour des demandes"
on "public"."location_association_requests"
as permissive
for update
to public
using ((((approver_id = auth.uid()) AND (status = 'pending'::text)) OR (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text))))))
with check ((status = ANY (ARRAY['approved'::text, 'rejected'::text])));


create policy "Gestion des associations"
on "public"."profile_location_associations"
as permissive
for all
to public
using (((profile_id = auth.uid()) OR (is_verified = true)))
with check (((profile_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM location_association_requests
  WHERE ((location_association_requests.requester_id = profile_location_associations.profile_id) AND (location_association_requests.location_id = profile_location_associations.location_id) AND (location_association_requests.approver_id = auth.uid()) AND (location_association_requests.status = 'approved'::text))))));


create policy "Insertion via trigger seulement"
on "public"."profile_location_associations"
as permissive
for insert
to public
with check ((EXISTS ( SELECT 1
   FROM location_association_requests
  WHERE ((location_association_requests.requester_id = profile_location_associations.profile_id) AND (location_association_requests.location_id = profile_location_associations.location_id) AND (location_association_requests.status = 'approved'::text)))));



