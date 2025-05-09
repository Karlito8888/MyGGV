// Ce fichier gère l'enregistrement du service worker et la détection des mises à jour

export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = '/sw.js'; // Généré par vite-plugin-pwa
      
      navigator.serviceWorker.register(swUrl)
        .then(registration => {
          // Vérifier les mises à jour lors de l'enregistrement
          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }
            
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Une nouvelle version est disponible
                  console.log('New content is available; please refresh.');
                  
                  // Déclencher un événement personnalisé pour notifier l'application
                  window.dispatchEvent(
                    new CustomEvent('sw-update-found', { detail: { worker: installingWorker } })
                  );
                } else {
                  // Première installation
                  console.log('Content is cached for offline use.');
                }
              }
            };
          };
          
          // Vérifier périodiquement les mises à jour
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000); // Vérifier toutes les heures
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
}

// Fonction pour désinscrire le service worker
export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}