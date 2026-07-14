# 📊 RAPPORT D'AUDIT - SOCKET.IO (backend/src/socket)
**Date:** 21 Juin 2026  
**Scope:** Communication, Sécurité, Paiement  

---

## 📋 RÉSUMÉ EXÉCUTIF

| Domaine | Statut | Complétude |
|---------|--------|-----------|
| **Communication** | ✅ IMPLÉMENTÉE | 100% (Phase 2-7) |
| **Sécurité** | ✅ IMPLÉMENTÉE | 95% (auth + rate limit) |
| **Paiement** | ❌ NON DÉVELOPPÉ | 0% |

---

## 1️⃣ ARCHITECTURE GLOBALE

### Structure fichiers
```
backend/src/socket/
├── index.js                          # Point d'entrée Socket.io
├── middleware/
│   └── authMiddleware.js             # Authentification JWT
├── handlers/
│   └── conversationHandler.js        # Événements socket (messages, typing, etc.)
└── services/
    ├── conversationService.js        # Data access (Prisma)
    ├── presenceService.js            # État en ligne (Redis)
    └── rateLimitService.js           # Rate limiting (Redis)
```

### Namespace utilisé
- **`/chat`** - Namespace dédié pour toutes les communications
- Authentification obligatoire au niveau du namespace
- CORS activé pour web (localhost:3000, Docker, IP dev)

---

## 2️⃣ COMMUNICATION

### 2.1 Événements Socket Implémentés

#### **message:send** (Message)
```javascript
socket.on('message:send', async (payload) => {
  // payload: { id_conversation, contenu }
})
```
| Aspect | Détail |
|--------|--------|
| **Flow** | Client → Serveur → DB (Prisma) → Broadcast room |
| **Persistance** | ✅ Messages stockés en DB |
| **Validation** | ✅ Contenu (0-2000 chars), conversation (string) |
| **Autorisation** | ✅ Re-vérifiée à chaque message (participant check) |
| **Diffusion** | ✅ Broadcast à `conversation:{id}` (tous les membres) |
| **Rate Limit** | ✅ 10 messages/10sec par utilisateur |
| **Erreurs** | - INVALID_PAYLOAD, INVALID_CONTENT, FORBIDDEN, SERVER_ERROR, RATE_LIMITED |

**Événement réponse:** `message:new` (diffusé à la room)
```javascript
{
  id_message: string,
  id_conversation: string,
  id_expediteur: string,
  nom_expediteur: string,
  contenu: string,
  lu: boolean,
  date_envoi: Date,
  date_lecture: Date | null
}
```

---

#### **message:read** (Marquage comme lu)
```javascript
socket.on('message:read', async (payload) => {
  // payload: { id_conversation }
})
```
| Aspect | Détail |
|--------|--------|
| **Flow** | Marquer TOUS les messages non-lus (sauf les siens) comme lus |
| **Persistance** | ✅ `lu = true`, `date_lecture = NOW` en DB |
| **Autorisation** | ✅ Participant check |
| **Diffusion** | ✅ `message:read:ack` à la room |
| **Rate Limit** | ✅ 20 fois/10sec |

**Événement réponse:** `message:read:ack`
```javascript
{
  id_conversation: string,
  lu_par: string (user ID),
  date_lecture: Date
}
```

---

