# Routes & Endpoints - Mise à Jour Après Corrections

## Routes GoRouter (lib/app/router/app_router.dart)

```
/profil (ProfilHubScreen)
  ├─ /mes-informations (MesInformationsScreen)
  ├─ /mes-adresses (MesAdressesScreen)
  ├─ /portefeuille (PortefeuilleScreen)
  ├─ /securite-contacts (SecuriteContactsScreen)
  ├─ /parametres (ParametresScreen)
  └─ /devenir-partenaire (DevenirPartennaireScreen)
```

**Statut:** ✅ Toutes les routes compilent et fonctionnent

---

## Endpoints API - UTILISÉS (Implémentés)

### Authentication & User
- **PATCH** `/utilisateurs/profil`
  - Screen: MesInformationsScreen
  - Body: { prenom, nom, numero_telephone }
  - Response: Updated Utilisateur
  - Status: ✅ FONCTIONNEL

### Addresses
- **GET** `/addresses` (pagination)
  - Screen: MesAdressesScreen
  - Query: page=1, limit=100
  - Response: { data: Address[] }
  - Provider: addressesProvider
  - Status: ✅ FONCTIONNEL

- **POST** `/addresses`
  - Screen: MesAdressesScreen
  - Body: { label, address, latitude, longitude }
  - Status: ✅ FONCTIONNEL (form a champs lat/lng - voir CORRECTION 1)

- **DELETE** `/addresses/:id` ⭐ **NOUVEAU**
  - Screen: MesAdressesScreen
  - Dialog confirmation: "Supprimer cette adresse ?"
  - Response: Success → SnackBar + refresh provider
  - Status: ✅ IMPLÉMENTÉ & TESTÉ

### Contacts
- **GET** `/contacts-confiance` (pagination)
  - Screen: SecuriteContactsScreen
  - Query: page=1, limit=100
  - Response: { data: ContactConfiance[] }
  - Provider: contactsConfianceProvider
  - Status: ✅ FONCTIONNEL

- **POST** `/contacts-confiance`
  - Screen: SecuriteContactsScreen
  - Body: { nom, prenom, country_code, phone, relation }
  - Status: ✅ FONCTIONNEL

- **DELETE** `/contacts-confiance/:id` ⭐ **NOUVEAU**
  - Screen: SecuriteContactsScreen
  - Dialog confirmation: "Supprimer $prenom $nom ?"
  - Response: Success → SnackBar + refresh provider
  - Status: ✅ IMPLÉMENTÉ & TESTÉ

### Wallet
- **GET** `/paiement/portefeuille`
  - Screen: PortefeuilleScreen
  - Response: { data: { solde, devise, statut, dette_commission } }
  - Provider: portefeuilleProvider
  - Status: ✅ FONCTIONNEL

### External Links
- **URL** `https://keycloak.ndjigi.com/terms` (CGU)
  - Screen: ParametresScreen
  - Const: _cguUrl
  - Status: ⚠️ À VALIDER (placeholder)

- **URL** `https://keycloak.ndjigi.com/privacy` (Privacy)
  - Screen: ParametresScreen
  - Const: _privacyUrl
  - Status: ⚠️ À VALIDER (placeholder)

---

## Endpoints API - "Bientôt Disponible" (UI Ready)

### Wallet Operations
- **POST** `/paiement/credit-add`
  - Screen: PortefeuilleScreen - Bouton "Ajouter du crédit"
  - Action: Click → SnackBar "Bientôt disponible"
  - Status: ⚠️ UI placeholder (backend pending)

- **GET** `/transactions`
  - Screen: PortefeuilleScreen - Bouton "Historique des transactions"
  - Action: Click → SnackBar "Bientôt disponible"
  - Status: ⚠️ UI placeholder

- **POST** `/paiement/retrait`
  - Screen: PortefeuilleScreen - Bouton "Retirer des fonds"
  - Action: Click → SnackBar "Bientôt disponible"
  - Status: ⚠️ UI placeholder

### Partner Program
- **POST** `/partners/register`
  - Screen: DevenirPartennaireScreen - Bouton "En savoir plus"
  - Action: Click → SnackBar "Bientôt disponible"
  - Status: ⚠️ UI placeholder

