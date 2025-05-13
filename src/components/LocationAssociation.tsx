import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { toast } from "react-toastify";
import { Button } from "@/components/ui/button";
import "./locationAssociation.css";

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

  // États pour la sélection de bloc/lot
  const [selectedBlock, setSelectedBlock] = useState("");
  const [selectedLot, setSelectedLot] = useState("");

  // Chargement initial
  useEffect(() => {
    if (user) {
      // Simplement marquer comme chargé puisque nous n'avons plus besoin de charger les locations
      setLoading(false);
    }
  }, [user]);

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
  const createAssociationRequest = async (
    locationId: string,
    approverId: string
  ) => {
    if (!user) return;

    try {
      // Uniquement créer la demande dans location_association_requests
      const { error } = await supabase
        .from("location_association_requests")
        .insert({
          requester_id: user.id,
          location_id: locationId,
          approver_id: approverId,
          status: "pending",
        });

      if (error) throw error;

      toast.info(
        "Demande envoyée au résident principal. Attente de validation."
      );
      if (onRequestSent) onRequestSent();
    } catch (error) {
      console.error("Erreur création demande:", error);
      toast.error("Échec de l'envoi de la demande.");
    }
  };

  /**
   * Ajoute une association entre l'utilisateur et une localisation
   */
  const addAssociation = async () => {
    if (!user || !selectedBlock || !selectedLot) return;
    setSubmitting(true);

    try {
      // Rechercher l'ID de la localisation correspondant au bloc et au lot saisis
      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("block", selectedBlock)
        .eq("lot", selectedLot)
        .single();

      if (locationError || !locationData) {
        toast.error(
          "This location does not exist. Please check your block and lot numbers."
        );
        setSubmitting(false);
        return;
      }

      const locationId = locationData.id;

      // Vérifier si la localisation a déjà un utilisateur vérifié
      const { hasVerifiedUser, primaryUserId } = await checkLocationAssociation(
        locationId
      );

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

        toast.success("Location added successfully!");

        // Notifier le parent que la localisation a été ajoutée
        if (onLocationAdded) {
          onLocationAdded();
        }
      }
    } catch (error) {
      console.error("Error adding association:", error);
      toast.error("Failed to add location. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Affichage d'un indicateur de chargement
  if (loading) return <div>Loading available locations...</div>;

  return (
    <div className="onboarding-location-association">
      <div className="add-location">
        {/* Saisie du bloc */}
        <div className="input-group">
          <label className="input-label">Block Number</label>
          <input
            type="text"
            value={selectedBlock}
            onChange={(e) => {
              setSelectedBlock(e.target.value);
              // Réinitialiser le lot quand le bloc change
              setSelectedLot("");
            }}
            placeholder="Enter your block number"
            className="onboarding-input"
            disabled={submitting}
          />
        </div>

        {/* Saisie du lot */}
        <div className="input-group">
          <label className="input-label">Lot Number</label>
          <input
            type="text"
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
            placeholder="Enter your lot number"
            className="onboarding-input"
            disabled={submitting}
          />
        </div>

        {/* Bouton d'ajout */}
        <div className="button-container">
          <Button
            className="w-full"
            onClick={() => addAssociation()}
            disabled={submitting || !selectedBlock || !selectedLot}
          >
            {submitting ? "Processing..." : "Confirm this location"}
          </Button>
        </div>
      </div>
    </div>
  );
};
