import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/config/app_config.dart';
import '../../../core/network/api_service.dart';
import '../../../core/providers/app_providers.dart';
import '../../../core/socket/socket_service.dart';
import '../../../core/storage/secure_storage.dart';
import 'models/message.dart';

// ── Repository chat : historique REST + temps réel socket.io (/chat) ──
//
// Générique par id_conversation — sert aujourd'hui le chat "location de
// véhicule" (passager ↔ propriétaire), réutilisable tel quel plus tard
// pour le chat trajet/support (même moteur backend, voir
// conversationHandler.js / conversationService.js).

class ChatRepository {
  final ApiService _apiService;
  final SocketService _socketService;
  final SecureStorage _secureStorage;
  final AppConfig _config;

  ChatRepository({
    required ApiService apiService,
    required SocketService socketService,
    required SecureStorage secureStorage,
    required AppConfig config,
  }) : _apiService = apiService,
       _socketService = socketService,
       _secureStorage = secureStorage,
       _config = config;

  /// GET /conversations/:id/messages — historique paginé (plus récents en premier)
  Future<List<ChatMessage>> getMessages(
    String idConversation, {
    int page = 1,
    int limit = 30,
  }) async {
    final response = await _apiService.get<Map<String, dynamic>>(
      '/conversations/$idConversation/messages',
      queryParameters: {'page': page, 'limit': limit},
    );
    final data = response['data'];
    final messages = data is Map<String, dynamic> ? data['messages'] : null;
    if (messages is List) {
      return messages
          .map((item) => ChatMessage.fromJson(item as Map<String, dynamic>))
          .toList();
    }
    return [];
  }

  /// Connecte le socket au namespace /chat (idempotent : ne fait rien si déjà connecté).
  Future<void> connecter() async {
    final token = await _secureStorage.getAccessToken();
    await _socketService.connect('${_config.socketUrl}/chat', token ?? '');
  }

  void rejoindreConversation(String idConversation) {
    _socketService.emit('conversation:join', {
      'id_conversation': idConversation,
    });
  }

  void envoyerMessage(String idConversation, String contenu) {
    _socketService.emit('message:send', {
      'id_conversation': idConversation,
      'contenu': contenu,
    });
  }

  void marquerLu(String idConversation) {
    _socketService.emit('message:read', {'id_conversation': idConversation});
  }

  void onNouveauMessage(void Function(ChatMessage message) onMessage) {
    _socketService.on('message:new', (data) {
      if (data is Map) {
        onMessage(ChatMessage.fromJson(Map<String, dynamic>.from(data)));
      }
    });
  }

  void onErreur(void Function(String? code) onError) {
    _socketService.on('message:error', (data) {
      onError(data is Map ? data['code'] as String? : null);
    });
  }

  void detacher() {
    _socketService.off('message:new');
    _socketService.off('message:error');
  }
}

// ── Provider ──────────────────────────────────────────────────────────

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepository(
    apiService: ref.watch(apiServiceProvider),
    socketService: ref.watch(chatSocketServiceProvider),
    secureStorage: ref.watch(secureStorageProvider),
    config: ref.watch(appConfigProvider),
  );
});
