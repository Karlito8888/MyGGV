import Feature from "ol/Feature";
import Polygon from "ol/geom/Polygon";
import Point from "ol/geom/Point";
import { Map } from "ol";
import { fromLonLat, toLonLat } from "ol/proj";
import { Style, Fill, Stroke, Text, Icon } from "ol/style";
import VectorSource from "ol/source/Vector";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { Vector as VectorLayer } from "ol/layer";

// ===== STYLES =====

/**
 * Crée un style pour une feature avec une icône et éventuellement du texte.
 */
export const createFeatureStyle = (
  iconUrl: string,
  scale: number,
  text?: string,
  textOffsetY: number = 15,
  textScale: number = 1.3
): Style => {
  return new Style({
    image: new Icon({
      src: iconUrl,
      scale: scale,
      anchor: [0.5, 1],
      anchorXUnits: "fraction",
      anchorYUnits: "fraction",
      crossOrigin: "anonymous",
    }),
    ...(text && {
      text: new Text({
        text: text,
        scale: textScale,
        offsetY: textOffsetY,
        fill: new Fill({ color: "#000000" }),
        stroke: new Stroke({ color: "#ffffff", width: 2 }),
      }),
    }),
  });
};

/**
 * Définit le style d'un bloc.
 */
export const setBlockStyle = (
  feature: Feature,
  color: string,
  name: string
) => {
  feature.setStyle(
    new Style({
      fill: new Fill({ color }),
      stroke: new Stroke({ color, width: 2 }),
      text: new Text({
        text: name,
        scale: 2,
        fill: new Fill({ color: "#000" }),
        stroke: new Stroke({ color: "#FFF", width: 2 }),
      }),
    })
  );
};

/**
 * Met à jour le style d'une feature de POI public.
 */
export const updatePublicPoiStyle = (
  feature: Feature,
  scale: number
): void => {
  feature.setStyle(createFeatureStyle(feature.get("icon"), scale));
};

/**
 * Met à jour le style d'une feature d'emplacement.
 */
export const updateLocationStyle = (
  feature: Feature,
  scale: number,
  showText: boolean
): void => {
  const lot = feature.get("lot");
  const markerUrl = feature.get("marker_url");
  const text = showText ? `Lot ${lot}` : "";
  feature.setStyle(createFeatureStyle(markerUrl, scale, text));
};

// ===== FEATURE MANAGEMENT =====

/**
 * Ajoute un bloc à la carte avec un style personnalisé.
 */
export const addBlockToMap = (
  block: { coords: number[][]; name: string; color: string },
  blocksSource: VectorSource,
  setBlockStyle: (feature: Feature, color: string, name: string) => void
) => {
  const feature = new Feature({
    geometry: new Polygon([block.coords]).transform("EPSG:4326", "EPSG:3857"),
    name: block.name,
    type: "block",
  });
  setBlockStyle(feature, block.color, block.name);
  blocksSource.addFeature(feature);
};

/**
 * Ajoute des POIs publics à la carte.
 */
export const addPublicPoisToMap = (
  publicPois: Array<{ coords: number[]; name: string; icon: string }>,
  vectorSource: VectorSource
): Feature[] => {
  const features: Feature[] = [];
  publicPois.forEach((poi) => {
    const feature = new Feature({
      geometry: new Point(fromLonLat(poi.coords)),
      name: poi.name,
      type: "public",
      icon: poi.icon,
    });
    updatePublicPoiStyle(feature, 0.5);
    vectorSource.addFeature(feature);
    features.push(feature);
  });
  return features;
};

// ===== STYLE UPDATES =====

/**
 * Met à jour les styles de toutes les features en fonction du niveau de zoom.
 */
export const updateAllFeatureStyles = (
  map: Map,
  vectorSource: VectorSource,
  locationsSource: VectorSource
) => {
  const zoom = map.getView().getZoom() || 16;
  const poiScale = 0.5;
  const showText = zoom >= 20;

  vectorSource.getFeatures().forEach((feature) => {
    if (feature.get("type") === "public") {
      updatePublicPoiStyle(feature, poiScale);
    }
  });

  locationsSource.getFeatures().forEach((feature) => {
    updateLocationStyle(feature, poiScale, showText);
  });
};

// ===== DATA OPERATIONS =====

/**
 * Récupère les emplacements depuis Supabase et les ajoute à la source vectorielle.
 */
export const fetchLocations = async (
  supabase: any,
  locationsSource: VectorSource
): Promise<void> => {
  const { data, error } = await supabase.from("locations").select("*");
  console.log("Number of POIs retrieved:", data?.length);

  if (error) {
    console.error("Error retrieving locations:", error);
    return;
  }

  locationsSource.clear();

  const features = data.map((location: any) => {
    const coordinates = location.coordinates.coordinates;
    const feature = new Feature({
      geometry: new Point(fromLonLat(coordinates)),
      block: location.block,
      lot: location.lot,
      type: "location",
      id: location.id,
      marker_url: location.marker_url || "/markers/default.png",
    });
    updateLocationStyle(feature, 0.5, false);
    return feature;
  });

  locationsSource.addFeatures(features);
};

