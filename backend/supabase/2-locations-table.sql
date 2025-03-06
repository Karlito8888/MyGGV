CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block TEXT NOT NULL, -- Numéro de block
    lot TEXT NOT NULL, -- Numéro de lot
    coordinates GEOMETRY(Point, 4326), -- Coordonnées géographiques (latitude, longitude)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN DEFAULT FALSE -- Nouveau champ pour verrouiller les associations
);

-- Activation de la Row Level Security (RLS)
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only admins can create locations"
ON public.locations
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Politique RLS pour la suppression
CREATE POLICY "Only admins can delete locations"
ON public.locations
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read locations"
ON public.locations
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour des champs sensibles (block, lot, coordinates)
CREATE POLICY "Only admins can update block, lot, and coordinates"
ON public.locations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Politique RLS pour la mise à jour de is_locked
CREATE POLICY "Only associated users can lock/unlock locations"
ON public.locations
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profile_location_associations pla
        WHERE pla.location_id = id AND pla.profile_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profile_location_associations pla
        WHERE pla.location_id = id AND pla.profile_id = auth.uid()
    )
); 