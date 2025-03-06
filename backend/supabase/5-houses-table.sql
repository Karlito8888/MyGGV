CREATE TABLE public.houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    icon_url TEXT NOT NULL DEFAULT 'https://example.com/default-house-icon.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Activation de la RLS
ALTER TABLE public.houses ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only owners can create houses"
ON public.houses
FOR INSERT
TO authenticated
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read houses"
ON public.houses
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only owners can update houses"
ON public.houses
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

-- Politique RLS pour la suppression
CREATE POLICY "Only owners can delete houses"
ON public.houses
FOR DELETE
TO authenticated
USING (owner_id = auth.uid());

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_houses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_houses_updated_at
BEFORE UPDATE ON public.houses
FOR EACH ROW
EXECUTE FUNCTION update_houses_updated_at(); 