/**
 * Gère l'ajout d'un lot à la base de données.
 */
export const handleAddLot = async (coordinates: number[], supabase: any) => {
  const block = prompt("Enter block number:");
  const lot = prompt("Enter lot number:");

  if (block && lot) {
    console.log("Data to insert:", {
      coordinates: `POINT(${coordinates[0]} ${coordinates[1]})`,
      block,
      lot,
    });

    const { data, error } = await supabase
      .from("locations")
      .insert([
        {
          coordinates: `POINT(${coordinates[0]} ${coordinates[1]})`,
          block,
          lot,
        },
      ])
      .select();

    if (error) {
      console.error("Error adding lot:", error);
      alert("An error occurred while adding the lot.");
    } else {
      console.log("Lot added successfully:", data);
      alert("Lot added successfully!");
    }
  } else {
    alert("Block number and lot number are required!");
  }
};

// ===== EVENT HANDLERS =====

/**
 * Gère le clic sur un marqueur pour afficher les profils associés.
 */
export const handleMarkerClick = async (
  feature: Feature,
  supabase: any,
  setAssociatedProfiles: (profiles: any[]) => void,
  setIsModalOpen: (isOpen: boolean) => void
) => {
  console.log("handleMarkerClick called");
  const locationId = feature.get("id");

  const { data, error } = await supabase
    .from("profile_location_associations")
    .select("profile_id, profiles(*)")
    .eq("location_id", locationId)
    .eq("is_verified", true);

  if (!error && data) {
    console.log("Associated profiles retrieved:", data);
    setAssociatedProfiles(data.map((item: any) => item.profiles));
    setIsModalOpen(true);
    console.log("isModalOpen updated:", true);
  } else {
    console.error("Error retrieving associated profiles:", error);
  }
};

// ===== MAP SETUP =====

/**
 * Configure l'écouteur pour ajouter un lot à la carte.
 */
export const setupLotAdding = (
  map: Map,
  isAddingLot: boolean,
  setIsAddingLot: (value: boolean) => void,
  supabase: any
) => {
  map.on("click", (event) => {
    if (isAddingLot) {
      const coordinates = toLonLat(event.coordinate);
      handleAddLot(coordinates, supabase);
      setIsAddingLot(false);
    }
  });
};

/**
 * Calcule les positions des marqueurs alignés entre deux points.
 */
const calculateAlignedMarkers = (
  start: number[],
  end: number[],
  count = 0
): number[][] => {
  const markers = [start];
  if (count > 0) {
    for (let i = 1; i <= count; i++) {
      const fraction = i / (count + 1);
      markers.push([
        start[0] + (end[0] - start[0]) * fraction,
        start[1] + (end[1] - start[1]) * fraction,
      ]);
    }
  }
  markers.push(end);
  return markers;
};

/**
 * Ajoute les marqueurs alignés à la base de données.
 */
const addMarkersToMap = async (
  coordinates: number[][],
  block: string,
  startLot: number,
  increment: number,
  startOffset: number,
  supabase: any,
  fetchLocations: () => void
) => {
  for (let i = 0; i < coordinates.length; i++) {
    const lotNumber = startLot + i * increment + i * startOffset;
    const { error } = await supabase.from("locations").insert([
      {
        coordinates: `POINT(${coordinates[i][0]} ${coordinates[i][1]})`,
        block: block,
        lot: lotNumber.toString(),
      },
    ]);

    if (error) {
      console.error("Erreur lors de l'ajout du marqueur :", error);
    }
  }
  fetchLocations();
};

/**
 * Configure l'ajout de marqueurs alignés sur la carte.
 */
