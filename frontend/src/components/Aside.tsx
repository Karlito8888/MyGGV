import { NavLink } from "react-router-dom";
import { useState } from "react";
import {
  FiMenu,
  FiX,
  FiHome,
  FiUser,
  FiMessageSquare,
  FiInfo,
} from "react-icons/fi";
import { FaUserAltSlash, FaSignInAlt, FaRedhat } from "react-icons/fa";
import { CiLogout } from "react-icons/ci";
import { CgGames } from "react-icons/cg";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import { supabase } from "../lib/supabase";

import "./aside.css";
import { useAuth } from "../hooks/useAuth";

function Aside() {
  const [isOpen, setIsOpen] = useState(false);
  const isLoggedIn = useSelector((state: RootState) => state.auth.isLoggedIn);
  const { role } = useAuth();

  return (
    <>
      <aside className={`aside ${isOpen ? "open" : "closed"}`}>
        <div className="aside-container">
          <div className={`aside-logo ${isOpen ? "open" : "closed"}`}>
            <img src="/src/assets/logos/ggv-70.png" alt="Logo GGV" />
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="aside-toggle">
            {isOpen ? <FiX /> : <FiMenu />}
          </button>

          <nav className="aside-nav">
            <div className="aside-nav-top">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {isOpen ? <span>Home</span> : <FiHome className="nav-icon" />}
              </NavLink>
              <NavLink
                to="/chat"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {isOpen ? (
                  <span>Chat</span>
                ) : (
                  <FiMessageSquare className="nav-icon" />
                )}
              </NavLink>
              <NavLink
                to="/infos"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {isOpen ? <span>Infos</span> : <FiInfo className="nav-icon" />}
              </NavLink>
              <NavLink
                to="/games"
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {isOpen ? <span>Games</span> : <CgGames className="nav-icon" />}
              </NavLink>
            </div>

            <div className="aside-nav-bottom">
              <NavLink
                to={isLoggedIn ? "/profile" : "/signup"}
                className={({ isActive }) =>
                  `nav-link ${isActive ? "active" : ""}`
                }
              >
                {isOpen ? (
                  <span>Profile</span>
                ) : isLoggedIn ? (
                  role === "admin" ? (
                    <FaRedhat className="nav-icon" />
                  ) : (
                    <FiUser className="nav-icon" />
                  )
                ) : (
                  <FaUserAltSlash className="nav-icon" />
                )}
              </NavLink>
              {isLoggedIn ? (
                <button
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (!error) {
                      window.location.href = "/";
                    }
                  }}
                  className="nav-link-button"
                >
                  {isOpen ? (
                    <span>Sign Out</span>
                  ) : (
                    <CiLogout className="nav-icon" />
                  )}
                </button>
              ) : (
                <NavLink
                  to="/signup"
                  className={({ isActive }) =>
                    `nav-link ${isActive ? "active" : ""}`
                  }
                >
                  {isOpen ? (
                    <span>Sign In</span>
                  ) : (
                    <FaSignInAlt className="nav-icon" />
                  )}
                </NavLink>
              )}
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
}

export default Aside;
