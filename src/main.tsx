import React from "react";
import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { store } from "./app/store";
// import App from "./App";
import "./styles/main.css";
import { router } from "./router";
import { RouterProvider } from "react-router-dom";
// import { AuthContextProvider } from "./context/AuthContext";
import { checkAuth } from "./features/auth/authSlice";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

store.dispatch(checkAuth());

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Provider store={store}>
      {/* <AuthContextProvider> */}
      <RouterProvider router={router} />
      {/* </AuthContextProvider> */}
    </Provider>
  </React.StrictMode>
);
