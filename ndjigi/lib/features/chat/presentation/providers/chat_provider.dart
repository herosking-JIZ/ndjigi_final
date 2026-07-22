import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/chat_repository.dart';
import '../../data/models/message.dart';

// ── État d'une conversation de chat ────────────────────────────────────

class ChatState {
  final bool isLoading;
  final List<ChatMessage> messages;
  final String? errorMessage;

  const ChatState({this.isLoading = true, this.messages = const [], this.errorMessage});

  ChatState copyWith({bool? isLoading, List<ChatMessage>? messages, String? errorMessage}) {
    return ChatState(
      isLoading: isLoading ?? this.isLoading,
      messages: messages ?? this.messages,
      errorMessage: errorMessage,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  final ChatRepository _repository;
  final String idConversation;
  bool _socketBranche = false;

  ChatNotifier({required ChatRepository repository, required this.idConversation})
      : _repository = repository,
        super(const ChatState()) {
    _initialiser();
  }

  Future<void> _initialiser() async {
    await _chargerHistorique();
    await _brancherTempsReel();
  }

  Future<void> _chargerHistorique() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      final messages = await _repository.getMessages(idConversation);
      // L'API renvoie les plus récents en premier ; l'UI affiche du plus ancien au plus récent.
      state = state.copyWith(isLoading: false, messages: messages.reversed.toList());
    } catch (_) {
      state = state.copyWith(isLoading: false, errorMessage: 'Impossible de charger la conversation.');
    }
  }

  Future<void> _brancherTempsReel() async {
    if (_socketBranche) return;
    _socketBranche = true;

    try {
      await _repository.connecter();
      _repository.rejoindreConversation(idConversation);
      _repository.onNouveauMessage((message) {
        if (message.idConversation != idConversation) return;
        if (state.messages.any((m) => m.idMessage == message.idMessage)) return;
        state = state.copyWith(messages: [...state.messages, message]);
      });
      _repository.onErreur((_) {
        state = state.copyWith(errorMessage: 'Erreur lors de l\'envoi du message.');
      });
    } catch (_) {
      // Best-effort : l'historique REST reste disponible même sans temps réel.
    }
  }

  void envoyer(String contenu) {
    final texte = contenu.trim();
    if (texte.isEmpty) return;
    _repository.envoyerMessage(idConversation, texte);
  }

  @override
  void dispose() {
    if (_socketBranche) {
      _repository.detacher();
    }
    super.dispose();
  }
}

final chatProvider = StateNotifierProvider.autoDispose.family<ChatNotifier, ChatState, String>((ref, idConversation) {
  return ChatNotifier(repository: ref.watch(chatRepositoryProvider), idConversation: idConversation);
});