export const setupAlignedMarkers = (
  map: Map,
  isAddingAlignedMarkers: boolean,
  setIsAddingAlignedMarkers: (value: boolean) => void,
  vectorSource: VectorSource,
  supabase: any,
  fetchLocations: () => void
) => {
  let markerPositions: number[][] = [];

  map.on("click", (event) => {
    if (isAddingAlignedMarkers) {
      const coordinates = toLonLat(event.coordinate);

      // Add temporary visual feedback
      const tempMarker = new Feature({
        geometry: new Point(fromLonLat(coordinates)),
        type: "temp",
      });
      tempMarker.setStyle(
        new Style({
          image: new Icon({
            src: "/temp-marker.png",
            scale: 0.5,
            anchor: [0.5, 1],
          }),
        })
      );
      vectorSource.addFeature(tempMarker);

      markerPositions.push(coordinates);

      if (markerPositions.length === 1) {
        alert("Click on the end point");
      } else if (markerPositions.length === 2) {
        const markerCount = prompt(
          "How many markers do you want to add between these two points? (0 for start and end only)",
          "0"
        );

        const count = Math.max(0, parseInt(markerCount || "0", 10));
        const block = prompt("Enter block number:");
        const startLot = prompt("Enter starting lot number:");
        const incrementType = prompt(
          "Choose increment type:\n1. One by one\n2. Two by two (even)\n3. Two by two (odd)",
          "1"
        );

        if (block && startLot && !isNaN(parseInt(startLot)) && incrementType) {
          const startNumber = parseInt(startLot);
          let increment = 1;
          let startOffset = 0;

          if (incrementType === "2") {
            increment = 2;
            startOffset = startNumber % 2 === 0 ? 0 : 1; // For even numbers
          } else if (incrementType === "3") {
            increment = 2;
            startOffset = startNumber % 2 === 1 ? 0 : 1; // For odd numbers
          }

          const markers = calculateAlignedMarkers(
            markerPositions[0],
            markerPositions[1],
            count
          );
          addMarkersToMap(
            markers,
            block,
            startNumber,
            increment,
            startOffset,
            supabase,
            fetchLocations
          );
        } else {
          alert("All information is required and must be valid!");
        }
      } else {
        alert("Please enter a valid number");
      }

      // Clear temporary markers
      vectorSource.clear();
      setIsAddingAlignedMarkers(false);
      markerPositions = [];
    }
  });
};

// ===== UTILITIES =====

/**
 * Détermine le type d'appareil en fonction de la largeur d'écran.
 */
export const getDeviceType = (): string => {
  const screenWidth = window.innerWidth;
  if (screenWidth < 768) return "smartphone";
  if (screenWidth < 1024) return "tablet";
  return "laptop";
};

/**
 * Détermine le niveau de zoom approprié en fonction du type d'appareil.
 */
export const getZoomLevel = (deviceType: string): number => {
  switch (deviceType) {
    case "smartphone":
      return 16;
    case "tablet":
      return 17.2;
    default:
      return 17;
  }
};

/**
 * Initialise la carte OpenLayers.
 */
export const initializeMap = (
  mapTargetId: string,
  initialPosition: number[],
  blocksSource: VectorSource,
  vectorSource: VectorSource,
  locationsSource: VectorSource,
  isAddingLot: boolean,
  isAddingAlignedMarkers: boolean,
  handleFeatureClick: (feature: Feature) => void
): Map => {
  const deviceType = getDeviceType();
  const zoomLevel = getZoomLevel(deviceType);

  const map = new Map({
    target: mapTargetId,
    layers: [
      new TileLayer({ source: new OSM() }),
      new VectorLayer({ source: blocksSource }),
      new VectorLayer({ source: vectorSource }),
      new VectorLayer({ source: locationsSource }),
    ],
    view: new View({
      center: fromLonLat(initialPosition),
      zoom: zoomLevel,
    }),
  });

  // Setup zoom listener
  map.getView().on("change:resolution", () => 
    updateAllFeatureStyles(map, vectorSource, locationsSource)
  );

  // Setup click listener
  map.on("click", (event) => {
    if (isAddingLot || isAddingAlignedMarkers) return;

    const feature = map.forEachFeatureAtPixel(
      event.pixel,
      (feature) => (feature instanceof Feature ? feature : null),
      {
        layerFilter: (layer) => layer instanceof VectorLayer,
      }
    );

    if (feature && feature.get("type") === "location") {
      handleFeatureClick(feature);
    }
  });

  return map;
};

/**
 * Configure les fonctionnalités de la carte.
 */
export const setupMapFeatures = (
  map: Map,
  blocks: any[],
  publicPois: any[],
  blocksSource: VectorSource,
  vectorSource: VectorSource,
  locationsSource: VectorSource,
  role: string | null,
  isAddingLot: boolean,
  setIsAddingLot: (value: boolean) => void,
  isAddingAlignedMarkers: boolean,
  setIsAddingAlignedMarkers: (value: boolean) => void,
  supabase: any,
  onMarkersAdded: () => void
): void => {
  // Add blocks
  blocks.forEach((block) =>
    addBlockToMap(block, blocksSource, setBlockStyle)
  );

  // Add public POIs
  addPublicPoisToMap(publicPois, vectorSource);

  // Setup admin features
  if (role === "admin") {
    setupLotAdding(map, isAddingLot, setIsAddingLot, supabase);
    setupAlignedMarkers(
      map,
      isAddingAlignedMarkers,
      setIsAddingAlignedMarkers,
      vectorSource,
      supabase,
      onMarkersAdded
    );
  }

  // Initial style update
  updateAllFeatureStyles(map, vectorSource, locationsSource);
};

/**
 * Nettoie la carte en supprimant sa cible.
 */
export const cleanupMap = (map: Map): void => {
  map.setTarget(undefined);
};
