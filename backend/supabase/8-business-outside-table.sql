CREATE TABLE public.business_outside (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Activation de la RLS
ALTER TABLE public.business_outside ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only owners can create business_outside"
ON public.business_outside
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read business_outside"
ON public.business_outside
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only owners can update business_outside"
ON public.business_outside
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la suppression
CREATE POLICY "Only owners can delete business_outside"
ON public.business_outside
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_business_outside_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_business_outside_updated_at
BEFORE UPDATE ON public.business_outside
FOR EACH ROW
EXECUTE FUNCTION update_business_outside_updated_at();

CREATE TABLE public.business_outside_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dim, 1=Lun, ..., 6=Sam
    opening_time TIME,
    closing_time TIME,
    has_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_start TIME,
    break_end TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_business_outside_hours CHECK (
        (is_closed = TRUE AND opening_time IS NULL AND closing_time IS NULL AND break_start IS NULL AND break_end IS NULL) OR
        (is_closed = FALSE AND (
            (has_break = FALSE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time) OR
            (has_break = TRUE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND break_start IS NOT NULL AND break_end IS NOT NULL AND
             opening_time < break_start AND break_start < break_end AND break_end < closing_time)
        ))
    )
);

-- Activation de la RLS
ALTER TABLE public.business_outside_hours ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only business owners can create outside hours"
ON public.business_outside_hours
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE id = business_id AND owner_id = auth.uid()
    )
);

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read business outside hours"
ON public.business_outside_hours
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only business owners can update outside hours"
ON public.business_outside_hours
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE id = business_id AND owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE id = business_id AND owner_id = auth.uid()
    )
);

-- Politique RLS pour la suppression
CREATE POLICY "Only business owners can delete outside hours"
ON public.business_outside_hours
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.businesses
        WHERE id = business_id AND owner_id = auth.uid()
    )
);

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_business_outside_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_business_outside_hours_updated_at
BEFORE UPDATE ON public.business_outside_hours
FOR EACH ROW
EXECUTE FUNCTION update_business_outside_hours_updated_at(); 