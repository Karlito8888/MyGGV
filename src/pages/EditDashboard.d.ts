import { Profile } from "./UserDashboard";
import "./editDashboard.css";
interface EditDashboardProps {
    profile: Profile;
    onUpdate: (updatedFields: Partial<Profile>) => Promise<void>;
    onCancel: () => void;
}
export declare const EditDashboard: ({ profile, onUpdate, onCancel, }: EditDashboardProps) => import("react/jsx-runtime").JSX.Element;
export {};
