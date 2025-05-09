import { useState, useEffect } from 'react';
import './updatePrompt.css';

export function UpdatePrompt() {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    // Écouter les événements de mise à jour du service worker
    if ('serviceWorker' in navigator) {
      // Créer un événement personnalisé pour les mises à jour
      window.addEventListener('sw-update-found', (event) => {
        // @ts-ignore
        const { detail } = event;
        if (detail && detail.worker) {
          setWaitingWorker(detail.worker);
          setShowUpdatePrompt(true);
        }
      });
    }
  }, []);

  const handleUpdate = () => {
    if (waitingWorker) {
      // Envoyer un message au service worker pour qu'il s'active
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Recharger la page pour appliquer les mises à jour
      window.location.reload();
      setShowUpdatePrompt(false);
    }
  };

  if (!showUpdatePrompt) return null;

  return (
    <div className="update-prompt">
      <p>Une nouvelle version est disponible!</p>
      <div className="prompt-buttons">
        <button onClick={handleUpdate} className="update-button">Mettre à jour</button>
        <button onClick={() => setShowUpdatePrompt(false)} className="dismiss-button">Plus tard</button>
      </div>
    </div>
  );
}