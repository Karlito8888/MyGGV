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