import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { toast } from "react-toastify";
import ggvCoin from "../assets/img/ggv-coin.png";
import { EditDashboard } from "./EditDashboard";
import "./userDashboard.css";
// Importation des logos des réseaux sociaux
import facebookLogo from "../assets/logos/facebook.png";
import messengerLogo from "../assets/logos/messenger.png";
import whatsappLogo from "../assets/logos/whatsapp.png";
import viberLogo from "../assets/logos/viber.png";

// Types
export interface Profile {
  id: string;
  display_name: string;
  full_name: string;
  email: string;
  occupation: string;
  profile_picture_url: string | null;
  description: string;
  facebook: string;
  messenger: string;
  whatsapp: string;
  viber: string;
  coins: number;
  main_location_id: string | null;
  has_a_service: boolean;
  service_location: string | null;
  has_a_business_inside: boolean;
  business_inside_location: string | null;
  has_a_business_outside: boolean;
  business_outside_location: string | null;
  role: "user" | "admin" | "moderator";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  last_login_at: string | null;
  is_public_profile: boolean;
}

interface LocationAssociationType {
  location_id: string;
  location?: {
    block: string;
    lot: string;
  };
}

// Utility Functions
const deleteUserAccount = async (userId: string): Promise<boolean> => {
  try {
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;
    await supabase.auth.signOut();
    return true;
  } catch (err) {
    console.error("Error deleting user account:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to delete user account"
    );
  }
};

const renderH3 = (title: string, className?: string) => (
  <h3 className={className} style={{ margin: "0.5rem 0" }}>
    {title}
  </h3>
);

// Custom Hooks
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
      toast.error("Failed to fetch profile. Please try again.");
    }
  }, [userId]);

  const updateProfile = async (updatedFields: Partial<Profile>) => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .update(updatedFields)
        .eq("id", userId)
        .select("*")
        .single();

      if (error) throw error;
      if (!data) throw new Error("Profile not found");

      setProfile(data);
      setError(null);
      toast.success("Profile updated successfully");
      return data;
    } catch (err) {
      console.error("Error updating profile:", err);
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, error, updateProfile };
};

