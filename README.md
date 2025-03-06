# MyGGVapp

Une application web moderne utilisant la stack FARM (FastAPI, React, MongoDB) avec Vite.

## Fonctionnalités

- Authentification (email/mot de passe et OAuth)
- Espace utilisateur personnalisé
- Localisation avec Leaflet
- Espace jeux
- Chat en temps réel
- Forum de discussion
- Espace informations
- Interface d'administration
- Intégration de publicités

## Prérequis

- Python 3.12+
- Node.js 20+
- MongoDB

## Installation

1. Cloner le repository :

```bash
git clone <votre-repo>
cd MyGGVapp
```

2. Configuration du Backend :

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Sur Windows : .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Configuration du Frontend :

```bash
cd frontend
npm install
```

4. Configuration de l'environnement :

- Copier `backend/.env.example` vers `backend/.env`
- Modifier les variables d'environnement selon vos besoins

## Démarrage

1. Démarrer MongoDB :

```bash
sudo systemctl start mongodb  # Sur Linux
# ou
brew services start mongodb  # Sur macOS
# ou démarrer MongoDB selon votre installation
```

2. Démarrer le backend :

```bash
cd backend
source venv/bin/activate  # Sur Windows : .\venv\Scripts\activate
uvicorn main:app --reload
```

3. Démarrer le frontend :

```bash
cd frontend
npm run dev
```

L'application sera accessible aux adresses suivantes :

- Frontend : http://localhost:5173
- Backend : http://localhost:8000
- Documentation API : http://localhost:8000/docs

## Structure du projet

```
MyGGVapp/
├── backend/
│   ├── app/
│   │   ├── core/
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   └── services/
│   ├── tests/
│   ├── .env
│   ├── main.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
└── README.md
```

## Tests

### Backend

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
npm test
```

## Déploiement

Pour déployer l'application en production :

1. Configurer un serveur avec Python, Node.js et MongoDB
2. Cloner le repository sur le serveur
3. Suivre les étapes d'installation ci-dessus
4. Configurer un serveur web (nginx, apache) pour servir l'application
5. Configurer les variables d'environnement pour la production
6. Utiliser un gestionnaire de processus (PM2, Supervisor) pour gérer les processus

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Commiter vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## Support

Pour toute question ou problème, veuillez ouvrir une issue sur GitHub.
