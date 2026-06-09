# SmartIndustrial – Asset Intelligence Platform

Plateforme de gestion d'équipements industriels avec suivi des pannes, demandes de pièces détachées et dashboard analytics.

## 🚀 Démarrage rapide

### Option 1: Docker Compose (recommandé)
```bash
docker-compose up -d
```
Puis accéder à: http://localhost:3000

### Option 2: Manuel

**Backend:**
```bash
cd backend
cp .env.example .env
# Modifier DATABASE_URL et JWT_SECRET dans .env
npm install
npm run seed   # données de test
npm start
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## 🔑 Compte de test
- Email: `admin@techcorp.com`
- Mot de passe: `admin123`

## 📋 Fonctionnalités

✅ Authentification JWT (login/register)  
✅ Gestion des équipements (CRUD + photos + QR code)  
✅ Déclaration de pannes avec photos  
✅ Workflow de suivi (Déclaré → Analyse → Inspection → Validation → Fabrication → Livraison → Clôturé)  
✅ Demandes de pièces détachées  
✅ Diagnostic IA simulé  
✅ Dashboard avec statistiques et graphiques  
✅ Notifications en temps réel  
✅ PWA (Progressive Web App)  
✅ Interface responsive mobile  

## 🏗️ Architecture

- **Backend**: Node.js / Express / PostgreSQL
- **Frontend**: React / Vite / TailwindCSS / Recharts
- **Auth**: JWT
- **Upload**: Multer (images)
- **Deploy**: Docker Compose

## 🗂️ Structure
```
smart-industrial/
├── backend/
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── models/db.js      # DB init & pool
│   │   ├── middleware/       # auth, upload
│   │   ├── routes/           # auth, equipment, breakdowns, spare-parts, dashboard, notifications
│   │   └── utils/seed.js     # Seed data
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── App.jsx           # Routes
│   │   ├── pages/            # Dashboard, Equipment, Breakdowns, SpareParts, Notifications
│   │   ├── components/       # Layout
│   │   └── context/          # AuthContext
│   └── Dockerfile
└── docker-compose.yml
```

## 🌍 API Endpoints

| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /api/auth/register | Créer compte + entreprise |
| POST | /api/auth/login | Connexion |
| GET | /api/equipment | Liste équipements |
| POST | /api/equipment | Créer équipement |
| GET | /api/breakdowns | Liste pannes |
| POST | /api/breakdowns | Déclarer panne |
| PATCH | /api/breakdowns/:id/status | Avancer workflow |
| GET | /api/spare-parts | Liste demandes |
| POST | /api/spare-parts | Créer demande |
| GET | /api/dashboard/stats | Stats analytics |
| GET | /api/notifications | Notifications |
