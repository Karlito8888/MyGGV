CREATE TABLE public.profile_location_associations (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (profile_id, location_id)
);

-- Activation de la RLS
ALTER TABLE public.profile_location_associations ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Users can request associations, but they must be verified"
ON public.profile_location_associations
FOR INSERT
TO authenticated
WITH CHECK (profile_id = auth.uid());

-- Politique RLS pour la lecture
CREATE POLICY "Users can only read verified associations"
ON public.profile_location_associations
FOR SELECT
TO authenticated
USING (is_verified = TRUE);

-- Politique RLS pour la suppression
CREATE POLICY "Users can remove their own location associations"
ON public.profile_location_associations
FOR DELETE
TO authenticated
USING (profile_id = auth.uid());

-- Politique RLS pour la mise à jour de is_active
CREATE POLICY "Only associated users can deactivate associations"
ON public.profile_location_associations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profile_location_associations pla
        WHERE pla.location_id = location_id AND pla.profile_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profile_location_associations pla
        WHERE pla.location_id = location_id AND pla.profile_id = auth.uid()
    )
); 