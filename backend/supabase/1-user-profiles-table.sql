-- Création de la table
CREATE TABLE public.profiles (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    display_name TEXT,
    email TEXT UNIQUE,
    occupation TEXT,
    profile_picture_url TEXT,
    description TEXT,
    facebook TEXT,
    messenger TEXT,
    whatsapp TEXT,
    viber TEXT,
    coins INTEGER DEFAULT 0 CHECK (coins >= 0),
    main_location_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    has_a_service BOOLEAN DEFAULT FALSE,
    service_location UUID REFERENCES public.services(id) ON DELETE SET NULL,
    CONSTRAINT service_location_check CHECK (
        (has_a_service = TRUE AND service_location IS NOT NULL) OR
        (has_a_service = FALSE AND service_location IS NULL)
    ),
    has_a_business_inside BOOLEAN DEFAULT FALSE,
    business_inside_location UUID REFERENCES public.business_inside(id) ON DELETE SET NULL,
    CONSTRAINT business_inside_location_check CHECK (
        (has_a_business_inside = TRUE AND business_inside_location IS NOT NULL) OR
        (has_a_business_inside = FALSE AND business_inside_location IS NULL)
    ),
    has_a_business_outside BOOLEAN DEFAULT FALSE,
    business_outside_location UUID REFERENCES public.business_outside(id) ON DELETE SET NULL,
    CONSTRAINT business_outside_location_check CHECK (
        (has_a_business_outside = TRUE AND business_outside_location IS NOT NULL) OR
        (has_a_business_outside = FALSE AND business_outside_location IS NULL)
    ),
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'moderator')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_public_profile BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (id)
);

-- Création des index
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- Activation de la Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Création de la fonction pour le trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Création du trigger
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Politique RLS pour la lecture des profils publics
CREATE POLICY "Authenticated users can read public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (is_public_profile = TRUE);

-- Politique RLS pour la mise à jour des profils par le propriétaire
CREATE POLICY "Users can update their own profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Politique RLS pour la lecture des profils par le propriétaire
CREATE POLICY "Users can read their own profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Politique RLS pour la suppression des profils par le propriétaire
CREATE POLICY "Users can delete their own profiles"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);

-- Politique RLS pour l'insertion de nouveaux profils
CREATE POLICY "Users can insert their own profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Politique RLS pour les administrateurs (accès complet)
CREATE POLICY "Admins have full access to profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (auth.role() = 'admin');