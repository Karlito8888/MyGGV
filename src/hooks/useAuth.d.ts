import { User } from "@supabase/supabase-js";
export declare const useAuth: () => {
    user: User | null;
    role: string | null;
};
