/**
 * SOCKET/HANDLERS/COURSEHANDLER.JS
 * Gère les événements socket pour le suivi d'une course VTC (namespace /course)
 *
 * - course:join : rejoindre la room d'un trajet (avec vérification que
 *   l'utilisateur connecté est bien le chauffeur affecté ou le passager
 *   demandeur de ce trajet)
 *
 * Tous les autres événements (course:proposition, course:chauffeur_trouve,
 * course:confirmation_recue, course:statut_change, course:position_chauffeur)
 * sont émis côté serveur depuis les contrôleurs REST via ioRegistry.getIO(),
 * pas depuis ce handler — les actions elles-mêmes (accepter/refuser/confirmer)
 * passent par l'API REST, ce namespace ne sert qu'à la diffusion temps réel.
 */

const { prisma } = require('../../config/db');

const roomTrajet = (idTrajet) => `trajet:${idTrajet}`;

async function estParticipant(idTrajet, idUtilisateur) {
  const trajet = await prisma.trajet.findUnique({
    where: { id_trajet: idTrajet },
    include: { affectation_vehicule: { select: { id_chauffeur: true } } },
  });

  if (!trajet) return false;
  if (trajet.affectation_vehicule?.id_chauffeur === idUtilisateur) return true;

  const estPassager = await prisma.detail_trajet_passager.findUnique({
    where: { id_trajet_id_passager: { id_trajet: idTrajet, id_passager: idUtilisateur } },
  });
  return estPassager !== null;
}

function registerCourseHandlers(socket) {
  const userId = socket.data.user?.id_utilisateur;
  if (!userId) {
    console.error('❌ registerCourseHandlers: userId absent');
    return;
  }

  socket.on('course:join', async (payload) => {
    const idTrajet = payload?.id_trajet;
    if (!idTrajet || typeof idTrajet !== 'string') {
      socket.emit('course:error', { code: 'INVALID_PAYLOAD' });
      return;
    }

    try {
      const autorise = await estParticipant(idTrajet, userId);
      if (!autorise) {
        socket.emit('course:error', { id_trajet: idTrajet, code: 'FORBIDDEN' });
        return;
      }
      socket.join(roomTrajet(idTrajet));
      socket.emit('course:joined', { id_trajet: idTrajet });
    } catch (error) {
      console.error('[courseHandler.join]', error);
      socket.emit('course:error', { id_trajet: idTrajet, code: 'INTERNAL_ERROR' });
    }
  });
}

module.exports = { registerCourseHandlers, roomTrajet };
