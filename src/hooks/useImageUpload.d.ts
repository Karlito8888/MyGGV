import { ImageState } from "./useImageCrop";
interface UseImageUploadOptions {
    onError: (error: any, message?: string | undefined) => void;
    onSuccess?: (publicUrl: string) => Promise<void> | void;
    currentProfilePictureUrl?: string | null;
}
export declare function useImageUpload({ onError, onSuccess, currentProfilePictureUrl }: UseImageUploadOptions): {
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>, dispatchImage: React.Dispatch<any>) => void;
    handleCloseCropper: (dispatchImage: React.Dispatch<any>) => void;
    uploadImage: (imageState: ImageState, dispatchImage: React.Dispatch<any>, userId: string, customFileName?: string) => Promise<string | null | undefined>;
};
export {};
