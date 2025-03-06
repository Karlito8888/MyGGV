CREATE TABLE public.business_inside (
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
ALTER TABLE public.business_inside ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only owners can create business_inside"
ON public.business_inside
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read business_inside"
ON public.business_inside
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only owners can update business_inside"
ON public.business_inside
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la suppression
CREATE POLICY "Only owners can delete business_inside"
ON public.business_inside
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_business_inside_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_business_inside_updated_at
BEFORE UPDATE ON public.business_inside
FOR EACH ROW
EXECUTE FUNCTION update_business_inside_updated_at(); 