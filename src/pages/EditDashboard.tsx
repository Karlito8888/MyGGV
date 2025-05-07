import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { LocationAssociation } from "../components/LocationAssociation";
import { Profile } from "./UserDashboard";
import "./editDashboard.css";

interface EditDashboardProps {
  profile: Profile;
  onUpdate: (updatedFields: Partial<Profile>) => Promise<void>;
  onCancel: () => void;
}

export const EditDashboard = ({
  profile,
  onUpdate,
  onCancel,
}: EditDashboardProps) => {
  const { handleError } = useErrorHandler();
  const [uploading, setUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<File | null>(null);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const img = new Image();
      img.src = reader.result as string;

      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = 100;
      canvas.height = 100;

      let sourceWidth, sourceHeight, sourceX, sourceY;

      if (img.width > img.height) {
        sourceWidth = img.height;
        sourceHeight = img.height;
        sourceX = (img.width - img.height) / 2;
        sourceY = 0;
      } else {
        sourceWidth = img.width;
        sourceHeight = img.width;
        sourceX = 0;
        sourceY = (img.height - img.width) / 2;
      }

      if (ctx) {
        ctx.drawImage(
          img,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          0,
          0,
          100,
          100
        );
      }

      canvas.toBlob((blob) => {
        if (!blob) return;
        const resizedFile = new File([blob], `profile_${profile.id}.png`, {
          type: "image/png",
        });
        setCroppedImage(resizedFile);
        setImageSrc(canvas.toDataURL());
      }, "image/png");
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!croppedImage || !profile.id) return;

    setUploading(true);

    try {
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(`profile_${profile.id}`, croppedImage, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(data.path);

      await onUpdate({ profile_picture_url: publicUrl });
      setImageSrc(null);
    } catch (error) {
      handleError(error, "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      await onUpdate(formData);
    } catch (err) {
      handleError(err, "Failed to update profile");
    }
  };

  return (
    <div className="user-dashboard">
      <h2>Edit Profile</h2>

      <div className="edit-form">
        {/* Photo de profil */}
        <div className="info-section profile-picture-container">
          {profile.profile_picture_url && (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="profile-picture"
            />
          )}
          <div className="file-upload-container">
            <label htmlFor="fileInput" className="button button-primary">
              {uploading ? "Uploading..." : "Change Profile Picture"}
            </label>
            <input
              id="fileInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
        </div>

        {imageSrc && (
          <div className="info-section">
            <img
              src={imageSrc}
              alt="Profile preview"
              style={{ width: "100px", height: "100px" }}
            />
            <button
              className="button button-primary"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload Image"}
            </button>
          </div>
        )}

        {/* Informations personnelles */}
        <div className="info-section">
          <h3>Personal Information</h3>
          <div className="form-group">
            <label>Display Name</label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Occupation</label>
            <input
              type="text"
              name="occupation"
              value={formData.occupation || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Localisation */}
        <div className="info-section locations-section">
          <h3>My Location</h3>
          <LocationAssociation />
        </div>

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
            <label>Facebook</label>
            <input
              type="text"
              name="facebook"
              value={formData.facebook || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Messenger</label>
            <input
              type="text"
              name="messenger"
              value={formData.messenger || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>WhatsApp</label>
            <input
              type="text"
              name="whatsapp"
              value={formData.whatsapp || ""}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <label>Viber</label>
            <input
              type="text"
              name="viber"
              value={formData.viber || ""}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="account-actions">
          <button className="button button-primary" onClick={handleSubmit}>
            Save Changes
          </button>
          <button className="button button-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
