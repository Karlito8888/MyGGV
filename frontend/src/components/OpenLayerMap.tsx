import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import { Point, Polygon } from "ol/geom";
import { Feature } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon, Fill, Stroke, Text } from "ol/style";
import { MdCenterFocusStrong, MdAddLocation } from "react-icons/md";
import { useAuth } from "../hooks/useAuth";
import "./openLayerMap.css";
import ggvLogo from "../assets/img/ggv.png";
import { blocks } from "../data/blocks";
import { publicPois } from "../data/public-pois";
import { supabase } from "../lib/supabase";
import { MapBrowserEvent } from "ol";

const INITIAL_POSITION = fromLonLat([120.95134859887523, 14.347872973134175]);

function MapView() {
  const mapRef = useRef<Map | null>(null);
  const [vectorSource] = useState(new VectorSource());
  const [blocksSource] = useState(new VectorSource());
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [isAddingAlignedMarkers, setIsAddingAlignedMarkers] = useState(false);
  const { role } = useAuth();
  const [locations, setLocations] = useState<Feature[]>([]);

  const handleRecenter = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      view.setCenter(INITIAL_POSITION);
      view.setZoom(16.3);
    }
  };

  const setBlockStyle = (feature: Feature, color: string, name: string) => {
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

  const addBlockToMap = (block: (typeof blocks)[0]) => {
    const feature = new Feature({
      geometry: new Polygon([block.coords]).transform("EPSG:4326", "EPSG:3857"),
      name: block.name,
      type: "block",
    });
    setBlockStyle(feature, block.color, block.name);
    blocksSource.addFeature(feature);
  };

  const addPublicPoisToMap = () => {
    const features: Feature[] = [];
    publicPois.forEach((poi) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat(poi.coords)),
        name: poi.name,
        type: "public",
        icon: poi.icon,
      });
      feature.setStyle(createIconStyle(poi.icon, 0.5));
      vectorSource.addFeature(feature);
      features.push(feature);
    });
    return features;
  };

  const createIconStyle = (icon: string, scale: number) => {
    return new Style({
      image: new Icon({
        src: icon,
        scale: scale,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        crossOrigin: "anonymous",
      }),
    });
  };

  const cleanupMap = (map: Map) => {
    map.setTarget(undefined);
    mapRef.current = null;
  };

  const setupZoomListener = (map: Map, poiFeatures: Feature[]) => {
    const updateIconScales = () => {
      const zoom = map.getView().getZoom() || 16;
      const newScale = 0.5 + Math.max(0, zoom - 16) * 0.4;

      poiFeatures.forEach((feature) => {
        const createIconStyle = (scale: number) =>
          new Style({
            image: new Icon({
              src: feature.get("icon"),
              scale: scale,
              anchor: [0.5, 1],
              anchorXUnits: "fraction",
              anchorYUnits: "fraction",
              crossOrigin: "anonymous",
            }),
          });
        feature.setStyle(createIconStyle(newScale));
      });
    };

    map.getView().on("change:resolution", updateIconScales);

    return updateIconScales;
  };

  const handleAddLot = async (coordinates: number[]) => {
    const block = prompt("Entrez le numéro du block :");
    const lot = prompt("Entrez le numéro du lot :");

    if (block && lot) {
      console.log("Données à insérer :", {
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
        console.error("Erreur lors de l'ajout du lot :", error);
        alert("Une erreur est survenue lors de l'ajout du lot.");
      } else {
        console.log("Lot ajouté avec succès :", data);
        alert("Lot ajouté avec succès !");
      }
    } else {
      alert("Le numéro du block et du lot sont requis !");
    }
  };

  const setupLotAdding = (map: Map) => {
    map.on("click", (event) => {
      if (isAddingLot) {
        const coordinates = toLonLat(event.coordinate);
        handleAddLot(coordinates);
        setIsAddingLot(false);
      }
    });
  };

  const fetchLocations = async () => {
    const { data, error } = await supabase.from("locations").select("*");
    console.log("Nombre de POI récupérés :", data?.length);

    if (error) {
      console.error("Erreur lors de la récupération des locations :", error);
      return;
    }

    const features = data.map((location) => {
      const coordinates = location.coordinates.coordinates;
      const feature = new Feature({
        geometry: new Point(fromLonLat(coordinates)),
        block: location.block,
        lot: location.lot,
        type: "location",
        id: location.id,
        marker_url: location.marker_url,
      });
      feature.setStyle(createMarkerStyle(location.marker_url));
      return feature;
    });

    setLocations(features);
  };

  const createMarkerStyle = (markerUrl: string) => {
    return new Style({
      image: new Icon({
        src: markerUrl,
        scale: 0.5,
        anchor: [0.5, 1],
        anchorXUnits: "fraction",
        anchorYUnits: "fraction",
        crossOrigin: "anonymous",
      }),
    });
  };

  const handleMarkerClick = async (feature: Feature) => {
    if (role === "admin") {
      const locationId = feature.get("id");
      const currentBlock = feature.get("block");
      const currentLot = feature.get("lot");
      const currentMarker = feature.get("marker_url");

      const action = prompt(
        `Block: ${currentBlock}, Lot: ${currentLot}\nMarqueur actuel: ${currentMarker}\n\nQue souhaitez-vous faire ?\n1. Mettre à jour\n2. Supprimer\n3. Changer le marqueur\n\nEntrez 1, 2 ou 3`
      );

      if (action === "1") {
        const newBlock = prompt(
          "Entrez le nouveau numéro de block :",
          currentBlock
        );
        const newLot = prompt("Entrez le nouveau numéro de lot :", currentLot);

        if (newBlock && newLot) {
          const { error } = await supabase
            .from("locations")
            .update({ block: newBlock, lot: newLot })
            .eq("id", locationId);

          if (!error) {
            // Mettre à jour le marqueur sur la carte
            feature.set("block", newBlock);
            feature.set("lot", newLot);
            alert("Marqueur mis à jour avec succès !");
          } else {
            console.error("Erreur lors de la mise à jour du marqueur :", error);
            alert(
              "Une erreur est survenue lors de la mise à jour du marqueur."
            );
          }
        } else {
          alert("Le numéro de block et de lot sont requis !");
        }
      } else if (action === "2") {
        const confirmDelete = window.confirm(
          "Êtes-vous sûr de vouloir supprimer ce marqueur ?"
        );

        if (confirmDelete) {
          const { error } = await supabase
            .from("locations")
            .delete()
            .eq("id", locationId);

          if (!error) {
            // Supprimer le marqueur de la carte
            setLocations((prev) =>
              prev.filter((loc) => loc.get("id") !== locationId)
            );
            alert("Marqueur supprimé avec succès !");
          } else {
            console.error("Erreur lors de la suppression du marqueur :", error);
            alert(
              "Une erreur est survenue lors de la suppression du marqueur."
            );
          }
        }
      } else if (action === "3") {
        const newMarker = prompt(
          "Entrez le nouveau marqueur (ex: /temp-marker.png) :",
          currentMarker
        );

        if (newMarker) {
          const { error } = await supabase
            .from("locations")
            .update({ marker_url: newMarker })
            .eq("id", locationId);

          if (!error) {
            // Mettre à jour le marqueur sur la carte
            feature.set("marker_url", newMarker);
            feature.setStyle(createMarkerStyle(newMarker));
            alert("Marqueur changé avec succès !");
          } else {
            console.error("Erreur lors du changement du marqueur :", error);
            alert("Une erreur est survenue lors du changement du marqueur.");
          }
        } else {
          alert("Le chemin du marqueur est requis !");
        }
      }
    }
  };

  const setupAlignedMarkers = (map: Map) => {
    let markerPositions: number[][] = [];

    map.on("click", (event) => {
      if (isAddingAlignedMarkers) {
        const coordinates = toLonLat(event.coordinate);

        // Ajouter un feedback visuel temporaire
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
          alert("Cliquez sur le point d'arrivée");
        } else if (markerPositions.length === 2) {
          const markerCount = prompt(
            "Combien de marqueurs souhaitez-vous ajouter entre ces deux points ? (0 pour seulement le départ et l'arrivée)",
            "0"
          );

          const count = Math.max(0, parseInt(markerCount || "0", 10));

          if (!isNaN(count)) {
            const block = prompt("Entrez le numéro du block :");
            const startLot = prompt("Entrez le numéro de lot de départ :");
            const incrementType = prompt(
              "Choisissez le type d'incrément :\n1. 1 par 1\n2. 2 par 2 (pairs)\n3. 2 par 2 (impairs)",
              "1"
            );

            if (
              block &&
              startLot &&
              !isNaN(parseInt(startLot)) &&
              incrementType
            ) {
              const startNumber = parseInt(startLot);
              let increment = 1;
              let startOffset = 0;

              if (incrementType === "2") {
                increment = 2;
                startOffset = startNumber % 2 === 0 ? 0 : 1; // Pour les pairs
              } else if (incrementType === "3") {
                increment = 2;
                startOffset = startNumber % 2 === 1 ? 0 : 1; // Pour les impairs
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
                startOffset
              );
            } else {
              alert(
                "Toutes les informations sont requises et doivent être valides !"
              );
            }
          } else {
            alert("Veuillez entrer un nombre valide");
          }

          // Nettoyer les marqueurs temporaires
          vectorSource.clear();
          setIsAddingAlignedMarkers(false);
          markerPositions = [];
        }
      }
    });
  };

  const calculateAlignedMarkers = (
    start: number[],
    end: number[],
    count = 0
  ) => {
    const markers = [];
    // Ajouter le premier point
    markers.push(start);

    // Ajouter les points intermédiaires seulement si count > 0
    if (count > 0) {
      for (let i = 1; i <= count; i++) {
        const fraction = i / (count + 1);
        const lon = start[0] + (end[0] - start[0]) * fraction;
        const lat = start[1] + (end[1] - start[1]) * fraction;
        markers.push([lon, lat]);
      }
    }

    // Ajouter le dernier point
    markers.push(end);
    return markers;
  };

  const addMarkersToMap = async (
    coordinates: number[][],
    block: string,
    startLot: number,
    increment: number,
    startOffset: number
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
    fetchLocations(); // Rafraîchir les marqueurs affichés
  };

  useEffect(() => {
    const map = initializeMap();
    const updateIconScales = setupMapInteractions(map);
    fetchLocations();
    return () => {
      if (map) {
        map.getView().un("change:resolution", updateIconScales);
        cleanupMap(map);
      }
    };
  }, [vectorSource, blocksSource, role, isAddingLot, isAddingAlignedMarkers]);

  useEffect(() => {
    if (mapRef.current) {
      const locationLayer = new VectorLayer({
        source: new VectorSource({
          features: locations,
        }),
      });
      mapRef.current.addLayer(locationLayer);
    }
  }, [locations]);

  const setupMapInteractions = (map: Map) => {
    blocks.forEach(addBlockToMap);
    const poiFeatures = addPublicPoisToMap();
    const updateIconScales = setupZoomListener(map, poiFeatures);
    if (role === "admin") {
      setupLotAdding(map);
      setupAlignedMarkers(map);
    }
    setupClickListeners(map);
    return updateIconScales;
  };

  const initializeMap = () => {
    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({ source: new OSM() }),
        new VectorLayer({ source: blocksSource }),
        new VectorLayer({ source: vectorSource }),
      ],
      view: new View({
        center: INITIAL_POSITION,
        zoom: 16.3,
      }),
    });
    mapRef.current = map;
    return map;
  };

  const setupClickListeners = (map: Map) => {
    map.on("click" as any, (event: MapBrowserEvent<UIEvent>) => {
      const feature = map.forEachFeatureAtPixel(event.pixel, (feature) => {
        if (feature instanceof Feature) {
          return feature;
        }
        return null;
      });

      if (feature && feature.get("type") === "location" && role === "admin") {
        handleMarkerClick(feature);
      }
    });

    // Ajouter l'écouteur pour le clic droit
    map.on("contextmenu" as any, (event: MapBrowserEvent<UIEvent>) => {
      const coordinates = toLonLat(event.coordinate);
      console.log("Coordonnées du clic droit :", coordinates);
    });

    if (role === "admin") {
      map.getView().on("change:resolution", () => {
        logCurrentZoom();
      });
    }
  };

  const logCurrentZoom = () => {
    if (role === "admin" && mapRef.current) {
      const currentZoom = mapRef.current.getView().getZoom();
      console.log(`Current zoom level: ${currentZoom}`);
    }
  };

  return (
    <div className="map-container">
      <div id="map" className="map" />
      <div className="controls">
        <button onClick={handleRecenter} className="recenter-button">
          <MdCenterFocusStrong className="recenter-icon" />
        </button>
        {role === "admin" && (
          <>
            <button
              onClick={() => setIsAddingLot(!isAddingLot)}
              className={`draw-button ${isAddingLot ? "active" : ""}`}
            >
              <MdAddLocation />
              {isAddingLot ? "Annuler l'ajout" : "Ajouter un lot"}
            </button>
            <button
              onClick={() => setIsAddingAlignedMarkers(!isAddingAlignedMarkers)}
              className={`draw-button ${
                isAddingAlignedMarkers ? "active" : ""
              }`}
            >
              {isAddingAlignedMarkers
                ? "Annuler"
                : "Ajouter des marqueurs alignés"}
            </button>
          </>
        )}
      </div>
      <img src={ggvLogo} alt="GGV Logo" className="map-logo" />
    </div>
  );
}

export default MapView;
