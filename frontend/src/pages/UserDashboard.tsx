import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { MdOutlineCloudUpload } from "react-icons/md";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { TiDelete } from "react-icons/ti";
import { Link } from "react-router-dom";
import "./userDashboard.css";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { deleteUserAccount } from "../lib/auth/userAuthServices";

interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputType?: "image/jpeg" | "image/png" | "image/webp";
}

interface Profile {
  id: string;
  display_name: string;
  facebook: string;
  messenger: string;
  whatsapp: string;
  viber: string;
  business_type: string;
  business_location: string;
  profile_picture_url: string | null;
  occupation: string;
}

const useProfile = (userId: string | undefined) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      if (!data) throw new Error("Profile not found");
      setProfile(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError("Failed to fetch profile. Please try again.");
    }
  }, [userId]);

  const updateProfile = async (updatedProfile: Partial<Profile>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updatedProfile)
        .eq("id", userId)
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("Profile not found");

      setProfile(data);
      setError(null);
      return data;
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err instanceof Error ? err.message : "Failed to update profile");
      throw err;
    }
  };

  const deleteProfile = async () => {
    if (!userId) return;

    try {
      await deleteUserAccount(userId);
      return true;
    } catch (err) {
      console.error("Error deleting profile:", err);
      setError(err instanceof Error ? err.message : "Failed to delete profile");
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, error, updateProfile, deleteProfile };
};

const ProfileFormFields = ({
  profile,
  onChange,
}: {
  profile: Profile;
  onChange: (updatedFields: Partial<Profile>) => void;
}) => {
  const fields = [
    { key: "display_name", label: "Display Name", required: true },
    { key: "occupation", label: "Occupation", required: false },
    { key: "facebook", label: "Facebook link", required: false },
    { key: "messenger", label: "Messenger link", required: false },
    { key: "whatsapp", label: "WhatsApp number", required: false },
    { key: "viber", label: "Viber number", required: false },
    { key: "business_location", label: "Business location", required: false },
  ];

  return (
    <>
      {fields.map(({ key, label, required }) => (
        <div key={key}>
          <input
            value={profile[key as keyof Profile] || ""}
            onChange={(e) => onChange({ [key]: e.target.value })}
            placeholder={label}
          />
          {!required && <p className="field-description">Optional</p>}
        </div>
      ))}
      <select
        value={profile.business_type || "other"}
        onChange={(e) => onChange({ business_type: e.target.value })}
      >
        <option value="sari-sari">Sari-sari</option>
        <option value="food">Food</option>
        <option value="cleaning">Cleaning</option>
        <option value="childcare">Childcare</option>
        <option value="household_appliance_repair">
          Household Appliance Repair
        </option>
        <option value="homestay">Homestay</option>
        <option value="bed_and_breakfast">Bed & Breakfast</option>
        <option value="grocery_store">Grocery Store</option>
        <option value="restaurant">Restaurant</option>
        <option value="coffee_shop">Coffee Shop</option>
        <option value="barber_shop">Barber Shop</option>
        <option value="beauty_salon">Beauty Salon</option>
        <option value="store">Store</option>
        <option value="craftsmanship">Craftsmanship</option>
        <option value="doctor">Doctor</option>
        <option value="bakery">Bakery</option>
        <option value="other">Other</option>
      </select>
    </>
  );
};

