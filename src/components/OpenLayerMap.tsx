
import { useEffect, useRef, useState, useMemo } from "react";
import "ol/ol.css";
import { Map } from "ol";
import { fromLonLat } from "ol/proj";
import { Feature } from "ol";
import { Vector as VectorSource } from "ol/source";
import { MdCenterFocusStrong, MdAddLocation } from "react-icons/md";
import { useAuth } from "../hooks/useAuth";
import "./openLayerMap.css";
import ggvLogo from "../assets/img/ggv.png";
import { blocks } from "../data/blocks";
import { publicPois } from "../data/public-pois";
import { supabase } from "../lib/supabase";
import Modal from "react-modal";
import {
  handleMarkerClick,
  getDeviceType,
  getZoomLevel,
  fetchLocations,
  initializeMap,
  setupMapFeatures,
  cleanupMap
} from "../utils/mapUtils";

// ===== CONFIGURATION =====
Modal.setAppElement("#root");
const INITIAL_POSITION = [120.95134859887523, 14.347872973134175];

/**
 * Composant principal de la carte OpenLayers
 */
function MapView() {
  // ===== REFS & SOURCES =====
  const mapRef = useRef<Map | null>(null);
  const vectorSource = useMemo(() => new VectorSource(), []);
  const blocksSource = useMemo(() => new VectorSource(), []);
  const locationsSource = useMemo(() => new VectorSource(), []);
  
  // ===== STATE =====
  const [isAddingLot, setIsAddingLot] = useState(false);
  const [isAddingAlignedMarkers, setIsAddingAlignedMarkers] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [associatedProfiles, setAssociatedProfiles] = useState<any[]>([]);
  const [shouldFetchLocations, setShouldFetchLocations] = useState(true);
  
  // ===== HOOKS =====
  const { role } = useAuth();

  // ===== HANDLERS =====
  /**
   * Recentre la carte sur la position initiale
   */
  const handleRecenter = () => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      const deviceType = getDeviceType();
      const zoomLevel = getZoomLevel(deviceType);
      view.setCenter(fromLonLat(INITIAL_POSITION));
      view.setZoom(zoomLevel);
    }
  };

  /**
   * Gère le clic sur une feature de la carte
   */
  const handleFeatureClick = (feature: Feature) => {
    console.log("Location feature clicked:", feature.get("id"));
    handleMarkerClick(
      feature,
      supabase,
      setAssociatedProfiles,
      setIsModalOpen
    );
  };

  // ===== EFFECTS =====
  /**
   * Récupère les emplacements depuis Supabase
   */
  useEffect(() => {
    if (shouldFetchLocations) {
      console.log("Fetching locations...");
      fetchLocations(supabase, locationsSource);
      setShouldFetchLocations(false);
    }
  }, [shouldFetchLocations, locationsSource]);

  /**
   * Initialise la carte et configure ses fonctionnalités
   */
  useEffect(() => {
    // Initialisation de la carte
    const map = initializeMap(
      "map",
      INITIAL_POSITION,
      blocksSource,
      vectorSource,
      locationsSource,
      isAddingLot,
      isAddingAlignedMarkers,
      handleFeatureClick
    );
    
    // Configuration des fonctionnalités
    setupMapFeatures(
      map,
      blocks,
      publicPois,
      blocksSource,
      vectorSource,
      locationsSource,
      role,
      isAddingLot,
      setIsAddingLot,
      isAddingAlignedMarkers,
      setIsAddingAlignedMarkers,
      supabase,
      () => setShouldFetchLocations(true)
    );

    mapRef.current = map;

    // Nettoyage lors du démontage
    return () => {
      if (map) {
        cleanupMap(map);
        mapRef.current = null;
      }
    };
  }, [vectorSource, blocksSource, locationsSource, role, isAddingLot, isAddingAlignedMarkers]);

  // ===== RENDER =====
  return (
    <div className="map-container">
      {/* Conteneur principal de la carte */}
      <div id="map" className="map" />
      
      {/* Contrôles de la carte */}
      <div className="controls">
        <button onClick={handleRecenter} className="recenter-button">
          <MdCenterFocusStrong className="recenter-icon" />
        </button>
        
        {/* Boutons d'administration */}
        {role === "admin" && (
          <>
            <button
              onClick={() => setIsAddingLot(!isAddingLot)}
              className={`draw-button ${isAddingLot ? "active" : ""}`}
            >
              <MdAddLocation />
              {isAddingLot ? "Cancel Adding" : "Add Lot"}
            </button>
            <button
              onClick={() => setIsAddingAlignedMarkers(!isAddingAlignedMarkers)}
              className={`draw-button ${
                isAddingAlignedMarkers ? "active" : ""
              }`}
            >
              {isAddingAlignedMarkers ? "Cancel" : "Add Aligned Markers"}
            </button>
          </>
        )}
      </div>
      
      {/* Logo */}
      <img src={ggvLogo} alt="GGV Logo" className="map-logo" />

      {/* Modal des profils associés */}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="modal"
        overlayClassName="modal-overlay"
      >
        <div className="modal-header">
          <h2>Associated Profiles</h2>
          <button
            onClick={() => setIsModalOpen(false)}
            className="close-button"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {associatedProfiles.length > 0 ? (
          <ul className="profile-list">
            {associatedProfiles.map((profile) => (
              <li key={profile.id} className="profile-item">
                <div className="profile-info">
                  <h3>{profile.display_name}</h3>
                  <p>{profile.occupation}</p>
                </div>
                <a
                  href={`/profile/${profile.id}`}
                  className="profile-link"
                  rel="noopener noreferrer"
                >
                  View Profile
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-profiles">
            No profiles associated with this location.
          </p>
        )}
      </Modal>
    </div>
  );
}

export default MapView;
