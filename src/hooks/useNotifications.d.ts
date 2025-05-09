export interface Notification {
    id: string;
    type: string;
    message: string;
    related_id: string | null;
    is_read: boolean;
    created_at: string;
}
export declare function useNotifications(): {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<boolean>;
    markAllAsRead: () => Promise<boolean>;
};
