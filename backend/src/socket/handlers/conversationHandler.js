/**
 * SOCKET/HANDLERS/CONVERSATIONHANDLER.JS
 * Gère les événements socket pour les conversations, messages, et statuts
 *
 * - message:send : envoyer un message dans une conversation (avec autorisation + persistance + diffusion)
 * - message:read : marquer les messages comme lus (diffuse message:read:ack à la room)
 * - typing:start / typing:stop : relayer "en train d'écrire" aux autres membres (pas de persistance)
 * - conversation:join : rejoindre une conversation (avec vérification participant)
 * - AUTO-JOIN : rejoindre toutes les conversations de l'utilisateur à la connexion
 */

const {
  isParticipant,
  listConversationIds,
  createMessage,
  markConversationRead
} = require('../services/conversationService');
const {
  addSocket,
  removeSocket,
  refresh
} = require('../services/presenceService');
const {
  checkRateLimit,
  LIMITS
} = require('../services/rateLimitService');

/**
 * Enregistre tous les handlers d'événements pour une socket connectée
 * @param {Socket} socket - Socket.io socket
 */
function registerConversationHandlers(socket) {
  const userId = socket.data.user?.id_utilisateur;

  if (!userId) {
    console.error('❌ registerConversationHandlers: userId absent');
    return;
  }

  // === Handler: message:send (enregistré EN PREMIER, synchrone) ===
  socket.on('message:send', async (payload) => {
    const idConversation = payload?.id_conversation;
    const contenu = payload?.contenu;

    // RATE LIMIT (Phase 7) — appliqué EN PREMIER
    const { allowed: rateLimitAllowed } = await checkRateLimit('message:send', userId, LIMITS['message:send'].max, LIMITS['message:send'].window);
    if (!rateLimitAllowed) {
      socket.emit('message:error', {
        id_conversation: idConversation || null,
        code: 'RATE_LIMITED'
      });
      return;
    }

    // Validation payload
    if (!idConversation || typeof idConversation !== 'string') {
      socket.emit('message:error', {
        id_conversation: idConversation || null,
        code: 'INVALID_PAYLOAD'
      });
      return;
    }

    // Validation contenu
    if (!contenu || typeof contenu !== 'string') {
      socket.emit('message:error', {
        id_conversation: idConversation,
        code: 'INVALID_CONTENT'
      });
      return;
    }

    const contenuTrimme = contenu.trim();
    if (contenuTrimme.length === 0 || contenuTrimme.length > 2000) {
      socket.emit('message:error', {
        id_conversation: idConversation,
        code: 'INVALID_CONTENT'
      });
      return;
    }

    // BARRIÈRE D'AUTORISATION (re-vérifiée à chaque message)
    const allowed = await isParticipant(idConversation, userId);
    if (!allowed) {
      socket.emit('message:error', {
        id_conversation: idConversation,
        code: 'FORBIDDEN'
      });
      console.log(
        `⚠️  Tentative FORBIDDEN message: socket ${socket.id} (user ${userId}) → conversation ${idConversation}`
      );
      return;
    }

    // Persister le message
    try {
      const nomExpediteur = socket.data.user.prenom;
      const message = await createMessage(idConversation, userId, nomExpediteur, contenuTrimme);

      // Diffuser à toute la room (inclut l'émetteur)
      socket.nsp.to(`conversation:${idConversation}`).emit('message:new', message);
      console.log(
        `✅ Message envoyé: socket ${socket.id} (user ${userId}) → conversation ${idConversation} (id: ${message.id_message})`
      );
    } catch (err) {
      socket.emit('message:error', {
        id_conversation: idConversation,
        code: 'SERVER_ERROR'
      });
      console.error(
        `❌ Erreur lors de la création du message: ${err.message}`
      );
    }
  });

  // === Handler: message:read (enregistré DEUXIÈME, synchrone) ===
  socket.on('message:read', async (payload) => {
    const idConversation = payload?.id_conversation;

    // RATE LIMIT (Phase 7) — appliqué EN PREMIER
    const { allowed: rateLimitAllowed } = await checkRateLimit('message:read', userId, LIMITS['message:read'].max, LIMITS['message:read'].window);
    if (!rateLimitAllowed) {
      socket.emit('message:error', {
        id_conversation: idConversation || null,
        code: 'RATE_LIMITED'
      });
      return;
    }

    // Validation payload
    if (!idConversation || typeof idConversation !== 'string') {
      socket.emit('message:error', {
        id_conversation: idConversation || null,
        code: 'INVALID_PAYLOAD'
      });
      return;
    }

    // BARRIÈRE D'AUTORISATION
    const allowed = await isParticipant(idConversation, userId);
    if (!allowed) {
      socket.emit('message:error', {
        id_conversation: idConversation,
        code: 'FORBIDDEN'
      });
      console.log(
        `⚠️  Tentative FORBIDDEN read: socket ${socket.id} (user ${userId}) → conversation ${idConversation}`
      );
      return;
    }

    // Marquer les messages comme lus
    try {
      const { count, date_lecture } = await markConversationRead(idConversation, userId);
      // Diffuser à toute la room (émetteur inclus, pour cohérence multi-device)
      socket.nsp.to(`conversation:${idConversation}`).emit('message:read:ack', {
        id_conversation: idConversation,
        lu_par: userId,
        date_lecture: date_lecture
      });
      console.log(
        `✅ Read: socket ${socket.id} (user ${userId}) → conversation ${idConversation} (${count} messages marqués)`
      );
    } catch (err) {
      socket.emit('message:error', {
        id_conversation: idConversation,
        code: 'SERVER_ERROR'
      });
      console.error(
        `❌ Erreur lors du marquage comme lu: ${err.message}`
      );
    }
  });

  // === Handler: typing:start (enregistré TROISIÈME, synchrone) ===
  socket.on('typing:start', async ({ id_conversation }) => {
    // Validation légère, silencieuse
    if (!id_conversation || typeof id_conversation !== 'string') {
      return;
    }

    // RATE LIMIT (Phase 7) — appliqué EN PREMIER, ignoré silencieusement si dépassé
    const { allowed: rateLimitAllowed } = await checkRateLimit('typing', userId, LIMITS['typing'].max, LIMITS['typing'].window);
    if (!rateLimitAllowed) {
      return;  // Ignorer silencieusement le typing spammé
    }

    // Optionnel : vérifier que la socket est dans la room
    if (!socket.rooms.has(`conversation:${id_conversation}`)) {
      return;
    }

    // Relayer aux autres membres seulement (socket.to(...) exclut l'émetteur)
    socket.to(`conversation:${id_conversation}`).emit('typing:start', {
      id_conversation: id_conversation,
      id_utilisateur: userId
    });
  });

  // === Handler: typing:stop (enregistré QUATRIÈME, synchrone) ===
  socket.on('typing:stop', async ({ id_conversation }) => {
    // Validation légère, silencieuse
    if (!id_conversation || typeof id_conversation !== 'string') {
      return;
    }

    // RATE LIMIT (Phase 7) — appliqué EN PREMIER, ignoré silencieusement si dépassé
    const { allowed: rateLimitAllowed } = await checkRateLimit('typing', userId, LIMITS['typing'].max, LIMITS['typing'].window);
    if (!rateLimitAllowed) {
      return;  // Ignorer silencieusement le typing spammé
    }

    // Optionnel : vérifier que la socket est dans la room
    if (!socket.rooms.has(`conversation:${id_conversation}`)) {
      return;
    }

    // Relayer aux autres membres seulement (socket.to(...) exclut l'émetteur)
    socket.to(`conversation:${id_conversation}`).emit('typing:stop', {
      id_conversation: id_conversation,
      id_utilisateur: userId
    });
  });

  // === Handler: conversation:join (enregistré CINQUIÈME, synchrone) ===
  socket.on('conversation:join', async (payload) => {
    const idConversation = payload?.id_conversation;

    // RATE LIMIT (Phase 7) — appliqué EN PREMIER
    const { allowed: rateLimitAllowed } = await checkRateLimit('conversation:join', userId, LIMITS['conversation:join'].max, LIMITS['conversation:join'].window);
    if (!rateLimitAllowed) {
      socket.emit('conversation:error', {
        id_conversation: idConversation || null,
        code: 'RATE_LIMITED'
      });
      return;
    }

    // Validation payload
    if (!idConversation || typeof idConversation !== 'string') {
      socket.emit('conversation:error', {
        id_conversation: idConversation || null,
        code: 'INVALID_PAYLOAD'
      });
      return;
    }

    // Vérifier que l'utilisateur est participant
    const allowed = await isParticipant(idConversation, userId);
    if (!allowed) {
      socket.emit('conversation:error', {
        id_conversation: idConversation,
        code: 'FORBIDDEN'
      });
      console.log(
        `⚠️  Tentative FORBIDDEN: socket ${socket.id} (user ${userId}) → conversation ${idConversation}`
      );
      return;
    }

    // Autoriser : rejoindre la room
    socket.join(`conversation:${idConversation}`);
    socket.emit('conversation:joined', { id_conversation: idConversation });
    console.log(
      `✅ Join: socket ${socket.id} (user ${userId}) → conversation ${idConversation}`
    );
  });

  // === AUTO-JOIN : rejoindre toutes les conversations de l'utilisateur (EN ARRIÈRE-PLAN) ===
  (async () => {
    try {
      const conversationIds = await listConversationIds(userId);
      for (const convId of conversationIds) {
        socket.join(`conversation:${convId}`);
      }
      console.log(
        `✅ Auto-join: socket ${socket.id} (user ${userId}) rejoints ${conversationIds.length} conversations`
      );
    } catch (err) {
      console.error(`❌ Auto-join failed: ${err.message}`);
    }
  })();

  // === PRÉSENCE : gestion de la présence en ligne (Phase 6) ===
  (async () => {
    try {
      // Enregistrer cette socket dans le compteur
      const { count } = await addSocket(userId);

      // Si c'est la 1re socket → l'user vient de passer online → notifier les autres
      if (count === 1) {
        const conversationIds = await listConversationIds(userId);
        for (const convId of conversationIds) {
          socket.nsp.to(`conversation:${convId}`).emit('presence:online', { id_utilisateur: userId });
        }
        console.log(
          `✅ Présence: socket ${socket.id} (user ${userId}) passe ONLINE`
        );
      }

      // Heartbeat : rafraîchir la présence toutes les 30 secondes
      const heartbeatInterval = setInterval(async () => {
        try {
          await refresh(userId);
        } catch (err) {
          console.error(`❌ Heartbeat error: ${err.message}`);
        }
      }, 30000);

      // Stocker l'ID de l'interval pour le clear au disconnect
      socket.data._presenceInterval = heartbeatInterval;

      // Handler disconnect : retirer la socket et notifier offline si c'était la dernière
      socket.on('disconnect', async () => {
        // Arrêter le heartbeat
        clearInterval(socket.data._presenceInterval);

        try {
          // Retirer cette socket du compteur
          const { count } = await removeSocket(userId);

          // Si count <= 0 → c'était la dernière socket → l'user passe offline → notifier les autres
          if (count <= 0) {
            const conversationIds = await listConversationIds(userId);
            for (const convId of conversationIds) {
              socket.nsp.to(`conversation:${convId}`).emit('presence:offline', { id_utilisateur: userId });
            }
            console.log(
              `✅ Présence: socket ${socket.id} (user ${userId}) passe OFFLINE`
            );
          }
        } catch (err) {
          console.error(`❌ Erreur lors du disconnect: ${err.message}`);
        }
      });
    } catch (err) {
      console.error(`❌ Erreur initialisation présence: ${err.message}`);
    }
  })();
}

module.exports = { registerConversationHandlers };
