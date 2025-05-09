import { PixelCrop } from "react-image-crop";
export declare function cropImageToBlob(imageRef: HTMLImageElement, crop: PixelCrop, options?: {
    circularCrop?: boolean;
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
    quality?: number;
}): Promise<Blob>;
