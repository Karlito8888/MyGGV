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
import { MdCenterFocusStrong } from "react-icons/md";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import "./openLayerMap.css";
import ggvLogo from "../assets/img/ggv.png";
import { blocks } from "../data/blocks";
import { Draw } from "ol/interaction";
import { publicPois } from "../data/public-pois";

const initialPosition = fromLonLat([120.95134859887523, 14.347872973134175]);

function MapView() {
  const mapRef = useRef<Map | null>(null);
  const [vectorSource] = useState(new VectorSource()); // Source pour les POI
  const [clickedFeature, setClickedFeature] = useState<Feature | null>(null);
  const { role } = useAuth(); // Récupérer le rôle de l'utilisateur
  const [blocksSource] = useState(new VectorSource());

  const handleRecenter = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      view.setCenter(initialPosition);
      view.setZoom(16.3);
    }
  };

  const addPoiToMap = (
    longitude: number,
    latitude: number,
    name: string,
    description?: string
  ) => {
    console.log("Adding POI to map:", {
      longitude,
      latitude,
      name,
      description,
    });

    const feature = new Feature({
      geometry: new Point(fromLonLat([longitude, latitude])),
      name: name,
      description: description || "No description",
    });

    feature.setStyle(
      new Style({
        image: new Icon({
          src: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
          scale: 1,
        }),
      })
    );

    vectorSource.addFeature(feature);
  };

  const handleRightClick = async (event: any) => {
    event.preventDefault(); // Empêcher le menu contextuel par défaut

    // Vérifier si l'utilisateur est admin
    if (role !== "admin") {
      return;
    }

    if (mapRef.current) {
      // Récupérer les coordonnées du clic
      const coordinates = mapRef.current.getEventCoordinate(event);
      const [longitude, latitude] = toLonLat(coordinates);

      // Afficher les coordonnées dans la console
      console.log("Coordonnées du clic droit :", {
        longitude: longitude.toFixed(6),
        latitude: latitude.toFixed(6),
      });

      // Demander le nom du POI (description optionnelle)
      const name = prompt("Enter the name of the POI:");
      if (!name) {
        alert("Name is required!");
        return;
      }

      const description =
        prompt("Enter the description of the POI (optional):") || undefined;

      // Envoyer les données à Supabase
      const { data, error } = await supabase
        .from("poi")
        .insert([{ name, description, longitude, latitude }])
        .select();

      if (error) {
        console.error("Error adding POI to database:", error);
        alert("Failed to add POI. Check the console for details.");
      } else if (data) {
        // Ajouter le POI à la carte
        addPoiToMap(longitude, latitude, name, description);
        console.log("POI added successfully:", data);
        alert("POI added successfully!");
      }
    }
  };

  // Ajouter cette fonction utilitaire
  function setBlockStyle(feature: Feature, color: string, name: string) {
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
  }

  const addBlockToMap = (block: (typeof blocks)[0]) => {
    const feature = new Feature({
      geometry: new Polygon([block.coords]).transform("EPSG:4326", "EPSG:3857"),
      name: block.name,
      type: "block",
    });

    // Utiliser la fonction utilitaire
    setBlockStyle(feature, block.color, block.name);

    blocksSource.addFeature(feature);
  };

  const addPublicPoisToMap = () => {
    const features: Feature[] = []; // Stocker les features pour pouvoir les mettre à jour plus tard

    publicPois.forEach((poi) => {
      console.log("Loading POI:", poi.name, "with icon:", poi.icon);
      const feature = new Feature({
        geometry: new Point(fromLonLat(poi.coords)),
        name: poi.name,
        type: "public",
        icon: poi.icon, // Stocker l'icône dans les propriétés du feature
      });

      // Créer un style avec une échelle de base plus petite
      const createIconStyle = (scale: number) =>
        new Style({
          image: new Icon({
            src: poi.icon,
            scale: scale,
            anchor: [0.5, 1],
            anchorXUnits: "fraction",
            anchorYUnits: "fraction",
            crossOrigin: "anonymous",
          }),
        });

      // Appliquer le style initial avec une petite échelle
      feature.setStyle(createIconStyle(0.5));

      // Ajouter le feature à la source et à notre tableau
      vectorSource.addFeature(feature);
      features.push(feature);
    });

    return features;
  };

  // Ajout de la fonction pour afficher le zoom
  const logCurrentZoom = () => {
    if (role === "admin" && mapRef.current) {
      // Vérifier si l'utilisateur est admin
      const currentZoom = mapRef.current.getView().getZoom();
      console.log(`Current zoom level: ${currentZoom}`);
    }
  };

  useEffect(() => {
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    const blocksLayer = new VectorLayer({
      source: blocksSource,
    });

    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        blocksLayer,
        vectorLayer,
      ],
      view: new View({
        center: initialPosition,
        zoom: 16.3,
      }),
    });

    // Ajouter tous les blocks à la carte
    blocks.forEach(addBlockToMap);

    // Ajouter les POIs publics et récupérer les features
    const poiFeatures = addPublicPoisToMap();

    // Fonction pour mettre à jour l'échelle des icônes
    const updateIconScales = () => {
      const zoom = map.getView().getZoom() || 16;
      const newScale = 0.5 + Math.max(0, zoom - 16) * 0.4;

      poiFeatures.forEach((feature) => {
        const createIconStyle = (scale: number) =>
          new Style({
            image: new Icon({
              src: feature.get("icon"), // Utiliser l'icône stockée dans le feature
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

    // Ajouter l'écouteur de zoom
    map.getView().on("change:resolution", updateIconScales);

    // Ajouter l'interaction de dessin uniquement pour les admins
    if (role === "admin") {
      const draw = new Draw({
        source: blocksSource,
        type: "Polygon",
      });

      draw.on("drawend", (event) => {
        const polygon = event.feature.getGeometry() as Polygon;
        const coordinates = polygon.getCoordinates();
        const blockName = prompt("Entrez le nom du block :");

        if (blockName) {
          event.feature.set("name", blockName);
          event.feature.set("type", "block");

          // Utiliser la fonction utilitaire
          setBlockStyle(event.feature, "#FF0000", blockName);

          console.log("Nouveau block créé :", {
            name: blockName,
            coords: coordinates[0].map((coord) => toLonLat(coord)),
          });
        } else {
          blocksSource.removeFeature(event.feature);
          alert("Le nom du block est requis !");
        }
      });

      map.addInteraction(draw);
    }

    // Gestion du clic gauche sur les marqueurs
    map.on("click", (event) => {
      const feature = map.forEachFeatureAtPixel(
        event.pixel,
        (feature) => feature
      );
      if (feature && feature instanceof Feature) {
        setClickedFeature(feature);
        const coordinates = (feature.getGeometry() as Point).getCoordinates();
        const name = feature.get("name");
        const description = feature.get("description");
        console.log(`Clicked on ${name}: ${description} at ${coordinates}`);
      } else {
        setClickedFeature(null);
      }
    });

    // Gestion du clic droit pour ajouter un POI
    map.getViewport().addEventListener("contextmenu", handleRightClick);

    // Ajouter le listener uniquement si l'utilisateur est admin
    if (role === "admin") {
      map.getView().on("change:resolution", () => {
        logCurrentZoom();
      });
    }

    mapRef.current = map;

    return () => {
      map.getView().un("change:resolution", updateIconScales); // Nettoyer l'écouteur
      map.getViewport().removeEventListener("contextmenu", handleRightClick);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [vectorSource, blocksSource, role]);

  useEffect(() => {
    if (mapRef.current) {
      const map = mapRef.current;
      map.on("click", (event) => {
        const feature = map.forEachFeatureAtPixel(
          event.pixel,
          (feature) => feature
        );
        if (feature && feature.get("type") === "block") {
          const blockName = feature.get("name");
          const coordinates = (
            feature.getGeometry() as Polygon
          ).getCoordinates();
          console.log(`Clicked on block ${blockName}`, coordinates);
          // Vous pouvez afficher une popup ou effectuer d'autres actions ici
        }
      });
    }
  }, []);

  return (
    <div className="map-container">
      <div id="map" className="map" />
      <div className="controls">
        <button onClick={handleRecenter} className="recenter-button">
          <MdCenterFocusStrong className="recenter-icon" />
        </button>
      </div>
      {clickedFeature && (
        <div className="popup">
          <h3>{clickedFeature.get("name")}</h3>
          <p>{clickedFeature.get("description")}</p>
        </div>
      )}
      <img src={ggvLogo} alt="GGV Logo" className="map-logo" />
    </div>
  );
}

export default MapView;
