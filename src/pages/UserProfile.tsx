import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import { Link } from "react-router-dom";
import "./userProfile.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import pinIcon from "../assets/img/pin.png";
import facebookLogo from "../assets/logos/facebook.png";
import messengerLogo from "../assets/logos/messenger.png";
import whatsappLogo from "../assets/logos/whatsapp.png";
import viberLogo from "../assets/logos/viber.png";
import { FaArrowAltCircleRight } from "react-icons/fa";

export const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [locationName, setLocationName] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        if (!profileData) throw new Error("Profile not found");
        setProfile(profileData);

        if (profileData.main_location_id) {
          const { data: locationData, error: locationError } = await supabase
            .from("locations")
            .select("block, lot")
            .eq("id", profileData.main_location_id)
            .single();

          if (locationError) throw locationError;
          setLocationName(
            locationData
              ? `Blk ${locationData.block} / Lot ${locationData.lot}`
              : "Unknown location"
          );
        }

        setError(null);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to fetch profile. Please try again.");
      }
    };

    fetchProfile();
  }, [user]);

  const renderSectionHeader = (title: string) => <h3>{title}</h3>;
  const renderSectionContact = (title: string) => <h3>{title}</h3>;

  return (
    <div className="user-profile">
      <h2>My Public Profile</h2>
      {error && <div className="error-message">{error}</div>}
      {profile && (
        <>
          <div className="info-section profile-info">
            {renderSectionHeader("About Me")}
            <div className="flex justify-between items-center gap-2">
              {profile.profile_picture_url && (
                <Avatar className="h-20 w-20 border-4 border-yellow-400">
                  <AvatarImage
                    src={profile.profile_picture_url}
                    alt="Profile"
                  />
                  <AvatarFallback className="bg-secondary font-bold">
                    {profile.display_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                style={{
                  display: "grid",
                  justifyContent: "end",
                  gap: ".6rem",
                  width: "100%",
                  height: "100%",
                }}
              >
                <strong className="flex-grow">{profile.display_name}</strong>
                {profile.main_location_id && (
                  <div className="location-display">
                    <span>{locationName || profile.main_location_id}</span>
                    <img
                      src={pinIcon}
                      alt="Location"
                      className="location-icon"
                      style={{
                        width: "10px",
                        height: "auto",
                        marginLeft: "8px",
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
            {profile.occupation && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "0.8rem",
                  marginTop: "1rem",
                  marginBottom: "10px",
                  paddingBottom: "0.5rem",
                  borderBottom: "2px solid var(--color-yellow)",
                }}
              >
                <strong style={{ fontSize: "1.4em" }}>💼</strong>{" "}
                <span>{profile.occupation}</span>
              </div>
            )}
            {profile.description && <p> {profile.description}</p>}
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

          {(profile.facebook ||
            profile.messenger ||
            profile.whatsapp ||
            profile.viber) && (
            <div className="info-section contact-info">
              {renderSectionContact("Contact Me")}
              <div className="contact-info-content">
                {/* Facebook */}
                {profile.facebook && (
                  <a
                    href={
                      profile.facebook.startsWith("http")
                        ? profile.facebook
                        : `https://${profile.facebook}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Facebook Profile"
                  >
                    <img src={facebookLogo} alt="Facebook" />
                  </a>
                )}

                {/* Messenger */}
                {profile.messenger && (
                  <a
                    href={profile.messenger}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Messenger Profile"
                  >
                    <img src={messengerLogo} alt="Messenger" />
                  </a>
                )}

                {/* Viber */}
                {profile.viber && (
                  <a
                    href={`viber://add?number=${profile.viber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Contact Viber"
                  >
                    <img src={viberLogo} alt="Viber" />
                  </a>
                )}
                
                {/* WhatsApp */}
                {profile.whatsapp && (
                  <a
                    href={`https://wa.me/${profile.whatsapp}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Contact WhatsApp"
                  >
                    <img src={whatsappLogo} alt="WhatsApp" />
                  </a>
                )}

              </div>
            </div>
          )}
        </>
      )}
      <Link to="/dashboard" className="dashboard-link">
        My Dashboard <FaArrowAltCircleRight />
      </Link>
    </div>
  );
};
