
import { useState, useEffect } from "react";
import Modal from "react-modal";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import "./onboardingModals.css";
import { ImageCropper } from "./ImageCropper";
import { useAuth } from "../hooks/useAuth";
import { useImageCrop } from "../hooks/useImageCrop";
import { useImageUpload } from "../hooks/useImageUpload";
import { LocationAssociation } from "./LocationAssociation";
import { toast } from "react-toastify";

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
  
  // Utiliser les hooks pour la gestion de l'image
  const { imageState, dispatchImage } = useImageCrop();
  const { handleFileChange, handleCloseCropper, uploadImage } = useImageUpload({
    onError: (error, message) => {
      console.error("Error uploading profile picture:", error);
      toast.error(message || "Failed to upload profile picture. Please try again.");
    },
    onSuccess: async (publicUrl) => {
      // Mettre à jour le profil
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ profile_picture_url: publicUrl })
        .eq("id", session?.user?.id);

      if (updateError) {
        toast.error("Failed to update profile with new picture");
        throw updateError;
      }

      toast.success("Profile picture uploaded successfully!");
      
      // Continuer avec le flux d'onboarding
      setShowProfilePictureModal(false);
      setShowLocationModal(true);
    },
    // Pas besoin de passer currentProfilePictureUrl pour l'onboarding car c'est la première photo
  });

  // Ajout d'un état pour suivre si une demande d'association a été envoyée
  const [hasRequestedLocation, setHasRequestedLocation] = useState(false);

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
  }, [session, role]);

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
      toast.error("Name and full name are required");
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

      toast.success("Profile information saved successfully!");
      setShowNameModal(false);
      setShowProfilePictureModal(true);
    } catch (error) {
      console.error("Error saving profile information:", error);
      toast.error("An error occurred while saving your name");
    }
  };

  /**
   * Gère la soumission du formulaire de photo de profil
   */
  const handleProfilePictureSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!imageState.src || !imageState.ref) {
      toast.error("Please select a profile picture");
      return;
    }

    // Utiliser un format de nom de fichier standard
    const fileName = `profile_${session?.user?.id}_${Date.now()}.jpg`;
    await uploadImage(imageState, dispatchImage, session?.user?.id || '', fileName);
  };

  /**
   * Gère la complétion de l'association de localisation
   * Cette fonction est appelée quand l'utilisateur a ajouté une localisation directement
   */
  const handleLocationComplete = () => {
    toast.success("Location added successfully! Redirecting to the app...");
    setShowLocationModal(false);
    // Rafraîchir la page pour accéder à l'application
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  /**
   * Gère l'envoi d'une demande d'association
   * Cette fonction est appelée quand l'utilisateur a envoyé une demande d'association
   */
  const handleRequestSent = () => {
    setHasRequestedLocation(true);
    toast.info("Your request has been sent to the primary resident. You'll be redirected to a waiting page.");
    // Ne pas fermer la modale, mais afficher un message d'attente
    // L'utilisateur sera redirigé vers PendingApprovalPage
    setTimeout(() => {
      window.location.reload();
    }, 3000); // Attendre 3 secondes pour que l'utilisateur puisse lire le message
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

      {/* Modale de saisie de la localisation avec LocationAssociation */}
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
          
          {hasRequestedLocation ? (
            <div className="text-center p-4 bg-blue-900/20 rounded-lg mb-4">
              <h3 className="text-xl font-semibold mb-2">Request Sent!</h3>
              <p>
                Your location association request has been sent to the primary resident.
                You will be redirected to a waiting page. You'll gain full access once
                your request is approved.
              </p>
            </div>
          ) : (
            <LocationAssociation 
              onLocationAdded={handleLocationComplete}
              onRequestSent={handleRequestSent}
            />
          )}
          
          <div className="flex justify-between mt-6">
            <button
              type="button"
              onClick={() => {
                setShowLocationModal(false);
                setShowProfilePictureModal(true);
              }}
              className="onboarding-button-secondary"
              disabled={hasRequestedLocation}
            >
              Back
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
