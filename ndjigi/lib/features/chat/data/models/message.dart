// ── Message de conversation (chat) ────────────────────────────────────
//
// Miroir du modèle Prisma `message`, tel que renvoyé par
// GET /conversations/:id/messages (REST, historique) et par l'event
// socket 'message:new' (temps réel) — même forme dans les deux cas.

class ChatMessage {
  final String idMessage;
  final String idConversation;
  final String idExpediteur;
  final String nomExpediteur;
  final String contenu;
  final bool lu;
  final DateTime dateEnvoi;
  final DateTime? dateLecture;

  const ChatMessage({
    required this.idMessage,
    required this.idConversation,
    required this.idExpediteur,
    required this.nomExpediteur,
    required this.contenu,
    this.lu = false,
    required this.dateEnvoi,
    this.dateLecture,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      idMessage: json['id_message'] as String,
      idConversation: json['id_conversation'] as String,
      idExpediteur: json['id_expediteur'] as String,
      nomExpediteur: json['nom_expediteur'] as String? ?? '',
      contenu: json['contenu'] as String? ?? '',
      lu: json['lu'] as bool? ?? false,
      dateEnvoi: DateTime.tryParse(json['date_envoi'] as String? ?? '') ?? DateTime.now(),
      dateLecture: json['date_lecture'] != null ? DateTime.tryParse(json['date_lecture'] as String) : null,
    );
  }
}
