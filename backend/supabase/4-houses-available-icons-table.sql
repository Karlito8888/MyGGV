CREATE TABLE public.houses_available_icons (
    id SERIAL PRIMARY KEY,
    icon_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Politique RLS pour les icônes disponibles
ALTER TABLE public.houses_available_icons ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour la lecture
CREATE POLICY "All users can read available icons"
ON public.houses_available_icons
FOR SELECT
TO authenticated
USING (true);

-- Politique RLS pour l'insertion (admin seulement)
CREATE POLICY "Only admin can create available icons"
ON public.houses_available_icons
FOR INSERT
TO authenticated
USING (is_admin_user(auth.uid()));

-- Politique RLS pour la mise à jour (admin seulement)
CREATE POLICY "Only admin can update available icons"
ON public.houses_available_icons
FOR UPDATE
TO authenticated
USING (is_admin_user(auth.uid()))
WITH CHECK (is_admin_user(auth.uid()));

-- Politique RLS pour la suppression (admin seulement)
CREATE POLICY "Only admin can delete available icons"
ON public.houses_available_icons
FOR DELETE
TO authenticated
USING (is_admin_user(auth.uid())); 