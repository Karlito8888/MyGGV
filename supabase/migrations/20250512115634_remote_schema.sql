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
AS $function$
BEGIN
    -- Vérifier si une association existe déjà
    IF EXISTS (
        SELECT 1 FROM "public"."profile_location_associations"
        WHERE "profile_id" = NEW."requester_id" AND "location_id" = NEW."location_id"
    ) THEN
        -- Mettre à jour l'association existante
        UPDATE "public"."profile_location_associations"
        SET "is_verified" = TRUE
        WHERE "profile_id" = NEW."requester_id" AND "location_id" = NEW."location_id";
    ELSE
        -- Créer une nouvelle association
        INSERT INTO "public"."profile_location_associations" ("profile_id", "location_id", "is_verified")
        VALUES (NEW."requester_id", NEW."location_id", TRUE);
    END IF;
    RETURN NEW;
END;
$function$
;

create policy "Allow admin or location owner to update requests"
on "public"."location_association_requests"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profile_location_associations pla
  WHERE ((pla.location_id = location_association_requests.location_id) AND (pla.profile_id = auth.uid()) AND (pla.is_verified = true))))));


create policy "Allow updates for authenticated users"
on "public"."location_association_requests"
as permissive
for update
to authenticated
using (true);


create policy "Allow admin or location owner to verify associations"
on "public"."profile_location_associations"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM profile_location_associations pla
  WHERE ((pla.location_id = profile_location_associations.location_id) AND (pla.profile_id = auth.uid()) AND (pla.is_verified = true))))))
with check (true);


create policy "Allow admin or primary owner to update associations"
on "public"."profile_location_associations"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) OR (EXISTS ( SELECT 1
   FROM locations
  WHERE ((locations.id = profile_location_associations.location_id) AND (profile_location_associations.is_primary = true) AND (profile_location_associations.profile_id = auth.uid()))))));


create policy "Allow updates for authenticated users"
on "public"."profile_location_associations"
as permissive
for update
to authenticated
using (true);



