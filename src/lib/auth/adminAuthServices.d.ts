export declare const getUserById: (userId: string) => Promise<{
    user: import("@supabase/auth-js").User;
}>;
export declare const listUsers: (page?: number, perPage?: number) => Promise<{
    users: import("@supabase/auth-js").User[];
    aud: string;
} & import("@supabase/auth-js").Pagination>;
export declare const deleteUser: (userId: string, softDelete?: boolean) => Promise<{
    user: import("@supabase/auth-js").User;
}>;
export declare const updateUserRole: (userId: string, role: string) => Promise<{
    user: import("@supabase/auth-js").User;
}>;
export declare const createUser: (email: string, password: string) => Promise<{
    user: import("@supabase/auth-js").User;
}>;
