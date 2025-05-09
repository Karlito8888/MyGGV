/**
 * Configuration du client Supabase standard pour l'application
 *
 * Ce fichier initialise le client Supabase principal utilisé pour toutes les opérations
 * côté client dans l'application. Il utilise la clé anonyme (anon key) qui a des
 * permissions limitées définies par les règles RLS (Row Level Security) de Supabase.
 *
 * Utilisations typiques:
 * - Authentification des utilisateurs (connexion, inscription)
 * - Requêtes de base de données avec les permissions de l'utilisateur connecté
 * - Abonnements aux changements en temps réel
 * - Stockage de fichiers avec les permissions appropriées
 */
export declare const supabase: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
