# DocSecur Frontend

Interface React/Vite du projet `DocSecur`.

## Modules disponibles

- Authentification et routage par rôle
- Dashboard administrateur
- Dashboard médecin
- Dashboard patient
- Dashboard pharmacien
- Dashboard laborantin
- Téléconsultation avec intégration Jitsi
- Messagerie, notifications et profil
- Multilingue `fr`, `en`, `wo`
- PWA / service worker

## Stack

- React 19
- Vite 7
- React Router
- Axios
- React Query
- Tailwind CSS
- i18next
- Recharts

## Installation

```bash
npm install
```

## Lancement local

```bash
npm run dev
```

Build production :

```bash
npm run build
```

## Configuration

Le frontend consomme l'API via :

```txt
VITE_API_URL=http://localhost:8000/api
```

À définir dans un fichier `.env` frontend si nécessaire.

## Organisation rapide

- `src/api/` : appels HTTP par domaine
- `src/components/` : écrans métier
- `src/pages/` : dashboards
- `src/context/` : auth et cache
- `src/hooks/` : hooks réutilisables
- `src/locales/` : traductions

## Vérifications utiles

```bash
npm run build
```

Points validés :

- compilation TypeScript
- build Vite
- intégration des routes par rôle
- pages pharmacien, laborantin, patient et téléconsultation raccordées à l'API

## Remarques soutenance

- Les téléconsultations patient utilisent maintenant les données API au lieu d'une liste de démonstration en dur.
- Le dashboard laborantin affiche désormais des statistiques et demandes réelles.
- Le bundle reste volumineux en production ; une optimisation par code splitting pourra être faite après la soutenance.
