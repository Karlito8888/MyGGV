import { useState, useEffect } from 'react';
import './installPrompt.css';

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome from automatically showing the dialog
      e.preventDefault();
      // Store the event for later use
      setDeferredPrompt(e);
      // Show our custom prompt
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Display the installation dialog
    deferredPrompt.prompt();
    
    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    
    // You can use outcome for analytics or to adapt behavior
    console.log(`User ${outcome === 'accepted' ? 'accepted' : 'declined'} the installation`);
    
    // Reset the deferred event
    setDeferredPrompt(null);
    
    // Hide the prompt
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className="install-prompt">
      <p>Install MyGGV on your home screen for quick access!</p>
      <div className="prompt-buttons">
        <button onClick={handleInstallClick} className="install-button">Install</button>
        <button onClick={() => setShowPrompt(false)} className="dismiss-button">Later</button>
      </div>
    </div>
  );
}
