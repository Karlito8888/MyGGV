import { useState, useCallback, useEffect } from "react";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cropImageToBlob } from "../utils/imageUtils";
import "./ImageCropper.css";
import { toast } from "react-toastify";

interface ImageCropperProps {
  imgSrc: string | null;
  onCropComplete: (
    imageRef: HTMLImageElement,
    completedCrop: PixelCrop
  ) => void;
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

export const ImageCropper = ({
  imgSrc,
  onCropComplete,
  onClose,
  onUpload,
  isUploading,
  aspect = 1,
  circularCrop = false,
  minWidth = 50,
  minHeight = 50,
  maxWidth,
  maxHeight,
}: ImageCropperProps) => {
  const [crop, setCrop] = useState<Crop>();
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // Function to center and initialize crop when image is loaded
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(true);
      const { width, height } = e.currentTarget;

      try {
        // Create a centered crop with the right aspect ratio
        const initialCrop = centerCrop(
          makeAspectCrop(
            {
              unit: "%",
              width: 90,
            },
            aspect,
            width,
            height
          ),
          width,
          height
        );

        setCrop(initialCrop);
        setImageRef(e.currentTarget);
        toast.info(circularCrop 
          ? "Drag to position and resize the circular crop area" 
          : "Drag to position and resize the crop area");
      } catch (error) {
        console.error("Error initializing crop:", error);
        toast.error("Failed to initialize image cropper");
      } finally {
        setIsLoading(false);
      }
    },
    [aspect, circularCrop]
  );

  const handleCropComplete = (crop: PixelCrop) => {
    if (imageRef) {
      // Vérifier si la taille du crop est suffisante
      if (crop.width < minWidth || crop.height < minHeight) {
        toast.warning(`Crop size too small. Minimum dimensions: ${minWidth}x${minHeight}px`);
      }
      
      onCropComplete(imageRef, crop);
      setCompletedCrop(crop);
    }
  };

  const handleUpload = (e?: React.FormEvent) => {
    if (!completedCrop) {
      toast.warning("Please complete cropping before uploading");
      return;
    }
    
    if (isUploading) {
      toast.info("Upload in progress, please wait...");
      return;
    }
    
    onUpload(e);
  };

  useEffect(() => {
    if (!completedCrop || !imageRef) {
      setPreview(null);
      return;
    }

    const generatePreview = async () => {
      try {
        // Use existing function to create a blob
        const blob = await cropImageToBlob(imageRef, completedCrop, {
          circularCrop,
          format: "image/jpeg",
          quality: 0.9,
        });

        // Convert blob to data URL for preview
        const previewUrl = URL.createObjectURL(blob);
        setPreview(previewUrl);

        // Clean up URL when component is unmounted or preview changes
        return () => URL.revokeObjectURL(previewUrl);
      } catch (error) {
        console.error("Error generating preview:", error);
        toast.error("Failed to generate preview");
        setPreview(null);
      }
    };

    generatePreview();
  }, [completedCrop, imageRef, circularCrop]);

  if (!imgSrc) return null;

  return (
    <div className="image-cropper-modal">
      <div className="image-cropper-modal-content">
        <h3>Crop Your Image</h3>
        
        <div className="image-cropper-container">
          {isLoading && <div className="loading-indicator">Loading image...</div>}
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={handleCropComplete}
            aspect={aspect}
            circularCrop={circularCrop}
            minWidth={minWidth}
            minHeight={minHeight}
            maxWidth={maxWidth}
            maxHeight={maxHeight}
            ruleOfThirds
          >
            <img
              src={imgSrc}
              alt="Preview"
              onLoad={onImageLoad}
              style={{ maxWidth: "100%", maxHeight: "300px" }}
            />
          </ReactCrop>
          
          {circularCrop && (
            <p className="text-sm">
              Drag to position and resize the circular crop area
            </p>
          )}
          
          {preview && (
            <div className="preview-container">
              <h4>Preview</h4>
              <img
                src={preview}
                alt="Crop preview"
                className="crop-preview"
                style={{
                  borderRadius: circularCrop ? "50%" : "0",
                  width: "100px",
                  height: "100px",
                  objectFit: "cover",
                }}
              />
            </div>
          )}
        </div>
        
        <div className="modal-actions">
          <button 
            className="button button-secondary" 
            onClick={() => {
              toast.info("Cropping cancelled");
              onClose();
            }}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            className="button button-primary"
            onClick={handleUpload}
            disabled={isUploading || !completedCrop}
          >
            {isUploading ? "Uploading..." : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
};
