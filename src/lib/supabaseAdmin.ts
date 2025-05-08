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

import { createClient } from "@supabase/supabase-js";

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase URL or Service Role Key");
}

// Création et export du client Supabase Admin
export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,  // Désactive le rafraîchissement auto des tokens
    persistSession: false,    // Désactive la persistance des sessions
  },
});

// Accès à l'API d'administration des utilisateurs
export const adminAuthClient = supabaseAdmin.auth.admin;
