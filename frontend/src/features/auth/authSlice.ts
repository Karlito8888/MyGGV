import {
  createSlice,
  ThunkDispatch,
  UnknownAction,
  PayloadAction,
} from "@reduxjs/toolkit";
import { supabase } from "../../lib/supabase";
import { User } from "@supabase/supabase-js";

interface AuthState {
  isLoggedIn: boolean;
  user: User | null;
}

const initialState: AuthState = {
  isLoggedIn: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loginSuccess(state, action: PayloadAction<User>) {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    logoutSuccess(state) {
      state.isLoggedIn = false;
      state.user = null;
    },
  },
});

export const { loginSuccess, logoutSuccess } = authSlice.actions;

export const checkAuth =
  () => async (dispatch: ThunkDispatch<unknown, unknown, UnknownAction>) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      dispatch(loginSuccess(user));
    }
  };

export default authSlice.reducer;
