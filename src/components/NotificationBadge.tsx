import { useNotifications } from "../hooks/useNotifications";
import "./notificationBadge.css";

interface NotificationBadgeProps {
  type?: string;
  relatedId?: string;
}

export default function NotificationBadge({ type, relatedId }: NotificationBadgeProps) {
  const { notifications } = useNotifications();
  
  // Filtrer les notifications selon le type et l'ID associé
  const filteredNotifications = notifications.filter(n => {
    if (!n.is_read) {
      if (type && relatedId) {
        return n.type === type && n.related_id === relatedId;
      } else if (type) {
        return n.type === type;
      } else {
        return true;
      }
    }
    return false;
  });
  
  const count = filteredNotifications.length;
  
  if (count === 0) return null;
  
  return (
    <span className="notification-badge">{count}</span>
  );
}