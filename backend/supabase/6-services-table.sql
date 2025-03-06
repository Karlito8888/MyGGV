CREATE TABLE public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    description TEXT,
    has_custom_hours BOOLEAN NOT NULL DEFAULT FALSE,
    default_opening_time TIME,
    default_closing_time TIME,
    default_has_break BOOLEAN NOT NULL DEFAULT FALSE,
    default_break_start TIME,
    default_break_end TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL
);

-- Activation de la RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only owners can create services"
ON public.services
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read services"
ON public.services
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only owners can update services"
ON public.services
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la suppression
CREATE POLICY "Only owners can delete services"
ON public.services
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_services_updated_at
BEFORE UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION update_services_updated_at(); 