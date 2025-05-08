import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/main.css";
import { router } from "./router";
import { RouterProvider } from "react-router-dom";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Failed to find the root element");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
