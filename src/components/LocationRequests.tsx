import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import { ImCheckboxChecked, ImCross } from "react-icons/im";
// import { useNotifications } from "../hooks/useNotifications";
import "./LocationRequests.css";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
// import { useWindowSize } from "@/hooks/useWindowSize";

interface LocationRequest {
  id: string;
  requester_id: string;
  location_id: string;
  status: string;
  created_at: string;
  profiles: {
    display_name: string;
    profile_picture_url: string | null;
  };
  locations: {
    block: string;
    lot: string;
  };
}

export default function LocationRequests({ session }: { session: Session }) {
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();

    // Souscription aux changements en temps réel
    const channel = supabase
      .channel("location-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "location_association_requests",
          filter: `approver_id=eq.${session.user.id}`,
        },
        () => fetchRequests()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRequests = async () => {
    const { data, error } = await supabase
      .from("location_association_requests")
      .select(
        `
        *,
        profiles:requester_id(display_name, profile_picture_url),
        locations(block, lot)
      `
      )
      .eq("approver_id", session.user.id)
      .eq("status", "pending");

    if (error) {
      toast.error("Error loading requests");
      return;
    }
    setRequests(data || []);
  };

  const handleRequest = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      setProcessingId(requestId);

      const { error: updateError } = await supabase
        .from("location_association_requests")
        .update({ status })
        .eq("id", requestId)
        .eq("approver_id", session.user.id);

      if (updateError) {
        console.error("Supabase Error:", updateError);
        throw updateError;
      }

      const { error: deleteError } = await supabase
        .from("notifications")
        .delete()
        .eq("related_id", requestId)
        .eq("type", "location_request");

      if (deleteError) {
        console.error("Supabase Error (delete notification):", deleteError);
        throw deleteError;
      }

      toast.success(
        `Request ${
          status === "approved" ? "approved" : "rejected"
        } successfully`
      );
      await fetchRequests();
    } catch (error) {
      console.error("Error details:", error);
      toast.error("An error occurred");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="location-requests">
      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id} className="request-item">
              <Avatar>
                <AvatarImage
                  src={request.profiles?.profile_picture_url || ""}
                />
                <AvatarFallback>
                  {request.profiles?.display_name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              <div>
                <strong>{request.profiles?.display_name}</strong>
                <p>
                  Block {request.locations?.block}, Lot {request.locations?.lot}
                </p>
              </div>

              <div className="actions">
                <button
                  onClick={() => handleRequest(request.id, "rejected")}
                  disabled={processingId === request.id}
                >
                  <ImCross />
                </button>
                <button
                  onClick={() => handleRequest(request.id, "approved")}
                  disabled={processingId === request.id}
                >
                  <ImCheckboxChecked />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
