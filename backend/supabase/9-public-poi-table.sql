CREATE TABLE public.public_poi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    poi_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
); 

-- Activation de la RLS
ALTER TABLE public.public_poi ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only admins can create public_poi"
ON public.public_poi
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'admin');

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read public_poi"
ON public.public_poi
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only admins can update public_poi"
ON public.public_poi
FOR UPDATE
TO authenticated
USING (auth.role() = 'admin')
WITH CHECK (auth.role() = 'admin');

-- Politique RLS pour la suppression
CREATE POLICY "Only admins can delete public_poi"
ON public.public_poi
FOR DELETE
TO authenticated
USING (auth.role() = 'admin'); 

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
BEFORE UPDATE ON public.public_poi
FOR EACH ROW
EXECUTE FUNCTION update_public_poi_updated_at(); 