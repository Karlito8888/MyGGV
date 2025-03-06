import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { fromLonLat, toLonLat } from "ol/proj";
import { Point } from "ol/geom";
import { Feature } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import { Style, Icon } from "ol/style";
import { MdCenterFocusStrong } from "react-icons/md";
import { supabase } from "../lib/supabase";
import { useAuth } from "../hooks/useAuth";
import "./openLayerMap.css";
import ggvLogo from "../assets/img/ggv.png";

const initialPosition = fromLonLat([120.95134859887523, 14.347872973134175]);

function MapView() {
  const mapRef = useRef<Map | null>(null);
  const [vectorSource] = useState(new VectorSource()); // Source pour les POI
  const [clickedFeature, setClickedFeature] = useState<Feature | null>(null);
  const { role } = useAuth(); // Récupérer le rôle de l'utilisateur

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

  useEffect(() => {
    const vectorLayer = new VectorLayer({
      source: vectorSource,
    });

    const map = new Map({
      target: "map",
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
        vectorLayer,
      ],
      view: new View({
        center: initialPosition,
        zoom: 16.3,
      }),
    });

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

    mapRef.current = map;

    return () => {
      map.getViewport().removeEventListener("contextmenu", handleRightClick);
      map.setTarget(undefined);
      mapRef.current = null;
    };
  }, [vectorSource, role]);

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
