import { Session } from "@supabase/supabase-js";
import "./onboardingModals.css";
interface OnboardingModalsProps {
    session: Session | null;
}
/**
 * Composant qui gère les modales d'onboarding pour les nouveaux utilisateurs
 */
export default function OnboardingModals({ session }: OnboardingModalsProps): import("react/jsx-runtime").JSX.Element;
export {};