// Main Component
export const UserDashboard = () => {
  // Hooks
  const { user } = useAuth();
  const { profile, error: profileError, updateProfile } = useProfile(user?.id);
  
  // State
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [myAssociations, setMyAssociations] = useState<LocationAssociationType[]>([]);
  const [hasFetchedAssociations, setHasFetchedAssociations] = useState(false);

  // Handlers
  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      toast.info("Deleting account...");
      await deleteUserAccount(user.id);
      toast.success("Account deleted successfully. Redirecting...");
      window.location.href = "/";
    } catch (err) {
      console.error("Error deleting account:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  // Data fetching
  const fetchAssociations = useCallback(async () => {
    if (!user?.id || hasFetchedAssociations) return;

    try {
      const { data, error } = await supabase
        .from("profile_location_associations")
        .select(`*, location:locations(*)`)
        .eq("profile_id", user.id);

      if (error) throw error;
      setMyAssociations(data || []);
      setHasFetchedAssociations(true);
    } catch (err) {
      console.error("Error fetching associations:", err);
      toast.error("Failed to fetch locations");
    }
  }, [user?.id, hasFetchedAssociations]);

  // Effects
  useEffect(() => {
    fetchAssociations();
  }, [fetchAssociations]);

  useEffect(() => {
    setHasFetchedAssociations(false);
  }, [user?.id]);

  // Derived state
  const combinedError = useMemo(
    () => profileError,
    [profileError]
  );

  // UI helpers
  const renderProfileField = (label: string, value: string | undefined) => (
    <p>
      <strong>{label}:</strong> {value || "❓"}
    </p>
  );

  // Render
  return (
    <div className="user-dashboard">
      <h2>My Dashboard</h2>
      
      {/* Navigation and Edit buttons */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-evenly",
          alignItems: "center",
          gap: "1rem",
          // margin: "1rem 0",
        }}
      >
        <Link to="/profile" className="profile-link">
          <FaArrowAltCircleLeft className="profile-link-icon" />
        </Link>
        <button
          className="button button-primary"
          onClick={() => {
            setIsEditing(!isEditing);
            if (!isEditing) {
              toast.info("Edit mode activated");
            }
          }}
        >
          <FaPencil className="button-icon" />
        </button>
      </div>

      {/* Error display */}
      {combinedError && <div className="error-message">{combinedError}</div>}

      {/* Main content - Edit mode or View mode */}
      {isEditing ? (
        <EditDashboard
          profile={profile!}
          onUpdate={updateProfile}
          onCancel={() => {
            setIsEditing(false);
            toast.info("Edit mode cancelled");
          }}
        />
      ) : (
        <div className="profile-info">
          {profile ? (
            <>
              {/* About Me Section */}
              <div className="info-section about-me-section">
                {renderH3("About Me")}
                <div className="profile-picture-container">
                  {profile.profile_picture_url && (
                    <img
                      src={profile.profile_picture_url}
                      alt="Profile"
                      className="profile-picture"
                    />
                  )}
                  <div
                    className="coins-container"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".5rem",
                    }}
                  >
                    <img
                      src={ggvCoin}
                      alt="GGV Coin"
                      style={{
                        width: "50px",
                        height: "50px",
                        verticalAlign: "middle",
                      }}
                    />
                    <span style={{ color: "#3e8a4f" }}>X</span>
                    <strong style={{ color: "#f4f4f4" }}>{profile.coins}</strong>
                  </div>
                </div>
                {renderProfileField("Name", profile.display_name || profile.full_name)}
                {renderProfileField("Description", profile.description)}
                {renderProfileField("Occupation", profile.occupation)}
              </div>
              
              {/* Locations Section */}
              <div className="info-section locations-section">
                {renderH3("My Location")}
                <div className="location-list">
                  {myAssociations?.length > 0 ? (
                    myAssociations.map((assoc) => (
                      <div key={assoc.location_id} className="location-item">
                        <span>
                          Block {assoc.location?.block} - Lot {assoc.location?.lot}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>No associated locations</p>
                  )}
                </div>
              </div>
              
              {/* Services Section */}
              <div className="info-section services-section">
                {renderH3("Services & Business")}
                <p>
                  <strong>Service Provider:</strong>{" "}
                  {profile.has_a_service ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Business Inside GGV:</strong>{" "}
                  {profile.has_a_business_inside ? "Yes" : "No"}
                </p>
                <p>
                  <strong>Business Outside GGV:</strong>{" "}
                  {profile.has_a_business_outside ? "Yes" : "No"}
                </p>
              </div>
              
              {/* Contacts Section */}
              <div className="info-section contacts-section">
                {renderH3("Contacts")}
                {(profile.facebook || profile.messenger || profile.whatsapp || profile.viber) ? (
                  <div className="contact-icons">
                    {profile.facebook && (
                      <div className="contact-icon" title="Facebook">
                        <img src={facebookLogo} alt="Facebook" />
                      </div>
                    )}
                    {profile.messenger && (
                      <div className="contact-icon" title="Messenger">
                        <img src={messengerLogo} alt="Messenger" />
                      </div>
                    )}
                    {profile.viber && (
                      <div className="contact-icon" title="Viber">
                        <img src={viberLogo} alt="Viber" />
                      </div>
                    )}
                    {profile.whatsapp && (
                      <div className="contact-icon" title="WhatsApp">
                        <img src={whatsappLogo} alt="WhatsApp" />
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No contact information provided</p>
                )}
              </div>
            </>
          ) : (
            <div>Loading profile...</div>
          )}
        </div>
      )}

      {/* Account Actions */}
      <div className="account-actions">
        <button
          className="button button-danger"
          onClick={() => {
            setShowDeleteConfirmation(true);
            toast.warning("You are about to delete your account");
          }}
        >
          <MdDelete className="button-icon" />
          Delete My Account
        </button>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="confirmation-modal">
          <div className="modal-content">
            <h3>Confirm Account Deletion</h3>
            <p>
              Are you sure you want to delete your account? This action cannot
              be undone.
            </p>
            <div className="modal-actions">
              <button
                className="button button-secondary"
                onClick={() => {
                  setShowDeleteConfirmation(false);
                  toast.info("Account deletion cancelled");
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
