/**
 * SOCKET/SERVICES/CONVERSATIONSERVICE.JS
 * Service d'accès aux données pour les conversations (Prisma, sans Express/Socket)
 *
 * - isParticipant(id_conversation, id_utilisateur) → boolean
 * - listConversationIds(id_utilisateur) → string[]
 * - createMessage(idConversation, idExpediteur, nomExpediteur, contenu) → message créé
 * - markConversationRead(idConversation, idLecteur) → { count, date_lecture }
 */

const { prisma } = require('../../config/db');

/**
 * Vérifie si un utilisateur est participant d'une conversation
 * @param {string} idConversation - UUID de la conversation
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @returns {Promise<boolean>} true si participant, false sinon
 */
async function isParticipant(idConversation, idUtilisateur) {
  try {
    const participant = await prisma.conversation_participant.findFirst({
      where: {
        id_conversation: idConversation,
        id_utilisateur: idUtilisateur
      }
    });
    return !!participant;
  } catch (err) {
    console.error(`❌ Erreur isParticipant: ${err.message}`);
    return false;
  }
}

/**
 * Liste tous les IDs de conversations pour un utilisateur
 * @param {string} idUtilisateur - UUID de l'utilisateur
 * @returns {Promise<string[]>} Tableau des IDs de conversations
 */
async function listConversationIds(idUtilisateur) {
  try {
    const participants = await prisma.conversation_participant.findMany({
      where: { id_utilisateur: idUtilisateur },
      select: { id_conversation: true }
    });
    return participants.map(p => p.id_conversation);
  } catch (err) {
    console.error(`❌ Erreur listConversationIds: ${err.message}`);
    return [];
  }
}

/**
 * Crée un message dans une conversation
 * @param {string} idConversation - UUID de la conversation
 * @param {string} idExpediteur - UUID de l'utilisateur (source serveur)
 * @param {string} nomExpediteur - Prénom de l'utilisateur (source serveur)
 * @param {string} contenu - Contenu du message
 * @returns {Promise<Object>} Message créé avec { id_message, id_conversation, id_expediteur, nom_expediteur, contenu, lu, date_envoi, date_lecture }
 */
async function createMessage(idConversation, idExpediteur, nomExpediteur, contenu) {
  try {
    const message = await prisma.message.create({
      data: {
        id_conversation: idConversation,
        id_expediteur: idExpediteur,
        nom_expediteur: nomExpediteur,
        contenu: contenu
      }
    });
    return message;
  } catch (err) {
    console.error(`❌ Erreur createMessage: ${err.message}`);
    throw err;
  }
}

/**
 * Marque les messages comme lus dans une conversation (messages des AUTRES expéditeurs seulement)
 * @param {string} idConversation - UUID de la conversation
 * @param {string} idLecteur - UUID de l'utilisateur lecteur (source serveur)
 * @returns {Promise<Object>} { count: nombre de messages marqués, date_lecture: date utilisée }
 */
async function markConversationRead(idConversation, idLecteur) {
  try {
    const dateNow = new Date();
    const result = await prisma.message.updateMany({
      where: {
        id_conversation: idConversation,
        lu: false,
        id_expediteur: { not: idLecteur }
      },
      data: {
        lu: true,
        date_lecture: dateNow
      }
    });
    return {
      count: result.count,
      date_lecture: dateNow
    };
  } catch (err) {
    console.error(`❌ Erreur markConversationRead: ${err.message}`);
    throw err;
  }
}

module.exports = {
  isParticipant,
  listConversationIds,
  createMessage,
  markConversationRead
};
