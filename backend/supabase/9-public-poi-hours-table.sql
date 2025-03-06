CREATE TABLE public.public_poi_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    poi_name TEXT NOT NULL,
    description TEXT,
    poi_type TEXT NOT NULL, -- Exemple : parc, musée, monument, etc.
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dim, 1=Lun, ..., 6=Sam
    opening_time TIME,
    closing_time TIME,
    has_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_start TIME,
    break_end TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_poi_hours CHECK (
        (is_closed = TRUE AND opening_time IS NULL AND closing_time IS NULL AND break_start IS NULL AND break_end IS NULL) OR
        (is_closed = FALSE AND (
            (has_break = FALSE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time) OR
            (has_break = TRUE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND break_start IS NOT NULL AND break_end IS NOT NULL AND
             opening_time < break_start AND break_start < break_end AND break_end < closing_time)
        ))
    )
);

-- Activation de la RLS
ALTER TABLE public.public_poi_hours ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only admins can create POI"
ON public.public_poi_hours
FOR INSERT
TO authenticated
WITH CHECK (is_admin());

-- Politique RLS pour la lecture
CREATE POLICY "All users can read POI"
ON public.public_poi_hours
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only admins can update POI"
ON public.public_poi_hours
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Politique RLS pour la suppression
CREATE POLICY "Only admins can delete POI"
ON public.public_poi_hours
FOR DELETE
TO authenticated
USING (is_admin());

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_public_poi_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_public_poi_updated_at
BEFORE UPDATE ON public.public_poi_hours
FOR EACH ROW
EXECUTE FUNCTION update_public_poi_updated_at();