export const UserDashboard = () => {
  const { user } = useAuth();
  const {
    profile,
    error: profileError,
    updateProfile,
    deleteProfile,
  } = useProfile(user?.id);
  const { error, handleError } = useErrorHandler();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const compressAndResizeImage = async (
    file: File,
    options: ImageCompressionOptions = {}
  ): Promise<File> => {
    const {
      maxWidth = 300,
      quality = 0.8,
      outputType = "image/webp",
    } = options;

    return new Promise((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        return reject(new Error("File is not an image"));
      }

      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return reject(new Error("Could not create canvas context"));
      }

      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = Math.floor(height * ratio);
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                return reject(new Error("Image compression failed"));
              }
              const compressedFile = new File([blob], file.name, {
                type: outputType,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            outputType,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = (error) => reject(error);
      img.src = URL.createObjectURL(file);
    });
  };

  const handleProfilePictureUpload = async (file: File) => {
    if (!user) return;

    try {
      // Validate file
      if (!file || !file.type.startsWith("image/")) {
        throw new Error("Please upload a valid image file");
      }

      // Compress and resize image
      const compressedFile = await compressAndResizeImage(file, {
        maxWidth: 300,
        quality: 0.8,
        outputType: "image/webp",
      });

      // Generate file name and path
      const fileExt = compressedFile.type.split("/")[1];
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload compressed image
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, compressedFile, {
          cacheControl: "3600",
          upsert: true,
          contentType: compressedFile.type,
        });

      if (uploadError) throw uploadError;

      // Get public URL using Supabase's built-in method
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(filePath);

      await updateProfile({ profile_picture_url: publicUrl });
    } catch (err) {
      console.error("Error uploading profile picture:", err);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!user || !profile?.profile_picture_url) return;

    try {
      // Extraire le chemin du fichier à partir de l'URL
      const filePath = profile.profile_picture_url.split("/public/")[1];

      // Supprimer le fichier du stockage
      const { error: deleteError } = await supabase.storage
        .from("profile-pictures")
        .remove([filePath]);

      if (deleteError) throw deleteError;

      // Mettre à jour le profil pour supprimer l'URL de la photo
      await updateProfile({ profile_picture_url: null });
    } catch (err) {
      console.error("Error deleting profile picture:", err);
    }
  };

  const handleProfileUpdate = async (updatedFields: Partial<Profile>) => {
    if (!profile) return;

    try {
      await updateProfile({
        ...profile,
        ...updatedFields,
      });
    } catch (err) {
      handleError(err, "Failed to update profile");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      await deleteProfile();
      // Rediriger vers la page d'accueil
      window.location.href = "/";
    } catch (err) {
      handleError(err, "Failed to delete account");
    }
  };

  const combinedError = profileError || error;

  return (
    <div className="user-dashboard">
      <h2>My DashBoard</h2>
      <Link to="/profile" className="profile-link">
        <FaArrowAltCircleLeft className="profile-link-icon" />
        <span>My Profile</span>
      </Link>
      {combinedError && <div className="error-message">{combinedError}</div>}
      {profile && (
        <div className="profile-section">
          {profile.profile_picture_url && (
            <div className="profile-picture-container">
              <img
                src={profile.profile_picture_url}
                alt="Profile"
                className="profile-picture"
              />
              <div className="file-upload-container">
                <label
                  htmlFor="profile-picture-upload"
                  className="file-upload-label"
                >
                  <MdOutlineCloudUpload className="upload-icon" />
                  <span>Upload Profile Picture</span>
                  <input
                    id="profile-picture-upload"
                    type="file"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleProfilePictureUpload(e.target.files[0]);
                      }
                    }}
                    accept="image/*"
                    className="file-input"
                  />
                </label>
              </div>
              <button
                className="button button-danger"
                onClick={handleDeleteProfilePicture}
                title="Delete profile picture"
              >
                <TiDelete className="delete-icon" />
                <span>Delete Profile Picture</span>
              </button>
            </div>
          )}
          {isEditing ? (
            <div className="edit-form">
              <ProfileFormFields
                profile={profile}
                onChange={handleProfileUpdate}
              />
              <div className="button-group">
                <button
                  className="button button-secondary"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button
                  className="button button-primary"
                  onClick={() => handleProfileUpdate(profile)}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="profile-info">
              <p>
                <strong>Name:</strong> {profile.display_name}
              </p>
              <p>
                <strong>Facebook:</strong> {profile.facebook}
              </p>
              <p>
                <strong>Messenger:</strong> {profile.messenger}
              </p>
              <p>
                <strong>WhatsApp:</strong> {profile.whatsapp}
              </p>
              <p>
                <strong>Viber:</strong> {profile.viber}
              </p>
              <p>
                <strong>Occupation:</strong>{" "}
                {profile.occupation || "Not provided"}
              </p>
              <p>
                <strong>Business type:</strong> {profile.business_type}
              </p>
              <p>
                <strong>Business location:</strong> {profile.business_location}
              </p>
              <button
                className="button button-primary"
                onClick={() => setIsEditing(true)}
              >
                Edit
              </button>
            </div>
          )}
          <div className="account-actions">
            <button
              className="button button-danger"
              onClick={() => setShowDeleteConfirmation(true)}
            >
              Delete My Account
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Account Deletion</h3>
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            {error && <div className="error-message">{error}</div>}
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  handleError(null, "");
                }}
              >
                Cancel
              </button>
              <button
                className="button button-danger"
                onClick={handleDeleteAccount}
              >
                Yes, Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
