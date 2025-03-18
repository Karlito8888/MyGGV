-- Activer PostGIS si ce n'est pas déjà fait
CREATE EXTENSION IF NOT EXISTS postgis;

-- Créer la table profiles sans la contrainte de main_location_id
CREATE TABLE public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
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
    main_location_id UUID, -- Contrainte ajoutée plus tard
    has_a_service BOOLEAN DEFAULT FALSE,
    service_location UUID, -- Contrainte ajoutée plus tard
    has_a_business_inside BOOLEAN DEFAULT FALSE,
    business_inside_location UUID, -- Contrainte ajoutée plus tard
    has_a_business_outside BOOLEAN DEFAULT FALSE,
    business_outside_location UUID, -- Contrainte ajoutée plus tard
    role TEXT NOT NULL CHECK (role IN ('user', 'admin', 'moderator')) DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    is_public_profile BOOLEAN DEFAULT TRUE
);

-- Créer la table locations
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block TEXT NOT NULL,
    lot TEXT NOT NULL,
    coordinates GEOMETRY(Point, 4326),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE,
    is_locked BOOLEAN DEFAULT FALSE
);

-- Créer la table location_types
CREATE TABLE public.location_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE CHECK (name IN ('house', 'service', 'business_inside', 'business_outside', 'public_poi'))
);

-- Insertion des types de lieux par défaut
INSERT INTO public.location_types (name)
VALUES
    ('house'),
    ('service'),
    ('business_inside'),
    ('business_outside'),
    ('public_poi');

-- Créer la table houses_available_icons
CREATE TABLE public.houses_available_icons (
    id SERIAL PRIMARY KEY,
    icon_url TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Créer la table location_type_associations
CREATE TABLE public.location_type_associations (
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    type_id UUID NOT NULL REFERENCES public.location_types(id) ON DELETE CASCADE,
    PRIMARY KEY (location_id, type_id)
);

-- Créer la table houses
CREATE TABLE public.houses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    icon_url TEXT NOT NULL DEFAULT 'https://example.com/default-house-icon.png',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Créer la table service_categories
CREATE TABLE public.service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
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

-- Créer la table services
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

-- Créer la table service_hours
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

-- Créer la table business_inside_categories
CREATE TABLE public.business_inside_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Insertion des catégories d'entreprises par défaut
INSERT INTO public.business_inside_categories (name)
VALUES
    ('Restaurant'),
    ('Boutique'),
    ('Café'),
    ('Salon de beauté'),
    ('Gym');

-- Créer la table business_inside
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

-- Créer la table business_inside_hours
CREATE TABLE public.business_inside_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.business_inside(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dim, 1=Lun, ..., 6=Sam
    opening_time TIME,
    closing_time TIME,
    has_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_start TIME,
    break_end TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_business_hours CHECK (
        (is_closed = TRUE AND opening_time IS NULL AND closing_time IS NULL AND break_start IS NULL AND break_end IS NULL) OR
        (is_closed = FALSE AND (
            (has_break = FALSE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time) OR
            (has_break = TRUE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND break_start IS NOT NULL AND break_end IS NOT NULL AND
             opening_time < break_start AND break_start < break_end AND break_end < closing_time)
        ))
    )
);

-- Créer la table business_outside_categories
CREATE TABLE public.business_outside_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Insertion des catégories d'entreprises par défaut
INSERT INTO public.business_outside_categories (name)
VALUES
    ('Restaurant'),
    ('Boutique'),
    ('Café'),
    ('Salon de beauté'),
    ('Gym');

-- Créer la table business_outside
CREATE TABLE public.business_outside (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Créer la table business_outside_hours
CREATE TABLE public.business_outside_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.business_outside(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dim, 1=Lun, ..., 6=Sam
    opening_time TIME,
    closing_time TIME,
    has_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_start TIME,
    break_end TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_business_outside_hours CHECK (
        (is_closed = TRUE AND opening_time IS NULL AND closing_time IS NULL AND break_start IS NULL AND break_end IS NULL) OR
        (is_closed = FALSE AND (
            (has_break = FALSE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time) OR
            (has_break = TRUE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND break_start IS NOT NULL AND break_end IS NOT NULL AND
             opening_time < break_start AND break_start < break_end AND break_end < closing_time)
        ))
    )
);

-- Créer la table public_poi_categories
CREATE TABLE public.public_poi_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
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

-- Créer la table public_poi
CREATE TABLE public.public_poi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    poi_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- Créer la table public_poi_hours
CREATE TABLE public.public_poi_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    poi_name TEXT NOT NULL,
    description TEXT,
    poi_type TEXT NOT NULL, -- Exemple : parc, musée, monument, etc.
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dim, 1=Lun, ..., 6=Sam
    opening_time TIME,
    closing_time TIME,
    has_break BOOLEAN NOT NULL DEFAULT FALSE,
    break_start TIME,
    break_end TIME,
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

    CONSTRAINT valid_poi_hours CHECK (
        (is_closed = TRUE AND opening_time IS NULL AND closing_time IS NULL AND break_start IS NULL AND break_end IS NULL) OR
        (is_closed = FALSE AND (
            (has_break = FALSE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND opening_time < closing_time) OR
            (has_break = TRUE AND opening_time IS NOT NULL AND closing_time IS NOT NULL AND break_start IS NOT NULL AND break_end IS NOT NULL AND
             opening_time < break_start AND break_start < break_end AND break_end < closing_time)
        ))
    )
);

-- Créer la table profile_location_associations
CREATE TABLE public.profile_location_associations (
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (profile_id, location_id)
);