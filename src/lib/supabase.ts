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

import { createClient } from "@supabase/supabase-js";

// Récupération des variables d'environnement
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Vérification de la présence des variables d'environnement requises
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key");
}

// Création et export du client Supabase standard
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,  // Rafraîchit automatiquement le token d'authentification
    persistSession: true,    // Persiste la session entre les rechargements de page
  },
});
