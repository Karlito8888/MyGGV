import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import "./locationAssociation.css"; // Importez le fichier CSS

// Types pour les données manipulées
interface Location {
  id: string;
  block: string;
  lot: string;
}

interface OnboardingLocationAssociationProps {
  onLocationAdded?: () => void;
  onRequestSent?: () => void;
}

export const LocationAssociation = ({
  onLocationAdded,
  onRequestSent,
}: OnboardingLocationAssociationProps) => {
  // Récupération de l'utilisateur connecté
  const { user } = useAuth();

  // États pour gérer les données et l'UI
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // États pour les données de localisation
  const [locations, setLocations] = useState<Location[]>([]);

  // États pour la sélection de bloc/lot
  const [blocks, setBlocks] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedLot, setSelectedLot] = useState("");
  const [filteredLots, setFilteredLots] = useState<Location[]>([]);

  // Chargement initial des localisations disponibles
  useEffect(() => {
    if (user) {
      fetchLocations();
    }
  }, [user]);

  // Filtrage des lots disponibles quand un bloc est sélectionné
  useEffect(() => {
    if (selectedBlock) {
      const lots = locations
        .filter((loc) => loc.block === selectedBlock)
        .sort((a, b) => Number(a.lot) - Number(b.lot));

      setFilteredLots(lots);
      setSelectedLot("");
    }
  }, [selectedBlock, locations]);

  /**
   * Récupère uniquement les données de localisation disponibles
   */
  const fetchLocations = async () => {
    try {
      setLoading(true);

      // Chargement de toutes les localisations disponibles
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("*")
        .is("deleted_at", null)
        .order("block", { ascending: true });

      if (locationsError) throw locationsError;

      // Extraction et tri des blocs uniques
      const uniqueBlocks = [...new Set(locationsData.map((loc) => loc.block))];
      const sortedBlocks = uniqueBlocks.sort((a, b) => Number(a) - Number(b));

      // Mise à jour des états avec les données récupérées
      setLocations(locationsData);
      setBlocks(sortedBlocks);
    } catch (error) {
      console.error("Error loading locations:", error);
      toast.error('Failed to load locations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Vérifie si la localisation a déjà un utilisateur vérifié associé
   * @param locationId ID de la localisation à vérifier
   * @returns {Promise<{hasVerifiedUser: boolean, primaryUserId: string | null}>}
   */
  const checkLocationAssociation = async (locationId: string) => {
    try {
      const { data, error } = await supabase
        .from("profile_location_associations")
        .select("profile_id, is_verified, is_primary")
        .eq("location_id", locationId)
        .eq("is_verified", true)
        .limit(1);

      if (error) throw error;

      const hasVerifiedUser = data && data.length > 0;
      const primaryUserId = hasVerifiedUser ? data[0].profile_id : null;

      return { hasVerifiedUser, primaryUserId };
    } catch (error) {
      console.error("Error checking location association:", error);
      toast.error("Failed to check location association");
      throw error;
    }
  };

  /**
   * Crée une demande d'association pour un utilisateur secondaire
   * @param locationId ID de la localisation
   * @param approverId ID de l'utilisateur principal qui doit approuver
   */
  const createAssociationRequest = async (locationId: string, approverId: string) => {
    if (!user) return;

    try {
      // Créer une demande d'association
      const { error: requestError } = await supabase
        .from("location_association_requests")
        .insert({
          requester_id: user.id,
          location_id: locationId,
          approver_id: approverId,
          status: "pending",
        });

      if (requestError) throw requestError;

      // Créer une association non vérifiée
      const { error: associationError } = await supabase
        .from("profile_location_associations")
        .insert({
          profile_id: user.id,
          location_id: locationId,
          is_active: true,
          is_verified: false,
          is_primary: false,
          is_main: true,
        });

      if (associationError) throw associationError;

      // Mettre à jour le profil avec la localisation principale (même si non vérifiée)
      await supabase
        .from("profiles")
        .update({ main_location_id: locationId })
        .eq("id", user.id);

      toast.info('Your location request has been sent. You will need approval from the primary resident before accessing all features.');

      // Notifier le parent que la demande a été envoyée
      if (onRequestSent) {
        onRequestSent();
      }
    } catch (error) {
      console.error("Error creating association request:", error);
      toast.error('Failed to send location request. Please try again.');
    }
  };

  /**
   * Ajoute une association entre l'utilisateur et une localisation
   * @param locationId ID de la localisation à associer
   */
  const addAssociation = async (locationId: string) => {
    if (!user) return;
    setSubmitting(true);

    try {
      // Vérifier si la localisation a déjà un utilisateur vérifié
      const { hasVerifiedUser, primaryUserId } = await checkLocationAssociation(locationId);

      if (hasVerifiedUser && primaryUserId) {
        // Cas 2: Ce n'est pas le premier utilisateur - créer une demande d'association
        await createAssociationRequest(locationId, primaryUserId);
      } else {
        // Cas 1: Premier utilisateur - association directe et vérifiée
        const { error } = await supabase
          .from("profile_location_associations")
          .insert({
            profile_id: user.id,
            location_id: locationId,
            is_active: true,
            is_verified: true,
            is_primary: true,
            is_main: true,
          });

        if (error) throw error;

        // Mettre à jour le profil avec la localisation principale
        await supabase
          .from("profiles")
          .update({ main_location_id: locationId })
          .eq("id", user.id);

        toast.success('Location added successfully!');

        // Notifier le parent que la localisation a été ajoutée
        if (onLocationAdded) {
          onLocationAdded();
        }
      }
    } catch (error) {
      console.error("Error adding association:", error);
      toast.error('Failed to add location. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Affichage d'un indicateur de chargement
  if (loading) return <div>Loading available locations...</div>;

  return (
    <div className="onboarding-location-association">
      <div className="add-location">
        {/* Sélection du bloc */}
        <Select value={selectedBlock} onValueChange={setSelectedBlock} disabled={submitting}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue placeholder="Select a block" />
          </SelectTrigger>
          <SelectContent>
            {blocks.map((block) => (
              <SelectItem key={block} value={block} className="text-lg">
                Block {block}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sélection du lot (affiché uniquement si un bloc est sélectionné) */}
        {selectedBlock && (
          <div className="mt-4">
            <Select
              value={selectedLot}
              onValueChange={setSelectedLot}
              disabled={filteredLots.length === 0 || submitting}
            >
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    filteredLots.length === 0
                      ? "No available lots"
                      : "Select a lot"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredLots.map((lot) => (
                  <SelectItem key={lot.id} value={lot.id} className="text-lg">
                    Lot {lot.lot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Bouton d'ajout (affiché uniquement si un lot est sélectionné) */}
            {selectedLot && (
              <Button
                className="mt-4 w-full"
                onClick={() => addAssociation(selectedLot)}
                disabled={submitting}
              >
                {submitting ? "Processing..." : "Confirm this location"}
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
