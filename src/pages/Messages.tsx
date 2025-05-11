import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import LocationRequests from "../components/LocationRequests";
import { supabase } from "../lib/supabase";
import "./messages.css";
import DirectMessages from "@/components/DirectMessages";
import LiveChat from "@/components/LiveChat";
import NotificationBadge from "@/components/NotificationBadge";
import { useNotifications } from "@/hooks/useNotifications";

// Onglets disponibles
type TabType = "requests" | "direct" | "chat";

export default function Messages() {
  const [activeTab, setActiveTab] = useState<TabType>("requests");
  const [session, setSession] = useState<Session | null>(null);
  const { notifications } = useNotifications();

  // Compter les notifications par type
  const requestNotifications = notifications.filter(n => 
    n.type === 'location_request' && !n.is_read
  ).length;
  
  const directMessageNotifications = notifications.filter(n => 
    n.type === 'direct_message' && !n.is_read
  ).length;
  
  const chatNotifications = notifications.filter(n => 
    n.type === 'chat_message' && !n.is_read
  ).length;

  // Récupérer la session Supabase au chargement du composant
  useEffect(() => {
    const getSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
          return;
        }
        setSession(data.session);
      } catch (err) {
        console.error("Exception in getSession:", err);
      }
    };
    
    getSession();
  }, []);

  // Si la session est en cours de chargement, afficher un indicateur
  if (!session) {
    return <div className="loading-indicator">Loading messages...</div>;
  }

  return (
    <div className="messages-container">
      {/* Navigation entre les onglets */}
      <div className="messages-tabs">
        <button 
          className={`tab-button ${activeTab === "requests" ? "active" : ""}`}
          onClick={() => setActiveTab("requests")}
        >
          Location Requests
          {requestNotifications > 0 && (
            <NotificationBadge type="location_request" />
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === "direct" ? "active" : ""}`}
          onClick={() => setActiveTab("direct")}
        >
          Direct Messages
          {directMessageNotifications > 0 && (
            <NotificationBadge type="direct_message" />
          )}
        </button>
        <button 
          className={`tab-button ${activeTab === "chat" ? "active" : ""}`}
          onClick={() => setActiveTab("chat")}
        >
          Live Chat
          {chatNotifications > 0 && (
            <NotificationBadge type="chat_message" />
          )}
        </button>
      </div>
      
      {/* Contenu des onglets */}
      <div className="tab-content">
        {activeTab === "requests" && <LocationRequests session={session} />}
        {activeTab === "direct" && <DirectMessages session={session} />}
        {activeTab === "chat" && <LiveChat session={session} />}
      </div>
    </div>
  );
}
