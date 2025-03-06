import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import "./userProfile.css";

export const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Profile not found");
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to fetch profile. Please try again.");
      }
    };

    fetchProfile();
  }, [user]);

  return (
    <div className="user-profile">
      <h2>My Profile</h2>
      {error && <div className="error-message">{error}</div>}
      {profile && (
        <div className="profile-info">
          {profile.profile_picture_url && (
            <img
              src={profile.profile_picture_url}
              alt="Profile"
              className="profile-picture"
            />
          )}
          <p>
            <strong>Name:</strong> {profile.display_name}
          </p>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          {profile.occupation && (
            <p>
              <strong>Occupation:</strong> {profile.occupation}
            </p>
          )}
          {profile.facebook && (
            <p>
              <strong>Facebook:</strong> {profile.facebook}
            </p>
          )}
          {profile.messenger && (
            <p>
              <strong>Messenger:</strong> {profile.messenger}
            </p>
          )}
          {profile.whatsapp && (
            <p>
              <strong>WhatsApp:</strong> {profile.whatsapp}
            </p>
          )}
          {profile.viber && (
            <p>
              <strong>Viber:</strong> {profile.viber}
            </p>
          )}
          {profile.business_type && (
            <p>
              <strong>Business Type:</strong> {profile.business_type}
            </p>
          )}
          {profile.business_location && (
            <p>
              <strong>Business Location:</strong> {profile.business_location}
            </p>
          )}
        </div>
      )}
      <Link to="/dashboard" className="dashboard-link">
        Go to Dashboard
      </Link>
    </div>
  );
};
