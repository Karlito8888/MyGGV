import { useState, useEffect, useRef } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import { useNotifications } from "../hooks/useNotifications";
import Spinner from "../components/ui/Spinner";

interface ChatMessage {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
}

interface ChatRoom {
  id: string;
  name: string;
  description: string;
}

export default function LiveChat({ session }: { session: Session }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoom, setActiveRoom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { markAsRead, notifications } = useNotifications();

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (activeRoom) {
      fetchMessages();

      // Abonnement aux nouveaux messages
      const subscription = supabase
        .channel(`room:${activeRoom}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "chat_messages",
            filter: `room_id=eq.${activeRoom}`,
          },
          (payload) => {
            const newMessage = payload.new as any;

            // Récupérer les informations de l'utilisateur
            supabase
              .from("profiles")
              .select("display_name, full_name")
              .eq("id", newMessage.user_id)
              .single()
              .then(({ data }) => {
                setMessages((prev) => [
                  ...prev,
                  {
                    id: newMessage.id,
                    user_id: newMessage.user_id,
                    content: newMessage.content,
                    created_at: newMessage.created_at,
                    user_name:
                      data?.display_name || data?.full_name || "Unknown",
                  },
                ]);
                scrollToBottom();
              });
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [activeRoom]);

  // Marquer les notifications de chat comme lues
  useEffect(() => {
    if (activeRoom) {
      const chatNotifications = notifications.filter(
        (n) =>
          n.type === "chat_message" && n.related_id === activeRoom && !n.is_read
      );

      chatNotifications.forEach((notification) => {
        markAsRead(notification.id);
      });
    }
  }, [notifications, activeRoom, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  async function fetchRooms() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("chat_rooms")
        .select("*")
        .order("name", { ascending: true });

      if (error) {
        toast.error("Failed to load chat rooms");
        throw error;
      }

      if (data) {
        setRooms(data);
        // Si aucune salle active et qu'il y a des salles disponibles
        if (!activeRoom && data.length > 0) {
          setActiveRoom(data[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages() {
    if (!activeRoom) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          id, user_id, content, created_at,
          profiles(display_name, full_name)
        `
        )
        .eq("room_id", activeRoom)
        .order("created_at", { ascending: true })
        .limit(50);

      if (error) {
        toast.error("Failed to load messages");
        throw error;
      }

      if (data) {
        const formattedMessages = data.map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          content: item.content,
          created_at: item.created_at,
          user_name:
            item.profiles?.display_name ||
            item.profiles?.full_name ||
            "Unknown",
        }));

        setMessages(formattedMessages);
        scrollToBottom();
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeRoom) return;

    try {
      const { error } = await supabase.from("chat_messages").insert({
        user_id: session.user.id,
        room_id: activeRoom,
        content: newMessage,
      });

      if (error) {
        toast.error("Failed to send message");
        throw error;
      }

      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  if (loading && !activeRoom) return <Spinner />;

  return (
    <div className="live-chat">
      <div className="chat-rooms">
        <h3>Chat Rooms</h3>
        <ul>
          {rooms.map((room) => (
            <li
              key={room.id}
              className={`room-item ${activeRoom === room.id ? "active" : ""}`}
              onClick={() => setActiveRoom(room.id)}
            >
              {room.name}
            </li>
          ))}
        </ul>
      </div>

      <div className="chat-area">
        <div className="chat-header">
          {activeRoom && rooms.find((r) => r.id === activeRoom)?.name}
        </div>

        <div className="chat-messages">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`chat-bubble ${
                msg.user_id === session.user.id ? "sent" : "received"
              }`}
            >
              <div className="message-sender">{msg.user_name}</div>
              <div className="message-content">{msg.content}</div>
              <div className="message-time">
                {new Date(msg.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
}
