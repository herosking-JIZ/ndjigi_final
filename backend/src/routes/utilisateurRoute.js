// ─────────────────────────────────────────────────────────────
// ROUTES/UTILISATEURROUTE.JS
// ─────────────────────────────────────────────────────────────
const express                 = require('express');
const UtilisateurController   = require('../controllers/utilisateurController');
const { authenticate }        = require('../middlewares/authenticate');
const { authorize, can }      = require('../middlewares/authorize');



const utilisateurRoute = express.Router();
utilisateurRoute.use(authenticate);

// ── Profil connecté ──────────────────────────────────────────

// POST /utilisateur/sync — synchronise les données après Keycloak
utilisateurRoute.post  ('/sync',                      can('profil:lire'),       UtilisateurController.syncUser);

// GET /utilisateur/profil — voir son profil
utilisateurRoute.get   ('/profil',                    can('profil:lire'),       UtilisateurController.monProfil);

// PATCH /utilisateur/profil — modifier son profil


utilisateurRoute.patch ('/profil',                    can('profil:modifier'),   UtilisateurController.updateProfil);
// PATCH /utilisateur/mot-de-passe — changer son mot de passe



// ── Documents ────────────────────────────────────────────────



// ── Admin ────────────────────────────────────────────────────
// POST /utilisateurs — créer un nouvel utilisateur (IT ou Admin)

utilisateurRoute.post  ('/',                          authorize('admin', 'it'),  UtilisateurController.create);

// GET /utilisateurs — lister tous les utilisateurs (admin seulement)

utilisateurRoute.get   ('/',                          authorize('admin'),        UtilisateurController.findAll);

// GET /utilisateurs/:id — voir un utilisateur précis (admin seulement)


utilisateurRoute.get   ('/:id',                       authorize('admin'),        UtilisateurController.findOne);

// PATCH /utilisateurs/:id — modifier un utilisateur (admin seulement)

utilisateurRoute.patch ('/:id',                       authorize('admin'),        UtilisateurController.update);

// DELETE /utilisateurs/:id — supprimer un utilisateur (admin seulement)


utilisateurRoute.delete('/:id',                       authorize('admin'),        UtilisateurController.delete);

//modifier le statut d'un utilisateur (actif/inactif)

utilisateurRoute.patch ('/:id/statut',                authorize('admin'),        UtilisateurController.changerStatut);


// PATCH /utilisateurs/:id/roles — ajouter un rôle à un utilisateur (admin seulement)
utilisateurRoute.post  ('/:id/roles',                 authorize('admin'),        UtilisateurController.ajouterRole);

// DELETE /utilisateurs/:id/roles/:role — retirer un rôle d'un utilisateur (admin seulement)

utilisateurRoute.delete('/:id/roles/:role',           authorize('admin'),        UtilisateurController.retirerRole);


module.exports = utilisateurRoute;
