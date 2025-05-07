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

create table "public"."location_association_requests" (
    "id" uuid not null default gen_random_uuid(),
    "requester_id" uuid not null,
    "location_id" uuid not null,
    "approver_id" uuid not null,
    "status" text not null default 'pending'::text,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."location_association_requests" enable row level security;

create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "message" text not null,
    "related_id" uuid,
    "is_read" boolean default false,
    "created_at" timestamp with time zone default timezone('utc'::text, now()),
    "updated_at" timestamp with time zone default timezone('utc'::text, now())
);


alter table "public"."notifications" enable row level security;

alter table "public"."profile_location_associations" add column "is_primary" boolean default false;

CREATE UNIQUE INDEX location_association_requests_pkey ON public.location_association_requests USING btree (id);

CREATE UNIQUE INDEX location_association_requests_requester_id_location_id_key ON public.location_association_requests USING btree (requester_id, location_id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

alter table "public"."location_association_requests" add constraint "location_association_requests_pkey" PRIMARY KEY using index "location_association_requests_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."location_association_requests" add constraint "location_association_requests_approver_id_fkey" FOREIGN KEY (approver_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."location_association_requests" validate constraint "location_association_requests_approver_id_fkey";

alter table "public"."location_association_requests" add constraint "location_association_requests_location_id_fkey" FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE not valid;

alter table "public"."location_association_requests" validate constraint "location_association_requests_location_id_fkey";

alter table "public"."location_association_requests" add constraint "location_association_requests_requester_id_fkey" FOREIGN KEY (requester_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."location_association_requests" validate constraint "location_association_requests_requester_id_fkey";

alter table "public"."location_association_requests" add constraint "location_association_requests_requester_id_location_id_key" UNIQUE using index "location_association_requests_requester_id_location_id_key";

alter table "public"."location_association_requests" add constraint "location_association_requests_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text]))) not valid;

alter table "public"."location_association_requests" validate constraint "location_association_requests_status_check";

alter table "public"."notifications" add constraint "notifications_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE not valid;

alter table "public"."notifications" validate constraint "notifications_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.auto_verify_first_user()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Vérifier si c'est la première association pour cette location
    IF NOT EXISTS (
        SELECT 1 FROM public.profile_location_associations 
        WHERE location_id = NEW.location_id AND is_verified = TRUE
    ) THEN
        -- Premier utilisateur: automatiquement vérifié et défini comme primaire
        NEW.is_verified := TRUE;
        NEW.is_primary := TRUE;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_location_request_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    -- Notification pour l'approbateur
    INSERT INTO public.notifications (user_id, type, message, related_id)
    VALUES (
        NEW.approver_id,
        'location_request',
        'Someone has requested to be associated with your location',
        NEW.id
    );
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.create_location_response_notification()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    IF OLD.status = 'pending' AND NEW.status = 'approved' THEN
        -- Notification pour le demandeur - approuvé
        INSERT INTO public.notifications (user_id, type, message, related_id)
        VALUES (
            NEW.requester_id,
            'location_approved',
            'Your location association request has been approved',
            NEW.id
        );
    ELSIF OLD.status = 'pending' AND NEW.status = 'rejected' THEN
        -- Notification pour le demandeur - rejeté
        INSERT INTO public.notifications (user_id, type, message, related_id)
        VALUES (
            NEW.requester_id,
            'location_rejected',
            'Your location association request has been rejected',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

grant delete on table "public"."location_association_requests" to "anon";

grant insert on table "public"."location_association_requests" to "anon";

grant references on table "public"."location_association_requests" to "anon";

grant select on table "public"."location_association_requests" to "anon";

grant trigger on table "public"."location_association_requests" to "anon";

grant truncate on table "public"."location_association_requests" to "anon";

grant update on table "public"."location_association_requests" to "anon";

grant delete on table "public"."location_association_requests" to "authenticated";

grant insert on table "public"."location_association_requests" to "authenticated";

grant references on table "public"."location_association_requests" to "authenticated";

grant select on table "public"."location_association_requests" to "authenticated";

grant trigger on table "public"."location_association_requests" to "authenticated";

grant truncate on table "public"."location_association_requests" to "authenticated";

grant update on table "public"."location_association_requests" to "authenticated";

grant delete on table "public"."location_association_requests" to "service_role";

grant insert on table "public"."location_association_requests" to "service_role";

grant references on table "public"."location_association_requests" to "service_role";

grant select on table "public"."location_association_requests" to "service_role";

grant trigger on table "public"."location_association_requests" to "service_role";

grant truncate on table "public"."location_association_requests" to "service_role";

grant update on table "public"."location_association_requests" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

create policy "Primary users can approve or reject requests"
on "public"."location_association_requests"
as permissive
for update
to authenticated
using ((approver_id = auth.uid()))
with check ((approver_id = auth.uid()));


create policy "Users can create their own requests"
on "public"."location_association_requests"
as permissive
for insert
to authenticated
with check ((requester_id = auth.uid()));


create policy "Users can read their own requests"
on "public"."location_association_requests"
as permissive
for select
to authenticated
using (((requester_id = auth.uid()) OR (approver_id = auth.uid())));


create policy "Users can read their own notifications"
on "public"."notifications"
as permissive
for select
to authenticated
using ((user_id = auth.uid()));


create policy "Users can update their own notifications"
on "public"."notifications"
as permissive
for update
to authenticated
using ((user_id = auth.uid()))
with check ((user_id = auth.uid()));


CREATE TRIGGER on_location_request_created AFTER INSERT ON public.location_association_requests FOR EACH ROW EXECUTE FUNCTION create_location_request_notification();

CREATE TRIGGER on_location_request_updated AFTER UPDATE ON public.location_association_requests FOR EACH ROW EXECUTE FUNCTION create_location_response_notification();

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON public.notifications FOR EACH ROW EXECUTE FUNCTION update_notifications_updated_at();

CREATE TRIGGER auto_verify_first_user_trigger BEFORE INSERT ON public.profile_location_associations FOR EACH ROW EXECUTE FUNCTION auto_verify_first_user();


