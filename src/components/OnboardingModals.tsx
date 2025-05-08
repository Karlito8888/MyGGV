import { useState, useEffect } from "react";
import Modal from "react-modal";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import "./onboardingModals.css";
import { ImageCropper } from "./ImageCropper";
import { useAuth } from "../hooks/useAuth";
import { useImageCrop } from "../hooks/useImageCrop";
import { useImageUpload } from "../hooks/useImageUpload";

// ===== CONFIGURATION =====
const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background: "#1a1a1a",
    borderRadius: "16px",
    padding: "2.5rem",
    maxWidth: "500px",
    width: "90%",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    backdropFilter: "blur(8px)",
    zIndex: 1000,
  },
};

// ===== TYPES =====
interface OnboardingModalsProps {
  session: Session | null;
}

/**
 * Composant qui gère les modales d'onboarding pour les nouveaux utilisateurs
 */
export default function OnboardingModals({ session }: OnboardingModalsProps) {
  // ===== STATE =====
  const { role } = useAuth();
  // Visibilité des modales
  const [showIntroModal, setShowIntroModal] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  // Données du formulaire
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [block, setBlock] = useState("");
  const [lot, setLot] = useState("");

  // Gestion des erreurs
  const [error, setError] = useState("");

  // Utiliser les hooks pour la gestion de l'image
  const { imageState, dispatchImage } = useImageCrop();
  const { handleFileChange, handleCloseCropper, uploadImage } = useImageUpload({
    onError: (error, message) => {
      console.error("Error uploading profile picture:", error);
      setError(message || "Failed to upload profile picture. Please try again.");
    },
    onSuccess: async (publicUrl) => {
      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", session?.user?.id);

      if (updateError) throw updateError;

      // Continuer avec le flux d'onboarding
      setShowProfilePictureModal(false);
      setShowLocationModal(true);
    },
    // Pas besoin de passer currentProfilePictureUrl pour l'onboarding car c'est la première photo
  });

  // ===== EFFECTS =====
  /**
   * Vérifie le profil de l'utilisateur et affiche les modales appropriées
   */
  useEffect(() => {
    const checkUserProfile = async () => {
      if (!session?.user) return;

      // Vérifier si l'utilisateur est un admin
      if (role === "admin") {
        return; // Ne pas afficher les modales pour les admins
      }

      // Vérifier si l'utilisateur a un nom d'affichage
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, profile_picture_url")
        .eq("id", session.user.id)
        .single();

      if (!profile?.display_name) {
        setShowIntroModal(true); // Afficher d'abord la modale d'introduction
      } else if (!profile?.profile_picture_url) {
        setShowProfilePictureModal(true);
      } else {
        // Vérifier si l'utilisateur a une localisation
        const { data: location } = await supabase
          .from("profile_location_associations")
          .select("*")
          .eq("profile_id", session.user.id)
          .single();

        if (!location) {
          setShowLocationModal(true);
        }
      }
    };

    checkUserProfile();
  }, [session]);

  /**
   * Gère le clic sur le bouton OK de la modale d'introduction
   */
  const handleIntroConfirm = () => {
    setShowIntroModal(false);
    setShowNameModal(true);
  };

  // ===== HANDLERS =====
  /**
   * Gère la soumission du formulaire de nom
   */
  const handleNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim() || !fullName.trim()) {
      setError("Name and full name are required");
      return;
    }

    try {
      const { error } = await supabase.from("profiles").upsert({
        id: session?.user?.id,
        display_name: displayName.trim(),
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      setShowNameModal(false);
      setShowProfilePictureModal(true);
    } catch (error) {
      setError("An error occurred while saving your name");
    }
  };

  /**
   * Gère la soumission du formulaire de photo de profil
   */
  const handleProfilePictureSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageState.src || !imageState.ref) {
      setError("Please select a profile picture");
      return;
    }

    // Utiliser un format de nom de fichier standard
    const fileName = `profile_${session?.user?.id}_${Date.now()}.jpg`;
    await uploadImage(imageState, dispatchImage, session?.user?.id || '', fileName);
  };

  /**
   * Gère la soumission du formulaire de localisation
   */
  const handleLocationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!block.trim() || !lot.trim()) {
      setError("Block and lot numbers are required");
      return;
    }

    try {
      // Rechercher la localisation existante
      const { data: locationData, error: locationError } = await supabase
        .from("locations")
        .select("id")
        .eq("block", block.trim())
        .eq("lot", lot.trim())
        .single();

      if (locationError) {
        if (locationError.code === "PGRST116") {
          setError(
            "This block and lot combination doesn't exist in our system"
          );
          return;
        }
        throw locationError;
      }

      // Vérifier si cette location a déjà un utilisateur primaire
      const { data: primaryUsers, error: primaryUserError } = await supabase
        .from("profile_location_associations")
        .select("profile_id")
        .eq("location_id", locationData.id)
        .eq("is_primary", true);

      if (primaryUserError) {
        throw primaryUserError;
      }

      // S'il y a au moins un utilisateur primaire
      if (primaryUsers && primaryUsers.length > 0) {
        const primaryUser = primaryUsers[0];

        // Il y a déjà un utilisateur primaire, créer une demande d'association
        const { error: requestError } = await supabase
          .from("location_association_requests")
          .insert([
            {
              requester_id: session?.user?.id,
              location_id: locationData.id,
              approver_id: primaryUser.profile_id,
              status: "pending",
            },
          ]);

        if (requestError) throw requestError;

        setShowLocationModal(false);
        // Afficher un message indiquant que la demande a été envoyée
        alert(
          "Your request has been sent to the primary resident of this location. You'll be notified when they approve your request."
        );
      } else {
        // Pas d'utilisateur primaire, créer l'association directement
        const { error: associationError } = await supabase
          .from("profile_location_associations")
          .insert([
            {
              profile_id: session?.user?.id,
              location_id: locationData.id,
              is_verified: true,
              is_primary: true,
            },
          ]);

        if (associationError) throw associationError;
        
        // Mettre à jour le profil avec main_location_id
        const { error: profileUpdateError } = await supabase
          .from("profiles")
          .update({ main_location_id: locationData.id })
          .eq("id", session?.user?.id);
        
        if (profileUpdateError) throw profileUpdateError;
        
        setShowLocationModal(false);
      }
    } catch (error) {
      setError("An error occurred while processing your location");
      console.error(error);
    }
  };

  // ===== RENDER =====
  return (
    <>
      {/* Modale d'introduction */}
      <Modal
        isOpen={showIntroModal}
        style={customStyles}
        contentLabel="Welcome to Garden Grove Village"
        ariaHideApp={false}
        shouldCloseOnEsc={false}
        shouldCloseOnOverlayClick={false}
      >
        <div className="onboarding-modal">
          <h2>
            Welcome to
            <br />
            Garden Grove Village
          </h2>{" "}
          <p className="text-gray-400 mb-4">
            For the safety and security of all residents, we need to collect
            some basic information about you.
          </p>
          <p className="text-gray-400 mb-6">
            This information will help us verify your residency and ensure that
            only authorized individuals have access to our community resources.
          </p>
          <div className="text-center">
            <button onClick={handleIntroConfirm} className="onboarding-button">
              I Understand
            </button>
          </div>
        </div>
      </Modal>

      {/* Modale de saisie du nom */}
      <Modal
        isOpen={showNameModal}
        style={customStyles}
        contentLabel="Enter your name"
        ariaHideApp={false}
        shouldCloseOnEsc={false}
        shouldCloseOnOverlayClick={false}
      >
        <div className="onboarding-modal">
          <h2>Welcome to GGV!</h2>
          <p className="text-gray-400 mb-4 text-sm">
            Let's start by getting to know you.
          </p>
          <form onSubmit={handleNameSubmit}>
            <div className="mb-4">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full name"
                className="onboarding-input"
                required
              />
            </div>
            <div className="mb-4">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we call you ?"
                className="onboarding-input"
                required
              />
            </div>
            {error && <div className="onboarding-error">{error}</div>}
            <button type="submit" className="onboarding-button">
              Continue
            </button>
          </form>
        </div>
      </Modal>

      {/* Modale de téléchargement de la photo de profil */}
      <Modal
        isOpen={showProfilePictureModal}
        style={customStyles}
        contentLabel="Upload profile picture"
        ariaHideApp={false}
        shouldCloseOnEsc={false}
        shouldCloseOnOverlayClick={false}
      >
        <div className="onboarding-modal">
          <h2>
            Upload a<br></br>Profile Picture
          </h2>
          <p className="text-gray-400 mb-4">... to personalize your profile.</p>
          <form onSubmit={handleProfilePictureSubmit}>
            <div className="mb-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, dispatchImage)}
                className="onboarding-input"
                required
              />
            </div>
            {imageState.src && (
              <div className="mb-4">
                <ImageCropper
                  imgSrc={imageState.src}
                  onCropComplete={(img, crop) => {
                    dispatchImage({ type: 'SET_REF', payload: img });
                    dispatchImage({ type: 'SET_CROP', payload: crop });
                  }}
                  aspect={1}
                  circularCrop={true}
                  minWidth={100}
                  minHeight={100}
                  onClose={() => handleCloseCropper(dispatchImage)}
                  onUpload={handleProfilePictureSubmit}
                  isUploading={imageState.uploading}
                />
              </div>
            )}
            {error && <div className="onboarding-error">{error}</div>}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowProfilePictureModal(false);
                  setShowNameModal(true);
                }}
                className="onboarding-button-secondary"
              >
                Back
              </button>
              <button 
                type="submit" 
                className="onboarding-button"
                disabled={imageState.uploading}
              >
                {imageState.uploading ? "Uploading..." : "Continue"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Modale de saisie de la localisation */}
      <Modal
        isOpen={showLocationModal}
        style={customStyles}
        contentLabel="Enter your location"
        ariaHideApp={false}
        shouldCloseOnEsc={false}
        shouldCloseOnOverlayClick={false}
      >
        <div className="onboarding-modal">
          <h2>Where do you live?</h2>
          <p className="text-gray-400 mb-4">
            Help us locate you in the community.
          </p>
          <form onSubmit={handleLocationSubmit}>
            <div className="input-group">
              <input
                type="text"
                value={block}
                onChange={(e) => setBlock(e.target.value)}
                placeholder="Enter your block number"
                className="onboarding-input"
                required
              />
            </div>
            <div className="input-group">
              <input
                type="text"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                placeholder="Enter your lot number"
                className="onboarding-input"
                required
              />
            </div>
            {error && <div className="onboarding-error">{error}</div>}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowLocationModal(false);
                  setShowProfilePictureModal(true);
                }}
                className="onboarding-button-secondary"
              >
                Back
              </button>
              <button type="submit" className="onboarding-button">
                Complete Setup
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
