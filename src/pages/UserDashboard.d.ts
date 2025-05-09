import "./userDashboard.css";
export interface Profile {
    id: string;
    display_name: string;
    full_name: string;
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
export declare const UserDashboard: () => import("react/jsx-runtime").JSX.Element;
