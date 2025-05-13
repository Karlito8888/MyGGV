drop policy "Allow admin or location owner to update requests" on "public"."location_association_requests";

drop policy "Allow admin or location owner to verify associations" on "public"."profile_location_associations";

drop policy "Allow updates for authenticated users" on "public"."profile_location_associations";

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

create policy "Allow admin or requester to manage requests"
on "public"."location_association_requests"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) OR (requester_id = auth.uid())));


create policy "Allow admin or primary owner to manage associations"
on "public"."profile_location_associations"
as permissive
for update
to authenticated
using (((EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = 'admin'::text)))) OR ((profile_id = auth.uid()) AND (is_primary = true)) OR (EXISTS ( SELECT 1
   FROM profile_location_associations pla
  WHERE ((pla.profile_id = auth.uid()) AND (pla.location_id = profile_location_associations.location_id) AND (pla.is_verified = true))))))
with check (true);


create policy "Allow system to verify new associations"
on "public"."profile_location_associations"
as permissive
for insert
to authenticated
with check (true);


CREATE TRIGGER on_request_approval AFTER UPDATE OF status ON public.location_association_requests FOR EACH ROW WHEN ((new.status = 'approved'::text)) EXECUTE FUNCTION update_association_on_request_approval();


