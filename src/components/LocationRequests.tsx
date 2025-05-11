import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { toast } from "react-toastify";
import { ImCheckboxChecked, ImCross } from "react-icons/im";
import { useNotifications } from "../hooks/useNotifications";

interface LocationRequest {
  id: string;
  requester_id: string;
  location_id: string;
  status: string;
  created_at: string;
  requester_name: string;
  location_block: string;
  location_lot: string;
}

export default function LocationRequests({ session }: { session: Session }) {
  const [requests, setRequests] = useState<LocationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const { markAsRead, notifications } = useNotifications();

  useEffect(() => {
    fetchRequests();
    
    // Subscribe to real-time changes for location requests
    const subscription = supabase
      .channel('public:location_association_requests')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'location_association_requests',
          filter: `approver_id=eq.${session.user.id}`
        }, 
        () => {
          toast.info('You have a new location association request');
          fetchRequests();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  // Marquer les notifications liées aux demandes de localisation comme lues
  useEffect(() => {
    const locationRequestNotifications = notifications.filter(
      n => n.type === 'location_request' && !n.is_read
    );
    
    locationRequestNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  }, [notifications, markAsRead]);

  async function fetchRequests() {
    try {
      setLoading(true);

      // Utiliser la session passée en prop
      const userId = session.user.id;

      const { data, error } = await supabase
        .from("location_association_requests")
        .select(
          `
          id, requester_id, location_id, status, created_at,
          profiles:requester_id(display_name, full_name),
          locations:location_id(block, lot)
        `
        )
        .eq("approver_id", userId)
        .eq("status", "pending");

      if (error) {
        toast.error("Failed to load location requests");
        throw error;
      }

      if (data) {
        const formattedRequests = data.map((item: any) => ({
          id: item.id,
          requester_id: item.requester_id,
          location_id: item.location_id,
          status: item.status,
          created_at: item.created_at,
          requester_name:
            item.profiles?.display_name ||
            item.profiles?.full_name ||
            "Unknown",
          location_block: item.locations?.block || "",
          location_lot: item.locations?.lot || "",
        }));

        setRequests(formattedRequests);
        
        if (formattedRequests.length > 0 && loading) {
          toast.info(`You have ${formattedRequests.length} pending location request${formattedRequests.length > 1 ? 's' : ''}`);
        }
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(
    requestId: string,
    requesterId: string,
    locationId: string
  ) {
    try {
      toast.info("Processing approval...");
      
      // Mettre à jour le statut de la demande - cela déclenchera le trigger de notification
      const { error: updateError } = await supabase
        .from("location_association_requests")
        .update({ status: "approved" })
        .eq("id", requestId);

      if (updateError) {
        toast.error("Failed to approve request");
        throw updateError;
      }

      // Créer l'association
      const { error: associationError } = await supabase
        .from("profile_location_associations")
        .insert([
          {
            profile_id: requesterId,
            location_id: locationId,
            is_verified: true,
            is_primary: false,
          },
        ]);

      if (associationError) {
        toast.error("Failed to create location association");
        throw associationError;
      }

      toast.success("Request approved successfully");
      
      // Rafraîchir la liste
      fetchRequests();
    } catch (error) {
      console.error("Error approving request:", error);
    }
  }

  async function handleReject(requestId: string) {
    try {
      toast.info("Processing rejection...");
      
      // Mettre à jour le statut de la demande - cela déclenchera le trigger de notification
      const { error } = await supabase
        .from("location_association_requests")
        .update({ status: "rejected" })
        .eq("id", requestId);

      if (error) {
        toast.error("Failed to reject request");
        throw error;
      }

      toast.success("Request rejected");
      fetchRequests();
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  }

  if (loading) return <div>Loading requests...</div>;

  return (
    <div className="location-requests">
      {/* <h2>Location Association Requests</h2> */}

      {requests.length === 0 ? (
        <p>No pending requests</p>
      ) : (
        <ul>
          {requests.map((request) => (
            <li key={request.id} className="request-item">
              <div>
                <strong>{request.requester_name}</strong> wants to be associated
                with Block {request.location_block}, Lot {request.location_lot}
              </div>
              <div className="request-actions">
                <button
                  onClick={() => handleReject(request.id)}
                  className="reject-button"
                >
                  <ImCross />
                </button>
                <button
                  onClick={() =>
                    handleApprove(
                      request.id,
                      request.requester_id,
                      request.location_id
                    )
                  }
                  className="approve-button"
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
