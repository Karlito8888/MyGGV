import { adminAuthClient } from "../supabaseAdmin";

export const getUserById = async (userId: string) => {
  try {
    const { data, error } = await adminAuthClient.getUserById(userId);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const listUsers = async (page: number = 1, perPage: number = 50) => {
  try {
    const { data, error } = await adminAuthClient.listUsers({
      page: page,
      perPage: perPage,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error listing users:", error);
    throw error;
  }
};

export const deleteUser = async (
  userId: string,
  softDelete: boolean = false
) => {
  try {
    const { data, error } = await adminAuthClient.deleteUser(
      userId,
      softDelete
    );

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

export const updateUserRole = async (userId: string, role: string) => {
  try {
    const { data, error } = await adminAuthClient.updateUserById(userId, {
      role: role,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
};

export const createUser = async (email: string, password: string) => {
  try {
    const { data, error } = await adminAuthClient.createUser({
      email: email,
      password: password,
      email_confirm: true,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};
