import { useReducer } from "react";
import type { PixelCrop } from "react-image-crop";

// Types for image state management
export interface ImageState {
  src: string | null;
  ref: HTMLImageElement | null;
  crop: PixelCrop | undefined;
  uploading: boolean;
  showCropper: boolean;
}

export type ImageAction =
  | { type: "SET_SRC"; payload: string | null }
  | { type: "SET_REF"; payload: HTMLImageElement | null }
  | { type: "SET_CROP"; payload: PixelCrop | undefined }
  | { type: "SET_UPLOADING"; payload: boolean }
  | { type: "SET_SHOW_CROPPER"; payload: boolean }
  | { type: "RESET" };

// Reducer function for image state
const imageReducer = (state: ImageState, action: ImageAction): ImageState => {
  switch (action.type) {
    case "SET_SRC": return { ...state, src: action.payload };
    case "SET_REF": return { ...state, ref: action.payload };
    case "SET_CROP": return { ...state, crop: action.payload };
    case "SET_UPLOADING": return { ...state, uploading: action.payload };
    case "SET_SHOW_CROPPER": return { ...state, showCropper: action.payload };
    case "RESET": return { 
      src: null, 
      ref: null, 
      crop: undefined, 
      uploading: false, 
      showCropper: false 
    };
    default: return state;
  }
};

// Custom hook for image cropping
export function useImageCrop() {
  const [imageState, dispatchImage] = useReducer(imageReducer, {
    src: null,
    ref: null,
    crop: undefined,
    uploading: false,
    showCropper: false,
  });

  return {
    imageState,
    dispatchImage
  };
}