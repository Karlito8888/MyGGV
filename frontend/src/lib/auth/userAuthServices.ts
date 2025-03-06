import { loginSuccess } from "../../features/auth/authSlice";
import { supabase } from "../supabase";

export const deleteUserAccount = async (userId: string): Promise<boolean> => {
  try {
    // Supprimer le profil de la table profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", userId);

    if (profileError) throw profileError;

    // Déconnecter l'utilisateur
    await supabase.auth.signOut();

    return true;
  } catch (err) {
    console.error("Error deleting user account:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to delete user account"
    );
  }
};

export const updateUserProfile = async (
  userId: string,
  updates: Record<string, any>
) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error updating user profile:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to update user profile"
    );
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to fetch user profile"
    );
  }
};

export const handleOAuthSignIn = async (
  provider: "google" | "facebook",
  navigate: any,
  dispatch: any
) => {
  try {
    const { error } = await supabase.auth.signInWithOAuth({ provider });

    if (error) throw error;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const displayName =
        user.user_metadata.name || user.user_metadata.full_name || "User";
      const email = user.user_metadata.email || "";
      const avatarUrl =
        user.user_metadata.avatar_url ||
        user.user_metadata.picture ||
        "https://www.gravatar.com/avatar/default";

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          email,
          profile_picture_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Redirection et mise à jour de l'état
      navigate("/");
      dispatch(loginSuccess(user));

      return { user, displayName, email, avatarUrl };
    }

    throw new Error("No user found after OAuth sign-in");
  } catch (err) {
    console.error("Error during OAuth sign-in:", err);
    throw new Error(
      err instanceof Error ? err.message : "Failed to sign in with OAuth"
    );
  }
};
