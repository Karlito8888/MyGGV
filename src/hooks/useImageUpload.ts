import { useCallback } from "react";
import { supabase } from "../lib/supabase";
import { cropImageToBlob } from "../utils/imageUtils";
import { ImageState } from "./useImageCrop";

interface UseImageUploadOptions {
  onError: (error: any, message?: string | undefined) => void;
  onSuccess?: (publicUrl: string) => Promise<void> | void;
  currentProfilePictureUrl?: string | null;
}

export function useImageUpload({ onError, onSuccess, currentProfilePictureUrl }: UseImageUploadOptions) {
  // Fonction pour extraire le nom du fichier à partir de l'URL
  const getFileNameFromUrl = useCallback((url: string): string | null => {
    try {
      // Extraire le chemin du fichier de l'URL
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      // Le dernier segment après "object/public/avatars/" devrait être le nom du fichier
      const fileName = pathParts[pathParts.indexOf("avatars") + 1];
      return fileName || null;
    } catch (error) {
      console.error("Failed to parse file name from URL:", error);
      return null;
    }
  }, []);

  // Fonction pour supprimer l'ancienne photo de profil
  const deleteOldProfilePicture = useCallback(async (url: string): Promise<void> => {
    try {
      // Ne pas supprimer l'image par défaut
      if (url.includes("default-avatar") || url.includes("ggv-100.png")) {
        return;
      }

      const fileName = getFileNameFromUrl(url);
      if (!fileName) return;

      // Supprimer le fichier du bucket avatars
      const { error } = await supabase.storage
        .from("avatars")
        .remove([fileName]);

      if (error) {
        console.error("Error deleting old profile picture:", error);
      }
    } catch (error) {
      console.error("Failed to delete old profile picture:", error);
    }
  }, [getFileNameFromUrl]);

  // Gestion du changement de fichier
  const handleFileChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement>,
    dispatchImage: React.Dispatch<any>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      dispatchImage({ type: 'SET_SRC', payload: reader.result?.toString() || null });
      dispatchImage({ type: 'SET_SHOW_CROPPER', payload: true });
    });
    reader.readAsDataURL(file);
  }, []);

  // Fermeture du cropper
  const handleCloseCropper = useCallback((dispatchImage: React.Dispatch<any>) => {
    dispatchImage({ type: 'SET_SHOW_CROPPER', payload: false });
    dispatchImage({ type: 'SET_SRC', payload: null });
  }, []);

  // Téléchargement de l'image
  const uploadImage = useCallback(async (
    imageState: ImageState,
    dispatchImage: React.Dispatch<any>,
    userId: string,
    customFileName?: string
  ) => {
    if (!imageState.src || !imageState.ref) return;

    dispatchImage({ type: 'SET_UPLOADING', payload: true });

    try {
      // Si aucun crop n'est défini, utiliser l'image entière
      const cropToUse = imageState.crop || {
        x: 0,
        y: 0,
        width: imageState.ref.width,
        height: imageState.ref.height,
        unit: 'px'
      };

      // Utiliser notre fonction utilitaire
      const blob = await cropImageToBlob(imageState.ref, cropToUse, {
        circularCrop: true,
        format: 'image/jpeg',
        quality: 0.9
      });

      // Préparer le fichier pour l'upload
      const fileExt = "jpg";
      const fileName = customFileName || `profile_${userId}_${Date.now()}.${fileExt}`;

      // Upload vers Supabase Storage - directement dans le bucket avatars
      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(fileName, blob, {
          cacheControl: "3600",
          upsert: true,
        });

      if (error) throw error;

      // Récupérer l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(data.path);

      // Supprimer l'ancienne photo de profil si elle existe
      if (currentProfilePictureUrl) {
        await deleteOldProfilePicture(currentProfilePictureUrl);
      }

      if (onSuccess) await onSuccess(publicUrl);
      
      dispatchImage({ type: 'RESET' });
      return publicUrl;
    } catch (error) {
      onError(error, "Failed to upload profile picture");
      return null;
    } finally {
      dispatchImage({ type: 'SET_UPLOADING', payload: false });
    }
  }, [onError, onSuccess, currentProfilePictureUrl, deleteOldProfilePicture]);

  return {
    handleFileChange,
    handleCloseCropper,
    uploadImage
  };
}
