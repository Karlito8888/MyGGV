import { PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import "./ImageCropper.css";
interface ImageCropperProps {
    imgSrc: string | null;
    onCropComplete: (imageRef: HTMLImageElement, completedCrop: PixelCrop) => void;
    onClose: () => void;
    onUpload: (e?: React.FormEvent) => void;
    isUploading: boolean;
    aspect?: number;
    circularCrop?: boolean;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
}
export declare const ImageCropper: ({ imgSrc, onCropComplete, onClose, onUpload, isUploading, aspect, circularCrop, minWidth, minHeight, maxWidth, maxHeight, }: ImageCropperProps) => import("react/jsx-runtime").JSX.Element | null;
export {};
