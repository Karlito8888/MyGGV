CREATE TABLE public.location_type_associations (
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES public.location_types(id) ON DELETE CASCADE,
    PRIMARY KEY (location_id, type_id)
);

-- Index pour optimiser les recherches
CREATE INDEX idx_location_type_associations_location_id ON public.location_type_associations(location_id);
CREATE INDEX idx_location_type_associations_type_id ON public.location_type_associations(type_id);

-- Activation de la RLS
ALTER TABLE public.location_type_associations ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour l'insertion
CREATE POLICY "Only admins can create location_type_associations"
ON public.location_type_associations
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
CREATE POLICY "Authenticated users can read location_type_associations"
ON public.location_type_associations
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour la mise à jour
CREATE POLICY "Only admins can update location_type_associations"
ON public.location_type_associations
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
CREATE POLICY "Only admins can delete location_type_associations"
ON public.location_type_associations
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
CREATE OR REPLACE FUNCTION update_location_type_associations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_location_type_associations_updated_at
BEFORE UPDATE ON public.location_type_associations
FOR EACH ROW
EXECUTE FUNCTION update_location_type_associations_updated_at(); 