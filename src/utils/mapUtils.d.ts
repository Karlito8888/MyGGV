import Feature from "ol/Feature";
import { Map } from "ol";
import { Style } from "ol/style";
import VectorSource from "ol/source/Vector";
/**
 * Crée un style pour une feature avec une icône et éventuellement du texte.
 */
export declare const createFeatureStyle: (iconUrl: string, scale: number, text?: string, textOffsetY?: number, textScale?: number) => Style;
/**
 * Définit le style d'un bloc.
 */
export declare const setBlockStyle: (feature: Feature, color: string, name: string) => void;
/**
 * Met à jour le style d'une feature de POI public.
 */
export declare const updatePublicPoiStyle: (feature: Feature, scale: number) => void;
/**
 * Met à jour le style d'une feature d'emplacement.
 */
export declare const updateLocationStyle: (feature: Feature, scale: number, showText: boolean) => void;
/**
 * Ajoute un bloc à la carte avec un style personnalisé.
 */
export declare const addBlockToMap: (block: {
    coords: number[][];
    name: string;
    color: string;
}, blocksSource: VectorSource, setBlockStyle: (feature: Feature, color: string, name: string) => void) => void;
/**
 * Ajoute des POIs publics à la carte.
 */
export declare const addPublicPoisToMap: (publicPois: Array<{
    coords: number[];
    name: string;
    icon: string;
}>, vectorSource: VectorSource) => Feature[];
/**
 * Met à jour les styles de toutes les features en fonction du niveau de zoom.
 */
export declare const updateAllFeatureStyles: (map: Map, vectorSource: VectorSource, locationsSource: VectorSource) => void;
/**
 * Récupère les emplacements depuis Supabase et les ajoute à la source vectorielle.
 */
export declare const fetchLocations: (supabase: any, locationsSource: VectorSource) => Promise<void>;
/**
 * Gère l'ajout d'un lot à la base de données.
 */
export declare const handleAddLot: (coordinates: number[], supabase: any) => Promise<void>;
/**
 * Gère le clic sur un marqueur pour afficher les profils associés.
 */
export declare const handleMarkerClick: (feature: Feature, supabase: any, setAssociatedProfiles: (profiles: any[]) => void, setIsModalOpen: (isOpen: boolean) => void) => Promise<void>;
/**
 * Configure l'écouteur pour ajouter un lot à la carte.
 */
export declare const setupLotAdding: (map: Map, isAddingLot: boolean, setIsAddingLot: (value: boolean) => void, supabase: any) => void;
/**
 * Configure l'ajout de marqueurs alignés sur la carte.
 */
export declare const setupAlignedMarkers: (map: Map, isAddingAlignedMarkers: boolean, setIsAddingAlignedMarkers: (value: boolean) => void, vectorSource: VectorSource, supabase: any, fetchLocations: () => void) => void;
/**
 * Détermine le type d'appareil en fonction de la largeur d'écran.
 */
export declare const getDeviceType: () => string;
/**
 * Détermine le niveau de zoom approprié en fonction du type d'appareil.
 */
export declare const getZoomLevel: (deviceType: string) => number;
/**
 * Initialise la carte OpenLayers.
 */
export declare const initializeMap: (mapTargetId: string, initialPosition: number[], blocksSource: VectorSource, vectorSource: VectorSource, locationsSource: VectorSource, isAddingLot: boolean, isAddingAlignedMarkers: boolean, handleFeatureClick: (feature: Feature) => void) => Map;
/**
 * Configure les fonctionnalités de la carte.
 */
export declare const setupMapFeatures: (map: Map, blocks: any[], publicPois: any[], blocksSource: VectorSource, vectorSource: VectorSource, locationsSource: VectorSource, role: string | null, isAddingLot: boolean, setIsAddingLot: (value: boolean) => void, isAddingAlignedMarkers: boolean, setIsAddingAlignedMarkers: (value: boolean) => void, supabase: any, onMarkersAdded: () => void) => void;
/**
 * Nettoie la carte en supprimant sa cible.
 */
export declare const cleanupMap: (map: Map) => void;
