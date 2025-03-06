CREATE TABLE public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE, -- Nom de la catégorie (exemple : "Garde d'enfants")
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Insertion des catégories de services par défaut
INSERT INTO public.service_categories (name)
VALUES
    ('Childcare'),
    ('Appliance Repair'),
    ('Computer Support'),
    ('Home Cooking'),
    ('Housekeeping');

-- Activation de la RLS
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only admins can create service_categories"
ON public.service_categories
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Politique RLS pour la lecture
CREATE POLICY "Authenticated users can read service_categories"
ON public.service_categories
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only admins can update service_categories"
ON public.service_categories
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

-- Politique RLS pour la suppression
CREATE POLICY "Only admins can delete service_categories"
ON public.service_categories
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
);

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_service_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_service_categories_updated_at
BEFORE UPDATE ON public.service_categories
FOR EACH ROW
EXECUTE FUNCTION update_service_categories_updated_at();