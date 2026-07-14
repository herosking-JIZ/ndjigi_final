/**
 * SOCKET/IOREGISTRY.JS
 * Permet d'accéder à l'instance Socket.io depuis du code qui n'a pas de
 * référence directe (contrôleurs REST, jobs planifiés) — l'instance io
 * n'était auparavant accessible que dans app.js au moment de l'init.
 */

let ioInstance = null;

function setIO(io) {
  ioInstance = io;
}

function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.io n\'est pas encore initialisé.');
  }
  return ioInstance;
}

module.exports = { setIO, getIO };
