import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface POI {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
}

export const usePoi = () => {
  const [poi, setPoi] = useState<POI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPoi = async () => {
      try {
        // Vérifier le cache local avant de faire la requête
        const cachedPoi = localStorage.getItem("poi");
        if (cachedPoi) {
          setPoi(JSON.parse(cachedPoi));
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("poi")
          .select("*")
          .order("created_at", { ascending: true });

        if (error) throw error;
        setPoi(data as POI[]);

        // Mettre en cache dans localStorage
        localStorage.setItem("poi", JSON.stringify(data));
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Une erreur inconnue est survenue");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPoi();
  }, []);

  return { poi, loading, error };
};
