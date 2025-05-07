import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { FaArrowAltCircleLeft } from "react-icons/fa";
import { FaPencil } from "react-icons/fa6";
import { Link } from "react-router-dom";
import "./userDashboard.css";
import { useErrorHandler } from "../hooks/useErrorHandler";
import { deleteUserAccount } from "../lib/auth/userAuthServices";
import ggvCoin from "../assets/img/ggv-coin.png";
import { MdDelete } from "react-icons/md";
// import { LocationAssociation } from "../components/LocationAssociation";
import { EditDashboard } from "./EditDashboard";

export interface Profile {
  id: string;
  display_name: string;
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
  const [myAssociations, setMyAssociations] = useState<
    LocationAssociationType[]
  >([]);
  const [hasFetchedAssociations, setHasFetchedAssociations] = useState(false);

  const handleDeleteAccount = async () => {
    if (!user?.id) return;

    try {
      await deleteProfile();
      window.location.href = "/";
    } catch (err) {
      handleError(err, "Failed to delete account");
    }
  };

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
      handleError(err, "Failed to fetch locations");
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAssociations();
  }, [fetchAssociations]);

  useEffect(() => {
    setHasFetchedAssociations(false);
  }, [user?.id]);

  const combinedError = useMemo(
    () => profileError || error,
    [profileError, error]
  );

  const renderProfileField = (label: string, value: string | undefined) => (
    <p>
      <strong>{label}:</strong> {value || "❓"}
    </p>
  );

  const renderSectionHeader = (title: string) => <h3>{title}</h3>;

  return (
    <div className="user-dashboard">
      <h2>My Dashboard</h2>
      <div
        style={{
          display: "grid",
          justifyContent: "center",
          justifyItems: "center",
          gap: "1rem",
          margin: "1rem 0",
        }}
      >
        <Link to="/profile" className="profile-link">
          <FaArrowAltCircleLeft className="profile-link-icon" />
        </Link>
        <button
          className="button button-primary"
          onClick={() => setIsEditing(!isEditing)}
        >
          <FaPencil className="button-icon" />
        </button>
      </div>

      {combinedError && <div className="error-message">{combinedError}</div>}

      {isEditing ? (
        <EditDashboard
          profile={profile!}
          onUpdate={updateProfile}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <div className="profile-info">
          {profile ? (
            <>
              <div className="info-section about-me-section">
                {renderSectionHeader("About Me")}
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
                    <strong style={{ color: "#f4f4f4" }}>
                      {" "}
                      {profile.coins}
                    </strong>
                  </div>
                </div>
                {renderProfileField("Name", profile.display_name)}
                {renderProfileField("Description", profile.description)}
                {renderProfileField("Occupation", profile.occupation)}
              </div>
              <div className="info-section locations-section">
                {renderSectionHeader("My Location")}
                <div className="location-list">
                  {myAssociations?.length > 0 ? (
                    myAssociations.map((assoc) => (
                      <div key={assoc.location_id} className="location-item">
                        <span>
                          Block {assoc.location?.block} - Lot{" "}
                          {assoc.location?.lot}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p>No associated locations</p>
                  )}
                </div>
              </div>
              <div className="info-section services-section">
                <h3>Services & Business</h3>
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
              <div className="info-section contacts-section">
                <h3>Contacts</h3>
                {renderProfileField("Facebook", profile.facebook)}
                {renderProfileField("Messenger", profile.messenger)}
                {renderProfileField("WhatsApp", profile.whatsapp)}
                {renderProfileField("Viber", profile.viber)}
              </div>
            </>
          ) : (
            <div>Loading profile...</div>
          )}
        </div>
      )}

      <div className="account-actions">
        <button
          className="button button-danger"
          onClick={() => setShowDeleteConfirmation(true)}
        >
          <MdDelete className="button-icon" />
          Delete My Account
        </button>
      </div>

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
