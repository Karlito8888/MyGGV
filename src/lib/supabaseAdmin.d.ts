/**
 * Configuration du client Supabase Admin pour l'application
 *
 * Ce fichier initialise un client Supabase avec des privilèges administratifs
 * en utilisant la clé de service (service role key). Ce client possède des
 * permissions étendues qui contournent les règles RLS (Row Level Security).
 *
 * ATTENTION: Ce client ne doit être utilisé que:
 * - Dans un environnement sécurisé (côté serveur)
 * - Pour des opérations administratives spécifiques
 * - Jamais exposé côté client
 *
 * Utilisations typiques:
 * - Opérations administratives sur les utilisateurs
 * - Accès aux données sans restrictions de RLS
 * - Tâches de maintenance ou migrations
 */
export declare const supabaseAdmin: import("@supabase/supabase-js").SupabaseClient<any, "public", any>;
export declare const adminAuthClient: import("@supabase/auth-js").GoTrueAdminApi;