---

## Endpoints API - À CRÉER (Edit/Update)

### Addresses - Édition
- **PATCH** `/addresses/:id`
  - Screen: MesAdressesScreen - Bouton "Éditer" (⚠️ placeholder onPressed: () {})
  - Body: { label, address, latitude, longitude }
  - Expected: Status 200 + updated Address
  - Status: ❌ FRONT END READY, BACKEND PENDING

### Contacts - Édition
- **PATCH** `/contacts-confiance/:id`
  - Screen: SecuriteContactsScreen - Bouton "Éditer" (⚠️ placeholder onPressed: () {})
  - Body: { nom, prenom, country_code, phone, relation }
  - Expected: Status 200 + updated ContactConfiance
  - Status: ❌ FRONT END READY, BACKEND PENDING

---

## Résumé des États

| Endpoint | Méthode | Screen | Status | Notes |
|----------|---------|--------|--------|-------|
| /utilisateurs/profil | PATCH | MesInformations | ✅ OK | Profile update |
| /addresses | GET | MesAdresses | ✅ OK | List addresses |
| /addresses | POST | MesAdresses | ✅ OK | Add address |
| /addresses/:id | DELETE | MesAdresses | ✅ **NOUVEAU** | Delete avec dialog |
| /addresses/:id | PATCH | MesAdresses | ❌ READY | Edit address |
| /contacts-confiance | GET | SecuriteContacts | ✅ OK | List contacts |
| /contacts-confiance | POST | SecuriteContacts | ✅ OK | Add contact |
| /contacts-confiance/:id | DELETE | SecuriteContacts | ✅ **NOUVEAU** | Delete avec dialog |
| /contacts-confiance/:id | PATCH | SecuriteContacts | ❌ READY | Edit contact |
| /paiement/portefeuille | GET | Portefeuille | ✅ OK | Display balance |
| /paiement/credit-add | POST | Portefeuille | ⚠️ PLACEHOLDER | Coming soon |
| /transactions | GET | Portefeuille | ⚠️ PLACEHOLDER | Coming soon |
| /paiement/retrait | POST | Portefeuille | ⚠️ PLACEHOLDER | Coming soon |
| /partners/register | POST | DevenirPartenaire | ⚠️ PLACEHOLDER | Coming soon |

---

## Validation Checklist

### Endpoints Existants ✅
- [x] GET /addresses - Pagination OK
- [x] POST /addresses - Form fields: label, address, latitude, longitude
- [x] GET /contacts-confiance - Pagination OK
- [x] POST /contacts-confiance - Form fields: nom, prenom, country_code, phone, relation
- [x] GET /paiement/portefeuille - Fetch solde/devise/statut
- [x] PATCH /utilisateurs/profil - Update prenom/nom/numero_telephone

### Nouveaux Endpoints Implémentés ✅
- [x] DELETE /addresses/:id - Dialog + refresh
- [x] DELETE /contacts-confiance/:id - Dialog + refresh

### Endpoints À Créer Backend ⏳
- [ ] PATCH /addresses/:id - Edit address
- [ ] PATCH /contacts-confiance/:id - Edit contact
- [ ] POST /paiement/credit-add - Add credit (placeholder UI ready)
- [ ] GET /transactions - Transaction history (placeholder UI ready)
- [ ] POST /paiement/retrait - Withdrawal (placeholder UI ready)
- [ ] POST /partners/register - Partner signup (placeholder UI ready)

---

## Dépendances Mises à Jour

### Imports Actuels
- ✅ flutter_riverpod (state management)
- ✅ go_router (navigation)
- ✅ freezed_annotation (models)
- ✅ shared_preferences (local storage)
- ✅ url_launcher (external links)
- ✅ flutter_map (available for Phase 2 address picker)

### Providers Utilisés
- ✅ authProvider (login/logout, profile user)
- ✅ addressesProvider (FutureProvider.autoDispose)
- ✅ contactsConfianceProvider (FutureProvider.autoDispose)
- ✅ portefeuilleProvider (FutureProvider.autoDispose)
- ✅ apiServiceProvider (HTTP client)

---

**Généré automatiquement après corrections Profil**  
**À valider avec le backend pour completion des endpoints PATCH**
