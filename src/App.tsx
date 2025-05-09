import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Header from "./components/Header";
import Aside from "./components/Aside";
import Signup from "./pages/Signup";
import OnboardingModals from "./components/OnboardingModals";
import PendingApprovalPage from "./components/PendingApprovalPage";
import LocationRequests from "./components/LocationRequests";
import { useAuth } from "./hooks/useAuth";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  const { role } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [hasApprovedLocation, setHasApprovedLocation] = useState<
    boolean | null
  >(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<
    boolean | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState<boolean | null>(
    null
  );

  useEffect(() => {
    // Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        checkUserStatus(session);
      } else {
        setLoading(false);
      }
    });

    // Écouter les changements de session
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkUserStatus(session);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUserStatus = async (session: Session) => {
    setLoading(true);

    try {
      // Vérifier si l'utilisateur est un admin
      const { data: userData } = await supabase
        .from("profiles")
        .select("display_name, profile_picture_url")
        .eq("id", session.user.id)
        .single();

      const isAdmin = role === "admin";
      const hasCompletedProfile = userData && userData.display_name;
      setHasCompletedOnboarding(hasCompletedProfile);

      // Si l'utilisateur est un admin, lui donner accès complet
      if (isAdmin) {
        setHasApprovedLocation(true);
        setLoading(false);
        return;
      }

      // Pour les utilisateurs non-admin, vérifier l'association de location
      const { data: locationData, error: locationError } = await supabase
        .from("profile_location_associations")
        .select("profile_id, location_id")
        .eq("profile_id", session.user.id)
        .limit(1);

      if (locationError) {
        console.error(
          "Erreur lors de la vérification des associations de location:",
          locationError
        );
        setHasApprovedLocation(false);
      } else {
        setHasApprovedLocation(locationData && locationData.length > 0);
      }

      // Vérifier si l'utilisateur a une demande d'association en attente
      const { data: pendingRequests } = await supabase
        .from("location_association_requests")
        .select("*")
        .eq("requester_id", session.user.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(1);

      // Mettre à jour l'état pour refléter si l'utilisateur a une demande en attente
      setHasPendingRequest(pendingRequests && pendingRequests.length > 0);
    } catch (error) {
      console.error(
        "Erreur lors de la vérification du statut de l'utilisateur:",
        error
      );
      setHasCompletedOnboarding(false);
      setHasApprovedLocation(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <>
      <Header />
      <Aside />
      {!session && <Signup />}

      {session && role !== "admin" && !hasCompletedOnboarding && (
        <OnboardingModals session={session} />
      )}

      {session && role !== "admin" &&
        hasCompletedOnboarding &&
        hasApprovedLocation === false &&
        hasPendingRequest && <PendingApprovalPage session={session} />}

      {session && role !== "admin" &&
        hasCompletedOnboarding &&
        hasApprovedLocation === false &&
        !hasPendingRequest && <LocationRequests session={session} />}

      {session && (role === "admin" || (hasCompletedOnboarding && hasApprovedLocation)) && (
        <>
          <main>
            <Outlet />
          </main>
        </>
      )}

      {!session && (
        <main>
          <Outlet />
        </main>
      )}

      <footer>{/* Contenu du footer */}</footer>

      {/* Configuration de react-toastify */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark" // ou "light" selon votre thème
      />
    </>
  );
}

export default App;
