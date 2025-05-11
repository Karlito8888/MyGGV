import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Home from "./pages/Home";
import { UserDashboard } from "./pages/UserDashboard";
import { UserProfile } from "./pages/UserProfile";
import Messages from "./pages/Messages";

export const router = createBrowserRouter([
  {
    path: "/*",
    element: <App />,
    children: [
      {
        index: true,
        path: "",
        element: <Home />,
      },
      {
        path: "home",
        element: <Home />,
      },
      {
        path: "profile",
        element: <UserProfile />,
      },
      {
        path: "dashboard",
        element: <UserDashboard />,
      },
      {
        path: "messages",
        element: <Messages />,
      },
    ],
  },
]);
