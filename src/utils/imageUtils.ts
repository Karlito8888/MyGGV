import { PixelCrop } from "react-image-crop";

export async function cropImageToBlob(
  imageRef: HTMLImageElement,
  crop: PixelCrop,
  options: {
    circularCrop?: boolean;
    format?: 'image/jpeg' | 'image/png' | 'image/webp';
    quality?: number;
  } = {}
): Promise<Blob> {
  const { 
    circularCrop = true, 
    format = 'image/jpeg', 
    quality = 0.9  // Standardiser à 0.9 pour tous les appels
  } = options;
  
  // Créer un canvas pour le recadrage
  const canvas = document.createElement("canvas");
  const scaleX = imageRef.naturalWidth / imageRef.width;
  const scaleY = imageRef.naturalHeight / imageRef.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Canvas context is not available");
  }

  // Dessiner l'image recadrée sur le canvas
  ctx.drawImage(
    imageRef,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  // Ajouter un effet de lissage pour les crops circulaires
  if (circularCrop) {
    ctx.globalCompositeOperation = 'destination-in';
    ctx.beginPath();
    ctx.arc(
      crop.width / 2,
      crop.height / 2,
      Math.min(crop.width, crop.height) / 2,
      0,
      2 * Math.PI
    );
    ctx.fill();
  }

  // Convertir le canvas en blob avec le format spécifié
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, format, quality);
  });

  if (!blob) {
    throw new Error("Failed to create blob from canvas");
  }

  return blob;
}
