import { useState, useEffect } from "react";
import "./signup.css";
import { supabase } from "../lib/supabase";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { Session } from "@supabase/supabase-js";
import Modal from "react-modal";
import ggvLogo from "../assets/img/ggv.png";

declare module "react-modal";

// Style pour la modale
const customStyles: Modal.Styles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    background:
      "linear-gradient(135deg,rgb(245, 245, 245) 0%,rgb(228, 228, 228) 100%)",
    borderRadius: "8px",
    zIndex: 1000,
    position: "fixed" as const,
  },
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(3px)",
    zIndex: 999,
    position: "fixed" as const,
  },
};

export default function Signup() {
  const [session, setSession] = useState<Session | null>(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);

  useEffect(() => {
    const handleAuthStateChange = (_event: string, session: Session | null) => {
      setSession(session);
      setModalIsOpen(!session);
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthStateChange);
    return () => subscription.unsubscribe();
  }, []);

  return (
    <Modal
      isOpen={modalIsOpen}
      style={customStyles}
      contentLabel="Login required"
      ariaHideApp={false}
      shouldCloseOnEsc={false}
      shouldCloseOnOverlayClick={false}
    >
      <div className="signup-container">
        <div className="signup-widget">
          <img src={ggvLogo} alt="GGV Logo" className="signup-logo" />
          <p className="dsp-none">
            Current status: {session?.user?.email || "Not connected"}
          </p>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={["google", "facebook"]}
            view="sign_up"
            redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : undefined}
          />
        </div>
      </div>
    </Modal>
  );
}
