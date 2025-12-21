# 🛡️ Garry - Votre assistant garanties

> Ne perdez plus jamais une garantie. Garry pense à vos garanties, pour que vous n'ayez pas à le faire.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: En développement](https://img.shields.io/badge/Status-En%20développement-yellow.svg)]()

## 🎯 Qu'est-ce que Garry ?

Garry est votre assistant personnel pour gérer toutes vos garanties et factures en un seul endroit. Simple, sécurisé et intelligent, Garry vous aide à :

- 📸 **Sauvegarder** vos factures en un clic
- 🔔 **Recevoir des rappels** avant expiration de vos garanties
- 🔐 **Protéger** vos données avec un stockage sécurisé
- ⏰ **Ne plus jamais** perdre un remboursement ou un échange

## 🏗️ Architecture

Garry est un monorepo composé de 4 applications :

```
apps/
├── api/          # API Rust/Axum - Gestion des garanties
├── auth/         # Service Go/Chi - Authentification
├── web/          # Frontend React/Vite/Tailwind
└── mobile/       # App Kotlin Multiplatform (iOS/Android)
```

### Stack technique

| Service | Technologie | Port |
|---------|-------------|------|
| API | Rust + Axum + SQLx | 8080 |
| Auth | Go + Chi + pgx | 8081 |
| Web | React + Vite + Tailwind | 3000 |
| Mobile | Kotlin Multiplatform + Compose | - |
| Base de données | PostgreSQL 16 | 5432 |

## 🚀 Démarrage rapide

### Prérequis

- Docker & Docker Compose
- (Optionnel) Node.js 20+ pour le développement web
- (Optionnel) Rust 1.82+ pour le développement API
- (Optionnel) Go 1.22+ pour le développement auth
- (Optionnel) Android Studio pour le développement mobile

### Lancer avec Docker

```bash
# Clone le repo
git clone https://github.com/duscraft/garry.git
cd garry

# Démarre tous les services
docker compose up -d

# Les services sont accessibles sur :
# - Web: http://localhost:3000
# - API: http://localhost:8080
# - Auth: http://localhost:8081
```

### Développement local

#### Web (React)

```bash
cd apps/web
npm install
npm run dev
```

#### API (Rust)

```bash
cd apps/api
cargo run
```

#### Auth (Go)

```bash
cd apps/auth
go run ./cmd/server
```

#### Mobile (Kotlin)

Ouvrir `apps/mobile` dans Android Studio.

### Variables d'environnement

| Variable | Description | Défaut |
|----------|-------------|--------|
| `DATABASE_URL` | URL PostgreSQL | `postgres://garry:garry@localhost:5432/garry` |
| `JWT_SECRET` | Secret JWT | `garry-dev-secret-change-in-production` |
| `PORT` | Port du service | Varie selon le service |
| `VITE_API_URL` | URL de l'API (web) | `http://localhost:8080/api/v1` |
| `VITE_AUTH_URL` | URL auth (web) | `http://localhost:8081/api/v1` |

## 📚 API Reference

### Auth Service (port 8081)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/v1/auth/register` | Inscription |
| POST | `/api/v1/auth/login` | Connexion |
| POST | `/api/v1/auth/refresh` | Rafraîchir le token |
| POST | `/api/v1/auth/logout` | Déconnexion |

### API Service (port 8080)

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/v1/warranties` | Liste des garanties |
| POST | `/api/v1/warranties` | Créer une garantie |
| GET | `/api/v1/warranties/:id` | Détail d'une garantie |
| PUT | `/api/v1/warranties/:id` | Modifier une garantie |
| DELETE | `/api/v1/warranties/:id` | Supprimer une garantie |
| GET | `/api/v1/warranties/stats` | Statistiques |
| GET | `/api/v1/warranties/expiring` | Garanties expirant bientôt |
| GET | `/api/v1/warranties/categories` | Liste des catégories |

## ✨ Fonctionnalités

### Implémentées

- ✅ Authentification JWT avec refresh token
- ✅ CRUD complet des garanties
- ✅ Calcul automatique de la date de fin
- ✅ Indicateurs visuels de statut (valide/expire bientôt/expirée)
- ✅ Dashboard avec statistiques
- ✅ Interface responsive web et mobile
- ✅ Support iOS et Android via Kotlin Multiplatform

### Prochaines fonctionnalités

- 🔜 Upload de photos/factures
- 🔜 Notifications push
- 🔜 OCR pour extraction automatique
- 🔜 Mode famille (partage)
- 🔜 Export PDF

## 🤝 Contribuer

Garry est en développement actif. Vos retours sont précieux !

1. Fork le repo
2. Créer une branche (`git checkout -b feature/ma-feature`)
3. Commit (`git commit -m 'feat: ma nouvelle feature'`)
4. Push (`git push origin feature/ma-feature`)
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

<p align="center">
  <strong>Garry — Gardez toutes vos factures, garanties et dates importantes en un seul endroit.</strong><br>
  Fait avec ❤️ pour ne plus jamais perdre une garantie.
</p>
