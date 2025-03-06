CREATE TABLE public.service_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dim, 1=Lun, ..., 6=Sam
    opening_time TIME,
    closing_time TIME,
    has_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_start TIME,
    break_end TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_hours CHECK (
        (is_closed = TRUE AND opening_time IS NULL AND closing_time IS NULL AND break_start IS NULL AND break_end IS NULL) OR
        (is_closed = FALSE AND (
            (has_break = FALSE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time) OR
            (has_break = TRUE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND break_start IS NOT NULL AND break_end IS NOT NULL AND
             opening_time < break_start AND break_start < break_end AND break_end < closing_time)
        ))
    )
);

-- Activation de la RLS
ALTER TABLE public.service_hours ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only service owners can create hours"
ON public.service_hours
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.services
        WHERE id = service_id AND owner_id = auth.uid()
    )
);

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read service hours"
ON public.service_hours
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only service owners can update hours"
ON public.service_hours
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.services
        WHERE id = service_id AND owner_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.services
        WHERE id = service_id AND owner_id = auth.uid()
    )
);

-- Politique RLS pour la suppression
CREATE POLICY "Only service owners can delete hours"
ON public.service_hours
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.services
        WHERE id = service_id AND owner_id = auth.uid()
    )
);

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_service_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_service_hours_updated_at
BEFORE UPDATE ON public.service_hours
FOR EACH ROW
EXECUTE FUNCTION update_service_hours_updated_at(); 