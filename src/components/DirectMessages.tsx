import { useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { toast } from "react-toastify";
import "./directMessages.css";
import { useNotifications } from "../hooks/useNotifications";

interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_name: string;
}

interface Conversation {
  user_id: string;
  display_name: string;
  last_message?: string;
  unread_count: number;
}

export default function DirectMessages({ session }: { session: Session }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { markAsRead, notifications } = useNotifications();

  // Charger les conversations
  useEffect(() => {
    fetchConversations();
    
    // Abonnement aux nouveaux messages
    const subscription = supabase
      .channel('public:direct_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'direct_messages',
          filter: `receiver_id=eq.${session.user.id}`
        }, 
        () => {
          toast.info('You have a new message');
          fetchConversations();
          if (activeConversation) {
            fetchMessages(activeConversation);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [session, activeConversation]);

  // Marquer les notifications de messages directs comme lues
  useEffect(() => {
    if (activeConversation) {
      const directMessageNotifications = notifications.filter(
        n => n.type === 'direct_message' && 
             n.related_id === activeConversation && 
             !n.is_read
      );
      
      directMessageNotifications.forEach(notification => {
        markAsRead(notification.id);
      });
    }
  }, [notifications, activeConversation, markAsRead]);

  async function fetchConversations() {
    try {
      setLoading(true);
      const userId = session.user.id;

      // Récupérer les conversations (utilisateurs avec qui on a échangé des messages)
      const { data, error } = await supabase
        .rpc('get_conversations', { p_user_id: userId });

      if (error) {
        toast.error("Failed to load conversations");
        throw error;
      }

      if (data) {
        setConversations(data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(otherUserId: string) {
    try {
      setLoading(true);
      const userId = session.user.id;

      const { data, error } = await supabase
        .from("direct_messages")
        .select(`
          id, sender_id, receiver_id, content, created_at, is_read,
          profiles:sender_id(display_name, full_name)
        `)
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });

      if (error) {
        toast.error("Failed to load messages");
        throw error;
      }

      if (data) {
        const formattedMessages = data.map((item: any) => ({
          id: item.id,
          sender_id: item.sender_id,
          receiver_id: item.receiver_id,
          content: item.content,
          created_at: item.created_at,
          is_read: item.is_read,
          sender_name: item.profiles?.display_name || item.profiles?.full_name || "Unknown",
        }));

        setMessages(formattedMessages);
        
        // Marquer les messages comme lus
        await supabase
          .from("direct_messages")
          .update({ is_read: true })
          .eq("receiver_id", userId)
          .eq("sender_id", otherUserId);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage() {
    if (!newMessage.trim() || !activeConversation) return;
    
    try {
      const { error } = await supabase
        .from("direct_messages")
        .insert({
          sender_id: session.user.id,
          receiver_id: activeConversation,
          content: newMessage,
        });

      if (error) {
        toast.error("Failed to send message");
        throw error;
      }

      setNewMessage("");
      fetchMessages(activeConversation);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  }

  if (loading && !activeConversation) return <div>Loading conversations...</div>;

  return (
    <div className="direct-messages">
      <div className="conversations-list">
        <h3>Conversations</h3>
        {conversations.length === 0 ? (
          <p>No conversations yet</p>
        ) : (
          <ul>
            {conversations.map((conv) => (
              <li 
                key={conv.user_id} 
                className={`conversation-item ${activeConversation === conv.user_id ? 'active' : ''}`}
                onClick={() => {
                  setActiveConversation(conv.user_id);
                  fetchMessages(conv.user_id);
                }}
              >
                <div className="conversation-name">{conv.display_name}</div>
                {conv.unread_count > 0 && (
                  <span className="unread-badge">{conv.unread_count}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="messages-area">
        {!activeConversation ? (
          <div className="select-conversation">
            <p>Select a conversation to start messaging</p>
          </div>
        ) : (
          <>
            <div className="messages-list">
              {messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`message-bubble ${msg.sender_id === session.user.id ? 'sent' : 'received'}`}
                >
                  <div className="message-content">{msg.content}</div>
                  <div className="message-meta">
                    <span className="message-time">
                      {new Date(msg.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
