# Documentation Authentification N'DJIGI - Index
## Pour Développeurs Mobile Flutter

Bienvenue! Vous trouverez ici toute la documentation nécessaire pour intégrer l'authentification N'DJIGI dans votre application Flutter.

---

## 📚 Documents Disponibles

### 1. 🚀 [QUICKSTART_AUTH_FLUTTER.md](QUICKSTART_AUTH_FLUTTER.md)
**Durée:** 15 minutes | **Niveau:** Débutant  
Le point de départ! Implémentation minimale et fonctionnelle en 5 étapes simples.

**Contenu:**
- Installation des dépendances
- Configuration de base
- Service d'authentification minimal
- Écrans de connexion & accueil
- Structure de projet

**Quand l'utiliser?**
✅ Vous commencez un nouveau projet  
✅ Vous voulez un setup rapide et fonctionnel  
✅ Vous n'avez pas d'expérience avec ces patterns  

---

### 2. 📖 [DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md](DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md)
**Durée:** 30-45 minutes de lecture | **Niveau:** Intermédiaire  
La référence complète de l'API d'authentification. À lire en parallèle du développement.

**Contenu:**
- **Vue d'ensemble du système** - Architecture complète
- **Flux par rôle** - Passager, Chauffeur, Propriétaire
- **Endpoints API** - Tous les endpoints avec requêtes/réponses
- **Gestion des tokens** - JWT, expiration, refresh
- **Codes d'erreur** - Tous les codes avec solutions
- **Implémentation Flutter** - Service AuthService complète
- **Intégration dans l'app** - Navigation, state management
- **Bonnes pratiques** - Sécurité et performance

**Quand l'utiliser?**
✅ Implémenter une feature d'authentification spécifique  
✅ Comprendre le flux pour un rôle particulier  
✅ Chercher un endpoint ou code d'erreur  
✅ Implémenter OTP/2FA  
✅ Valider votre implémentation  

---

### 3. 💻 [GUIDE_IMPLEMENTATION_FLUTTER.md](GUIDE_IMPLEMENTATION_FLUTTER.md)
**Durée:** 45-60 minutes de lecture | **Niveau:** Avancé  
Patterns professionnels et code production-ready.

**Contenu:**
- **Configuration Dio** - Intercepteurs, logging, retry automatique
- **Riverpod State Management** - Architecture réactive
- **Navigation GoRouter** - Authentification-aware routing
- **Cas d'usage pratiques**
  - Écran de connexion complet
  - Écran OTP avec timer
  - Navigation basée sur les rôles
  - Gestion du profil
- **Tests unitaires** - Structure et exemples
- **Patterns avancés** - Refresh token automatique, retry, caching

**Quand l'utiliser?**
✅ Application en production  
✅ Team avec des conventions strictes  
✅ Vous voulez du code maintenable et testable  
✅ Vous avez besoin de state management complexe  
✅ Vous voulez implémenter OTP/2FA correctement  

---

## 🎯 Chemins de Démarrage Recommandés

### Débutant - "Je commence mon app"
```
1. Lire: QUICKSTART_AUTH_FLUTTER.md (15 min)
   └─> Code minimal et fonctionnel
2. Lire: DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md (sections pertinentes)
   └─> Comprendre les endpoints
3. Développer: Implémenter les écrans
4. Consulter: Sections du guide avancé au besoin
```

### Intermédiaire - "J'ai déjà une base"
```
1. Lire rapidement: QUICKSTART_AUTH_FLUTTER.md (5 min scan)
   └─> Voir la structure
2. Lire en détail: DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md
   └─> Implémenter correctement
3. Consulter: GUIDE_IMPLEMENTATION_FLUTTER.md pour patterns
   └─> Améliorer la qualité du code
```

### Avancé - "Je veux du code production"
```
1. Scan: QUICKSTART_AUTH_FLUTTER.md (2 min)
2. Référence: DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md (lookup)
3. Implémentation: Suivre GUIDE_IMPLEMENTATION_FLUTTER.md
   └─> Dio + Riverpod + GoRouter
4. Tests: Ajouter les tests unitaires
```

---

## 🏗️ Architecture Globale

```
┌─────────────────────────────────────────────────────────┐
│         Application Flutter N'DJIGI                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Login Screen │  │ Profile View │  │ Home Screens │  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  │
│         │                 │                  │          │
│         └─────────────────┴──────────────────┘          │
│                   │                                      │
│              ┌────▼──────────┐                          │
│              │  GoRouter     │                          │
│              │  Navigation   │                          │
│              └────┬──────────┘                          │
│                   │                                      │
│              ┌────▼──────────────┐                      │
│              │  Riverpod Providers│                     │
│              │  State Management  │                     │
│              └────┬───────────────┘                     │
│                   │                                      │
│         ┌─────────▼──────────┐                          │
│         │   Auth Service     │                          │
│         │  + Dio Interceptors│                          │
│         │  + Token Management│                          │
│         └────────┬────────────┘                         │
│                  │                                       │
│    ┌─────────────┼─────────────┐                        │
│    │             │             │                        │
│    ▼             ▼             ▼                        │
│ ┌──────┐  ┌──────────┐  ┌────────────┐                 │
│ │Redis │  │Keycloak  │  │PostgreSQL  │                 │
│ │Token │  │  Server  │  │ Database   │                 │
│ │ List │  │          │  │            │                 │
│ └──────┘  └──────────┘  └────────────┘                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Flux d'Authentification Simplifié

```
[Utilisateur] → [Login Screen]
                    ↓
              [Email + Password]
                    ↓
              [Auth Service]
                    ↓
              [API Backend] → [Keycloak]
                    ↓
         [Access Token + Refresh Token]
                    ↓
        [Secure Storage (Keychain/Keystore)]
                    ↓
          [Requêtes authentifiées]
                    ↓
          [Bearer Token Injection]
                    ↓
         [Home Screen selon rôle]
