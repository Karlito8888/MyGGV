CREATE TABLE public.public_poi_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Nom de la catégorie (exemple : "Parc", "Musée")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Insertion des catégories de points d'intérêt par défaut
INSERT INTO public.public_poi_categories (name)
VALUES
    ('Parc'),
    ('Musée'),
    ('Monument'),
    ('Lieu historique'),
    ('Jardin public');

-- Activation de la RLS
ALTER TABLE public.public_poi_categories ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only admins can create public_poi_categories"
ON public.public_poi_categories
FOR INSERT
TO authenticated
WITH CHECK (auth.role() = 'admin');

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read public_poi_categories"
ON public.public_poi_categories
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only admins can update public_poi_categories"
ON public.public_poi_categories
FOR UPDATE
TO authenticated
USING (auth.role() = 'admin')
WITH CHECK (auth.role() = 'admin');

-- Politique RLS pour la suppression
CREATE POLICY "Only admins can delete public_poi_categories"
ON public.public_poi_categories
FOR DELETE
TO authenticated
USING (auth.role() = 'admin');

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_public_poi_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_public_poi_categories_updated_at
BEFORE UPDATE ON public.public_poi_categories
FOR EACH ROW
EXECUTE FUNCTION update_public_poi_categories_updated_at(); 