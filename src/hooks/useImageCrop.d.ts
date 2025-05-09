import type { PixelCrop } from "react-image-crop";
export interface ImageState {
    src: string | null;
    ref: HTMLImageElement | null;
    crop: PixelCrop | undefined;
    uploading: boolean;
    showCropper: boolean;
}
export type ImageAction = {
    type: "SET_SRC";
    payload: string | null;
} | {
    type: "SET_REF";
    payload: HTMLImageElement | null;
} | {
    type: "SET_CROP";
    payload: PixelCrop | undefined;
} | {
    type: "SET_UPLOADING";
    payload: boolean;
} | {
    type: "SET_SHOW_CROPPER";
    payload: boolean;
} | {
    type: "RESET";
};
export declare function useImageCrop(): {
    imageState: ImageState;
    dispatchImage: import("react").ActionDispatch<[action: ImageAction]>;
};