```

---

## 📋 Rôles Utilisateurs

### 1. 👤 **Passager** (`passager`)
Utilisateur qui réserve des trajets.
- Inscription gratuite via email
- Gestion des adresses favorites
- Historique des trajets
- Évaluations des trajets

**Écrans typiques:**
- Accueil avec recherche de trajets
- Détail du trajet
- Réservation et paiement
- Historique et évaluations

---

### 2. 🚗 **Chauffeur** (`chauffeur`)
Utilisateur qui propose des trajets.
- Vérification des documents (permis, assurance)
- Gestion de disponibilité
- Suivi des trajets
- Historique et ratings

**Écrans typiques:**
- Tableau de bord avec statistiques
- Gestion de disponibilité (en ligne/hors ligne)
- Liste des trajets acceptés
- Historique des trajets

---

### 3. 🏢 **Propriétaire** (`proprietaire`)
Utilisateur qui loue ses véhicules.
- Gestion du parc de véhicules
- Suivi des locations
- Revenus et statistiques
- Documents de validation

**Écrans typiques:**
- Garage (liste des véhicules)
- Calendrier des locations
- Revenus mensuels
- Documents et vérification

---

### 4. 🅿️ **Gestionnaire** (`gestionnaire`)
Gère un parking pour l'entreprise.
- Accès via invitation email
- Première connexion avec mot de passe temporaire
- Gestion des stationnements
- Rapports et statistiques

**Écrans typiques:**
- Tableau de bord du parking
- Gestion des places
- Journal des véhicules
- Rapports

---

### 5. 👨‍💼 **Admin** (`admin`)
Administrateur de la plateforme.
- Création des gestionnaires
- Modération
- Statistiques globales
- Configuration système

**Écrans typiques:**
- Dashboard système
- Gestion des utilisateurs
- Statistiques
- Configuration

---

## 🔐 Sécurité - Points Clés

### ✅ À Faire
- Stocker les tokens en `flutter_secure_storage`
- Utiliser HTTPS en production
- Rafraîchir les tokens automatiquement
- Valider les données localement
- Logger les erreurs (pas les tokens!)

### ❌ À Éviter
- Stocker les tokens en SharedPreferences
- Transmettre les tokens en URL
- Logger les tokens ou mots de passe
- Utiliser HTTP en production
- Faire confiance aveuglément aux données du client

---

## 🚀 Déploiement

### Développement
```
API Base URL: http://localhost:8000/api/v1
Keycloak: http://localhost:8080
```

### Production
```
API Base URL: https://api.ndjigi.com/api/v1
Keycloak: https://auth.ndjigi.com
```

---

## 📞 Support

### Questions sur l'API?
→ Voir [DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md](DOCUMENTATION_AUTHENTIFICATION_FLUTTER.md)

### Questions sur l'implémentation?
→ Voir [GUIDE_IMPLEMENTATION_FLUTTER.md](GUIDE_IMPLEMENTATION_FLUTTER.md)

### Besoin de démarrer rapidement?
→ Voir [QUICKSTART_AUTH_FLUTTER.md](QUICKSTART_AUTH_FLUTTER.md)

### Erreur spécifique?
→ Chercher le code d'erreur dans la Documentation (section Codes d'Erreur)

### Documentation Swagger API Live?
→ `{API_BASE_URL}/docs` (ex: http://localhost:8000/api/v1/docs)

---

## ✅ Checklist Pre-Prod

Avant de déployer en production:

- [ ] Tous les tokens stockés en `flutter_secure_storage`
- [ ] HTTPS activé (pas HTTP)
- [ ] Refresh token automatique implémenté
- [ ] Gestion des erreurs 401/403 correcte
- [ ] Déconnexion blackliste les tokens
- [ ] Tests de login/logout fonctionnels
- [ ] Tests avec slow network (throttle réseau)
- [ ] Tests 2FA/OTP si implémentés
- [ ] Pas de tokens en logs
- [ ] Pas de mots de passe stockés
- [ ] API Base URL configurable (dev/prod)
- [ ] Loading states affichés correctement
- [ ] Messages d'erreur user-friendly

---

## 📊 Statistiques de la Documentation

| Document | Pages | Durée Lecture | Niveau |
|----------|-------|--------------|--------|
| QUICKSTART | ~10 | 15 min | Débutant |
| DOCUMENTATION | ~70 | 30-45 min | Intermédiaire |
| GUIDE_IMPLEMENTATION | ~50 | 45-60 min | Avancé |
| **TOTAL** | **~130** | **2-3 heures** | - |

---

## 📅 Versions

| Version | Date | Changements |
|---------|------|-------------|
| 1.0 | Juin 2026 | Release initial |

---

## 📝 Notes pour le Développeur

1. **Les exemples de code sont production-ready**
   - Utilisez-les directement (avec adaptations mineures)
   - Ils suivent les best practices Flutter

2. **Les endpoints sont actuels**
   - À jour avec le backend
   - Inclus les phases 1-7 d'implémentation

3. **La sécurité est prioritaire**
   - Toutes les pratiques recommandées sont expliquées
   - Les mauvaises pratiques sont marquées ❌

4. **Les erreurs sont couverts**
   - Chaque endpoint inclut les codes d'erreur possibles
   - Les solutions sont proposées

5. **Le code est modulaire**
   - Chaque service peut être utilisé indépendamment
   - Les patterns permettent les tests unitaires

---

**Dernière mise à jour:** Juin 2026  
**Statut:** ✅ Production-Ready  
**Auteur:** Équipe Backend N'DJIGI  

Bon développement! 🎉
