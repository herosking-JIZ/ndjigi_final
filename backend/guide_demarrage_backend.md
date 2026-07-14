# Guide de démarrage du backend N'DJIGI 🚀

Ce guide vous explique comment démarrer et exécuter le backend Node.js. Deux options s'offrent à vous : l'utilisation complète de **Docker Compose** (recommandée) ou l'exécution **locale autonome (standalone)**.

---

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine :
- **Node.js** (version 20 ou supérieure recommandée, le projet utilise l'image Node 22)
- **Docker** et **Docker Compose**
- **npm** (inclus avec Node.js)

---

## 🐳 Option 1 : Exécution avec Docker Compose (Recommandée)

Cette méthode est la plus simple et la plus rapide, car elle configure et démarre automatiquement tous les services nécessaires : la base de données PostgreSQL, Redis, le serveur d'identité Keycloak, le backend Node.js et le frontend React.

### Étape 1 : Se placer à la racine du projet
Ouvrez un terminal et placez-vous dans le répertoire principal de l'application :
```bash
cd /home/herosking/Desktop/ndjigi/ndjigiv1
```

### Étape 2 : Lancer les conteneurs
Démarrez tous les services en arrière-plan. *Note : Si vous rencontrez une erreur de permission sur le socket docker, préfixez la commande par `sudo`.*
```bash
sudo docker compose up -d --build
```

### Étape 3 : Appliquer les migrations de la base de données
Une fois les conteneurs démarrés, appliquez le schéma de base de données Prisma :
```bash
sudo docker compose exec backend npx prisma migrate deploy
```

### Étape 4 : Remplir la base de données avec les données initiales (Seeding)
Pour générer les utilisateurs de test et données par défaut :
```bash
sudo docker compose exec backend npm run seed
```

### Étape 5 : Vérifier les logs et le statut
Pour vous assurer que le backend fonctionne correctement et voir les logs en direct :
```bash
sudo docker compose logs -f backend
```
Vous pouvez également vérifier le statut de tous les conteneurs :
```bash
sudo docker compose ps
```

---

## 💻 Option 2 : Exécution Locale / Standalone (Pour le développement)

Si vous préférez exécuter le backend directement sur votre machine hôte (avec rechargement automatique via `nodemon`), vous devez tout de même lancer les services externes (Postgres, Keycloak, Redis) via Docker.

### Étape 1 : Lancer uniquement les services requis
Depuis la racine du projet, lancez PostgreSQL, Redis et Keycloak en arrière-plan :
```bash
cd /home/herosking/Desktop/ndjigi/ndjigiv1
sudo docker compose up -d postgres keycloak redis
```

### Étape 2 : Adapter le fichier de configuration `.env`
Puisque le backend s'exécutera sur votre machine hôte (sur `localhost`) et non dans le réseau isolé de Docker, vous devez adapter les variables de connexion dans le fichier `.env` du backend.

1. Ouvrez le fichier [.env](file:///home/herosking/Desktop/ndjigi/ndjigiv1/backend/.env).
2. Remplacez le nom des conteneurs (`postgres`, `keycloak`, `redis`) par `localhost` :

```env
# Remplacer postgres par localhost
DATABASE_URL=postgresql://ndjigi_user:1234567890@localhost:5432/ndjigi_db

# Remplacer keycloak par localhost
KEYCLOAK_URL=http://localhost:8080

# Remplacer redis par localhost
REDIS_SOCKET_URL=redis://localhost:6379/1
```

### Étape 3 : Installer les dépendances localement
Placez-vous dans le dossier `backend` et installez les paquets npm :
```bash
cd /home/herosking/Desktop/ndjigi/ndjigiv1/backend
npm install
```

### Étape 4 : Appliquer les migrations et exécuter le Seed
Synchronisez votre base de données locale et injectez les données de test :
```bash
npx prisma migrate dev
npm run seed
```

### Étape 5 : Démarrer le serveur de développement
Lancez le backend avec Nodemon pour bénéficier du rechargement automatique lors de la modification du code :
```bash
npm run dev
```
Le serveur sera disponible sur le port **8000** (ou le port défini dans votre `.env` via la variable `PORT`).

---

## 🔍 Tester le fonctionnement du Backend

Pour vérifier si l'API répond correctement, vous pouvez tester son endpoint de santé (Health Check) :

```bash
curl http://localhost:8000/health
```

Si tout fonctionne correctement, vous devriez obtenir un statut `HTTP 200` avec une réponse JSON du type :
```json
{
  "status": "UP",
  "services": {
    "database": "CONNECTED",
    "redis": "CONNECTED"
  }
}
```

La documentation interactive de l'API (Swagger UI) est également accessible à l'adresse :
👉 [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs) (une fois le backend démarré).

---

## ⚙️ Commandes Utiles de Gestion des Services

- **Arrêter tous les services :**
  ```bash
  sudo docker compose down
  ```
- **Redémarrer uniquement le backend :**
  ```bash
  sudo docker compose restart backend
  ```
- **Vérifier les logs généraux :**
  ```bash
  sudo docker compose logs -f
  ```