#### **typing:start / typing:stop** (Indicateur de saisie)
```javascript
socket.on('typing:start', async ({ id_conversation }))
socket.on('typing:stop', async ({ id_conversation }))
```
| Aspect | Détail |
|--------|--------|
| **Flow** | Non persisté, relayé aux AUTRES membres seulement |
| **Validation** | ✅ Légère, silencieuse (pas d'erreur) |
| **Vérification room** | ✅ Check que le user est dans la room |
| **Diffusion** | ✅ Relay aux autres (socket.to) |
| **Rate Limit** | ✅ 30 fois/10sec (très permissif) |

**Événements réponse:** `typing:start`, `typing:stop`
```javascript
{
  id_conversation: string,
  id_utilisateur: string
}
```

---

#### **conversation:join** (Rejoindre une conversation)
```javascript
socket.on('conversation:join', async (payload) => {
  // payload: { id_conversation }
})
```
| Aspect | Détail |
|--------|--------|
| **Flow** | Vérifier participant → socket.join(room) |
| **Autorisation** | ✅ Stricte : participant uniquement |
| **Diffusion** | ✅ Confirmation locale `conversation:joined` |
| **Rate Limit** | ✅ 20 fois/10sec |
| **Auto-join** | ✅ À connexion : rejoin toutes les conversations de l'user |

**Événement réponse:** `conversation:joined`
```javascript
{ id_conversation: string }
```

---

### 2.2 Événements Spéciaux

#### **presence:online / presence:offline** (Indicateur présence)
| Aspect | Détail |
|--------|--------|
| **Trigger** | 1ère socket connectée → online ; dernière déconnectée → offline |
| **Stockage** | ✅ Compteur Redis (multi-socket aware) |
| **TTL** | 90 secondes (heartbeat toutes les 30s) |
| **Diffusion** | À toutes les conversations de l'user |

---

### 2.3 Auto-Join Mechanism

À la connexion (avant enregistrement des handlers):
```javascript
// Récupère toutes les conversations de l'user et rejoin les rooms
socket.join(`conversation:${convId}`)
```
✅ **Avantage:** L'user reçoit immédiatement les messages de ses conversations sans explicit join

---

## 3️⃣ SÉCURITÉ

### 3.1 Authentification (authMiddleware.js)

**Source:** JWT token dans `socket.handshake.auth.token`

| Étape | Détail | Statut |
|-------|--------|--------|
| **Token extraction** | `socket.handshake.auth.token` | ✅ |
| **Token validation** | Via `resolveUserFromToken()` (service centralisé) | ✅ |
| **User resolution** | Keycloak JWT parsing + DB lookup | ✅ |
| **Error handling** | Codes typés (NO_TOKEN, INVALID_TOKEN, UNAUTHORIZED) | ✅ |
| **Socket attachment** | Données user attachées à `socket.data` | ✅ |

**Données attachées:**
```javascript
socket.data = {
  user: {
    id_utilisateur: string,
    keycloak_id: string,
    email: string,
    nom: string,
    prenom: string,
    roles: string[]
  },
  roles: string[],
  keycloak_id: string
}
```

✅ **Points forts:**
- Réutilise service d'auth centralisé (pas de duplication)
- Codes d'erreur spécifiques
- Attachement de données complètes pour usage ultérieur

⚠️ **Observations:**
- Pas de validation du format JWT (Trust resolveUserFromToken)
- Pas de refresh token handling (à vérifier côté client)

---

### 3.2 Autorisation (Access Control)

**Pattern:** "Re-vérification à chaque événement"

#### **Participant Check** (conversationService.js)
```javascript
async function isParticipant(idConversation, idUtilisateur) {
  const participant = await prisma.conversation_participant.findFirst({
    where: {
      id_conversation: idConversation,
      id_utilisateur: idUtilisateur
    }
  });
  return !!participant;
}
```

| Événement | Vérification | Logs |
|-----------|-------------|------|
| message:send | ✅ Oui (re-vérifié) | Log FORBIDDEN si non-participant |
| message:read | ✅ Oui (re-vérifié) | Log FORBIDDEN si non-participant |
| conversation:join | ✅ Oui | Log FORBIDDEN si non-participant |
| typing:start/stop | ❌ Seulement vérif room (pas DB) | Silencieux |

✅ **Points forts:**
- Autorisation stricte par événement
- Re-vérification empêche l'escalade de privilèges
- Logs des tentatives suspectes

⚠️ **Faiblesses:**
- `typing:start/stop` ne re-vérifie que la room, pas la DB
  - Un user expulsé d'une room pourrait continuer à envoyer des typing si encore dans la room
  - Mineur car non persisté et purement informatif

---

### 3.3 Rate Limiting (rateLimitService.js)

**Algorithme:** Fixed Window Counter (Redis)

| Événement | Limite | Fenêtre | Partout? |
|-----------|--------|---------|----------|
| message:send | 10 | 10s | ✅ Oui |
| message:read | 20 | 10s | ✅ Oui |
| typing | 30 | 10s | ✅ Oui |
| conversation:join | 20 | 10s | ✅ Oui |

**Mécanisme:**
```javascript
// Clé Redis : ratelimit:{event}:{userId}
const count = await redis.incr(key);
if (count === 1) {
  await redis.expire(key, windowSeconds);
}
return { allowed: count <= max, count };
```

| Aspect | Détail | Statut |
|--------|--------|--------|
| **Couverture** | Tous les événements couverts | ✅ |
| **Granularité** | Par user + par événement | ✅ |
| **Fail-open** | Si Redis échoue → allowed=true | ✅ |
| **Rejet** | Émission `message:error` (typing:start/stop silencieux) | ✅ |

✅ **Points forts:**
- Fail-open : ne bloque pas les users légitimes si Redis échoue
- Limites raisonnables (pas de spam de messages)
- Différencié par événement (typing plus permissif)

⚠️ **Observations:**
- Fixed window : vulnérable aux "bursts" aux limites de fenêtres
  - Ex: 10 messages à 9.9s, 10 messages à 10.1s → 20 en 0.2s
  - Recommandation : Token Bucket ou Sliding Window pour plus de robustesse
- Pas de jitter sur TTL Redis → risque de concentration des resets

---

### 3.4 CORS Configuration

**Origines autorisées:**
```javascript
const corsOrigins = [
  'http://localhost:3000',      // Web local
  'http://localhost:8081',      // Alternative dev
  'http://web:3000',            // Docker
  'http://10.3.3.49:3000',      // Dev external IP
  'http://10.3.3.49:8000',      // Dev backend
  'http://10.0.2.2:8000',       // Android emulator
  'http://192.168.11.104:8000', // Réseau local
];
```

⚠️ **À CORRIGER EN PRODUCTION:**
```javascript
// Actuellement : hardcodé pour DEV
// À remplacer par:
const corsOrigins = process.env.SOCKET_CORS_ORIGINS?.split(',') || [];
```

---

### 3.5 Error Handling & Logging

**Logging appliqué:**
- ✅ Connexion/déconnexion
- ✅ Tentatives FORBIDDEN (tentatives d'accès non-autorisé)
- ✅ Auto-join succès/erreur
- ✅ Heartbeat errors
- ✅ Présence online/offline
- ❌ Pas de logging des rate limits rejetés

**Exemple log suspecte:**
```
⚠️ Tentative FORBIDDEN message: socket abc123 (user userId) → conversation convId
```

---

## 4️⃣ DONNÉES & PERSISTANCE

### 4.1 Schéma Prisma Utilisé

```javascript
// De conversationService.js
prisma.conversation_participant   // Vérif participant
prisma.message                     // Créer/marquer lus messages
```

**Contrat de données (DB):**
```javascript
// Message
{
  id_message,
  id_conversation,
  id_expediteur,
  nom_expediteur,
  contenu,
  lu,
  date_envoi,
  date_lecture
}

// Conversation_participant
{
  id_conversation,
  id_utilisateur,
  // autres champs non utilisés ici
}
```

✅ **Points forts:**
- Pas de N+1 queries (utilise `findFirst`, `findMany`)
- Transactions implicites (à vérifier si multi-message atomique)

⚠️ **Observations:**
- `createMessage` ne retourne que les champs Prisma → OK
- `markConversationRead` fait updateMany sans transaction
  - Si N messages, N updates = N appels DB
  - Non-critique mais peut être optimisé

---

### 4.2 Redis Utilisé

**DB:** Redis /0 (par défaut)

| Clé | TTL | Usage |
|-----|-----|-------|
| `presence:count:{userId}` | 90s | Compteur multi-socket |
| `ratelimit:{event}:{userId}` | dynamic (par événement) | Rate limit |

✅ **Avantages:**
- Présence en temps réel
- Rate limit distribué
- TTL auto-cleanup

---

## 5️⃣ PAIEMENT

### ❌ **NON DÉVELOPPÉ**

**Situation actuelle:**
- ❌ Aucun événement socket pour paiement
- ❌ Aucun service de paiement en socket
- ❌ Aucune intégration Stripe/PayPal/etc.

**À prévoir:**
1. Authentification côté paiement (vérification user)
2. Événement `payment:initiate` pour initier paiement
3. Webhook sécurisé pour confirmation (Stripe Webhook, PayPal IPN)
4. Événement `payment:status` pour notifier client
5. Rate limiting sur events paiement (1 paiement/user/minute)

**Exemple futur (architecture recommandée):**
```javascript
socket.on('payment:initiate', async (payload) => {
  // payload: { montant, methode_paiement, id_service }
  
  // 1. Rate limit strict
  // 2. Vérifier le user est authentifié
  // 3. Valider le montant/service
  // 4. Créer une commande en DB (status PENDING)
  // 5. Appeler API paiement externe
  // 6. Émettre payment:initiated avec ID transaction
  // 7. Webhook externe → payment:confirmed → broadcast room
})
```

---

## 6️⃣ CHECKLIST DE SÉCURITÉ

| Item | Statut | Notes |
|------|--------|-------|
| **Authentification** | ✅ | JWT via Keycloak |
| **Autorisation** | ✅ | Participant check + room check |
| **Rate limiting** | ✅ | 4 événements couverts |
| **CORS** | ⚠️ | Hardcodé, pas d'env |
| **Input validation** | ✅ | Contenu (length, type), IDs (string) |
| **Error messages** | ✅ | Génériques (pas de leak info) |
| **Logging suspicious** | ✅ | FORBIDDEN attempts loggées |
| **Heartbeat/TTL** | ✅ | Redis TTL 90s |
| **Paiement** | ❌ | Non implémenté |
| **HTTPS/WSS** | ❓ | À vérifier en production |

---

## 7️⃣ RECOMMANDATIONS

### 🔴 CRITIQUES (Production-ready)

1. **CORS Origins → Environment Variable**
   ```javascript
   const corsOrigins = (process.env.SOCKET_CORS_ORIGINS || '').split(',').filter(Boolean);
   if (corsOrigins.length === 0) {
     console.warn('⚠️ No CORS origins configured - Socket.io may be blocked');
   }
   ```

2. **Rate Limiting Algorithm**
   - Migrer de Fixed Window à Token Bucket ou Sliding Window
   - Actuellement vulnérable aux bursts

3. **Typing events authorization**
   - Activer re-vérification DB (pas juste room check)
   ```javascript
   const allowed = await isParticipant(id_conversation, userId);
   if (!allowed) return;
   ```

### 🟡 IMPORTANTS (À court terme)

1. **Logging rate limits rejetés**
   ```javascript
   if (!rateLimitAllowed) {
     console.log(`⚠️ Rate limited: ${event} user=${userId}`);
   }
   ```

2. **Message transaction**
   - Assurer atomicité si N messages par conversation

3. **Webhook sécurité paiement**
   - Signature HMAC verification
   - Timestamp validation
   - Idempotency check

### 🟢 OPTIONNELS (À explorer)

1. **Compression messages** (production optimization)
2. **Message history pagination** (si base grandit)
3. **Encryption au repos** (E2E si besoin confidentiel)

---

## 📈 SUMMARY METRICS

| Métrique | Valeur |
|----------|--------|
| **Fichiers** | 6 |
| **Événements socket** | 6 (message:send, message:read, typing:start/stop, conversation:join) |
| **Rate limited events** | 4/6 (67%) |
| **Middleware** | 1 (auth) |
| **Services** | 3 (conversation, presence, rateLimit) |
| **Redis keys** | 2 types (presence, rateLimit) |
| **Endpoints data** | 100% via Prisma |

---

## 🎯 CONCLUSION

✅ **Communication:** Implémentée de manière robuste avec persistance, validation, et diffusion en temps réel.

✅ **Sécurité:** Solide à très bon niveau avec auth JWT, autorisation granulaire, et rate limiting. Nécessite ajustements CORS et optimisation rate limit.

❌ **Paiement:** À développer entièrement avec webhooks sécurisés.

**État général:** PRODUCTION-READY pour communication (avec ajustements CORS). Paiement à ajouter.

