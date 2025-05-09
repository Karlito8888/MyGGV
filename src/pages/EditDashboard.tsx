import { useState, useEffect } from "react";
import { toast } from "react-toastify";
// import { LocationAssociation } from "../components/LocationAssociation";
import { Profile } from "./UserDashboard";
import "./editDashboard.css";
import { ImageCropper } from "../components/ImageCropper";
import { MdAddAPhoto, MdWarning } from "react-icons/md";
import { IoInformationCircleOutline } from "react-icons/io5";
import { useImageCrop } from "../hooks/useImageCrop";
import { useImageUpload } from "../hooks/useImageUpload";

// ===== TYPES =====
interface EditDashboardProps {
  profile: Profile;
  onUpdate: (updatedFields: Partial<Profile>) => Promise<void>;
  onCancel: () => void;
}

// ===== MAIN COMPONENT =====
export const EditDashboard = ({
  profile,
  onUpdate,
  onCancel,
}: EditDashboardProps) => {
  // Hooks
  const { imageState, dispatchImage } = useImageCrop();
  const { handleFileChange, handleCloseCropper, uploadImage } = useImageUpload({
    onError: (error, message) => {
      console.error("Error uploading profile picture:", error);
      toast.error(message || "Failed to upload profile picture");
    },
    onSuccess: async (publicUrl) => {
      try {
        await onUpdate({ profile_picture_url: publicUrl });
        toast.success("Profile picture updated successfully");
      } catch (error) {
        console.error("Error updating profile with new picture:", error);
        toast.error("Failed to update profile with new picture");
      }
    },
    currentProfilePictureUrl: profile.profile_picture_url
  });
  
  const [formData, setFormData] = useState<Partial<Profile>>({
    display_name: profile.display_name,
    description: profile.description,
    occupation: profile.occupation,
    facebook: profile.facebook,
    messenger: profile.messenger,
    whatsapp: profile.whatsapp,
    viber: profile.viber,
    has_a_service: profile.has_a_service,
    has_a_business_inside: profile.has_a_business_inside,
    has_a_business_outside: profile.has_a_business_outside,
  });
  
  // État pour la modale d'avertissement Facebook
  const [showFacebookWarning, setShowFacebookWarning] = useState(false);
  // État pour la modale d'aide Facebook
  const [showFacebookHelp, setShowFacebookHelp] = useState(false);

  // Fonction pour extraire le nom d'utilisateur Facebook et générer le lien Messenger
  const extractFacebookUsername = (facebookUrl: string): string | null => {
    try {
      // Normaliser l'URL
      let normalizedUrl = facebookUrl;
      if (!normalizedUrl.startsWith('http')) {
        normalizedUrl = `https://${normalizedUrl}`;
      }
      
      const url = new URL(normalizedUrl);
      
      // Vérifier si c'est bien une URL Facebook
      if (!url.hostname.includes('facebook.com')) {
        return null;
      }
      
      // Extraire le chemin sans les paramètres
      const path = url.pathname.split('?')[0];
      
      // Supprimer les slashes au début et à la fin
      const cleanPath = path.replace(/^\/|\/$/g, '');
      
      // Ignorer certains chemins spéciaux
      if (['profile.php', 'people', 'pages'].includes(cleanPath.split('/')[0])) {
        // Pour les URLs comme facebook.com/profile.php?id=123
        // Nous ne pouvons pas générer un lien Messenger direct
        return null;
      }
      
      // Retourner le nom d'utilisateur (tout ce qui vient après facebook.com/)
      return cleanPath || null;
    } catch (error) {
      console.error('Error extracting Facebook username:', error);
      toast.error('Invalid Facebook URL format');
      return null;
    }
  };

  // Mettre à jour le lien Messenger lorsque le lien Facebook change
  useEffect(() => {
    if (formData.facebook) {
      const username = extractFacebookUsername(formData.facebook);
      if (username) {
        // Générer le lien Messenger
        const messengerUrl = `https://m.me/${username}`;
        setFormData(prev => ({
          ...prev,
          messenger: messengerUrl
        }));
        toast.info("Messenger link auto-generated", { autoClose: 2000 });
      }
    }
  }, [formData.facebook]);

  // Event handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    // Vérification spéciale pour Facebook
    if (name === "facebook" && value.includes("/share")) {
      setShowFacebookWarning(true);
      return; // Ne pas mettre à jour le champ pour l'instant
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async () => {
    try {
      // Vérifier une dernière fois le lien Facebook avant de soumettre
      if (formData.facebook && formData.facebook.includes("/share")) {
        setShowFacebookWarning(true);
        return;
      }
      
      toast.info("Updating profile...");
      await onUpdate(formData);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  // Fonction pour fermer la modale et corriger le lien
  const handleFixFacebookLink = () => {
    setShowFacebookWarning(false);
    // Vous pouvez soit effacer le champ, soit suggérer un format correct
    setFormData(prev => ({
      ...prev,
      facebook: ""
    }));
    toast.info("Please enter your personal Facebook profile URL");
  };

  // Render
  return (
    <div className="edit-dashboard">
      <h2>Edit Your Profile</h2>

      <div className="edit-form">
        {/* Profile Picture Section */}
        <div className="info-section">
          <h3>
            {profile.profile_picture_url ? "Profile Picture" : "Add Profile Picture"}
          </h3>
          <div className="profile-picture-container">
            {profile.profile_picture_url && (
              <img
                src={profile.profile_picture_url}
                alt="Profile"
                className="profile-picture"
              />
            )}
            <label htmlFor="fileInput" className="button button-primary">
              <MdAddAPhoto size={24}/>
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e, dispatchImage);
                  toast.info("Preparing image for cropping...");
                }
              }}
              disabled={imageState.uploading}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* Image Cropper Modal */}
        {imageState.showCropper && imageState.src && (
          <ImageCropper
            imgSrc={imageState.src}
            onCropComplete={(img, crop) => {
              dispatchImage({ type: "SET_REF", payload: img });
              dispatchImage({ type: "SET_CROP", payload: crop });
            }}
            onClose={() => {
              handleCloseCropper(dispatchImage);
              toast.info("Image cropping cancelled");
            }}
            onUpload={() => {
              toast.info("Uploading profile picture...");
              uploadImage(imageState, dispatchImage, profile.id);
            }}
            isUploading={imageState.uploading}
            aspect={1}
            circularCrop={true}
            minWidth={100}
            minHeight={100}
          />
        )}

        {/* Personal Information */}
        <div className="info-section">
          <h3>Personal Information</h3>
          <div className="form-group">
            <label>Display Name :</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Description :</label>
            <input
              type="text"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Occupation :</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Location */}
        {/* <div className="info-section locations-section">
          <h3>My Location</h3>
          <LocationAssociation />
        </div> */}

        {/* Services & Business */}
        <div className="info-section">
          <h3>Services & Business</h3>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="has_a_service"
              name="has_a_service"
              checked={formData.has_a_service || false}
              onChange={handleChange}
            />
            <label htmlFor="has_a_service">I provide a service</label>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="has_a_business_inside"
              name="has_a_business_inside"
              checked={formData.has_a_business_inside || false}
              onChange={handleChange}
            />
            <label htmlFor="has_a_business_inside">
              I have a business inside GGV
            </label>
          </div>
          <div className="form-group checkbox-group">
            <input
              type="checkbox"
              id="has_a_business_outside"
              name="has_a_business_outside"
              checked={formData.has_a_business_outside || false}
              onChange={handleChange}
            />
            <label htmlFor="has_a_business_outside">
              I have a business outside GGV
            </label>
          </div>
        </div>

        {/* Contacts */}
        <div className="info-section">
          <h3>Contacts</h3>
          <div className="form-group">
            <div className="label-with-info">
              <label>Facebook:</label>
              <IoInformationCircleOutline 
                size={20} 
                color="#4267B2" 
                onClick={() => setShowFacebookHelp(true)}
                className="info-icon"
                title="How to find your Facebook profile link"
              />
            </div>
            <input
              type="text"
              name="facebook"
              value={formData.facebook || ""}
              onChange={handleChange}
              placeholder="https://www.facebook.com/username"
            />
            {formData.facebook && !formData.facebook.includes("/share") && !formData.facebook.startsWith("http") && (
              <small className="form-hint">Tip: add "https://" at the beginning of your link</small>
            )}
          </div>
          
          {/* Messenger field - auto-generated and disabled */}
          {formData.messenger && (
            <div className="form-group">
              <label>Messenger (auto-generated):</label>
              <input
                type="text"
                name="messenger"
                value={formData.messenger}
                disabled
                className="input-disabled"
              />
              <small className="form-hint">This Messenger link is automatically generated from your Facebook profile</small>
            </div>
          )}

          {/* Facebook Warning Modal */}
          {showFacebookWarning && (
            <div className="modal-overlay">
              <div className="warning-modal">
                <div className="warning-header">
                  <MdWarning size={24} color="#f44336" />
                  <h3>Invalid Facebook Link</h3>
                </div>
                <p>
                  The Facebook link you entered contains "/share", which indicates it's a temporary sharing link and not your personal profile.
                </p>
                <p>
                  Please provide the URL of your personal Facebook profile, which typically looks like:
                  <br />
                  <code>https://www.facebook.com/your.username</code>
                </p>
                <div className="modal-actions">
                  <button 
                    className="button button-primary" 
                    onClick={handleFixFacebookLink}
                  >
                    Fix my link
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Facebook Help Modal */}
          {showFacebookHelp && (
            <div className="modal-overlay">
              <div className="help-modal">
                <div className="help-header">
                  {/* <IoInformationCircleOutline size={24} color="#4267B2" /> */}
                  <h3>How to Find Your Facebook Profile Link ?</h3>
                </div>
                <div className="help-content">
                  <ol>
                    <li>Open the Facebook app,</li>
                    <li>Go to your profile page,</li>
                    <li>Tap on the "..." button,</li>
                    <li>Select "Copy profile link",</li>
                    <li>... and paste it here! 👍</li>
                  </ol>
                  {/* <div className="help-note">
                    <p>Note: Make sure you're sharing your profile link, not a post or photo link.</p>
                  </div> */}
                </div>
                <div className="modal-actions">
                  <button 
                    className="button button-primary" 
                    onClick={() => {
                      setShowFacebookHelp(false);
                      toast.info("Remember to use your personal profile URL, not a sharing link");
                    }}
                  >
                    Got it!
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Viber :</label>
            <input
              type="text"
              name="viber"
              value={formData.viber || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>WhatsApp :</label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="account-actions">
          <button 
            className="button button-primary" 
            onClick={async () => {
              try {
                await handleSubmit();
                toast.success("Profile saved successfully!");
                onCancel(); // Utilise la fonction onCancel pour rediriger vers UserDashboard
              } catch (err) {
                // L'erreur est déjà gérée dans handleSubmit
              }
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};
