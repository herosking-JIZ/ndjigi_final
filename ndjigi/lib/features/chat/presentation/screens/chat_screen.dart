import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/colors.dart';
import '../../../../core/theme/text_styles.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../shared/widgets/app_state_views.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../data/models/message.dart';
import '../providers/chat_provider.dart';

/// Écran de chat générique, paramétré par [idConversation] — sert le chat
/// "location de véhicule" (passager ↔ propriétaire) et pourra servir
/// trajet/support plus tard (même moteur backend).
class ChatScreen extends ConsumerStatefulWidget {
  final String idConversation;

  const ChatScreen({required this.idConversation, super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _envoyer(String contenu) {
    if (contenu.trim().isEmpty) return;
    ref.read(chatProvider(widget.idConversation).notifier).envoyer(contenu);
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(chatProvider(widget.idConversation));
    final idUtilisateur = ref.watch(authProvider).user?.idUtilisateur;

    ref.listen(chatProvider(widget.idConversation), (previous, next) {
      if (next.messages.length > (previous?.messages.length ?? 0)) {
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 250),
              curve: Curves.easeOut,
            );
          }
        });
      }
    });

    return Scaffold(
      backgroundColor: AppColors.surface,
      appBar: AppBar(
        title: const Text('Discussion'),
        centerTitle: true,
        elevation: 0,
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.textPrimary,
      ),
      body: Column(
        children: [
          if (state.errorMessage != null)
            Container(
              width: double.infinity,
              color: AppColors.error.withValues(alpha: 0.1),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                state.errorMessage!,
                style: AppTextStyles.bodySmall.copyWith(color: AppColors.error),
              ),
            ),
          Expanded(
            child: state.isLoading
                ? const LoadingView()
                : state.messages.isEmpty
                    ? const EmptyView(
                        icon: Icons.chat_bubble_outline,
                        message: 'Aucun message pour le moment. Dites bonjour !',
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.all(16),
                        itemCount: state.messages.length,
                        itemBuilder: (context, index) {
                          final message = state.messages[index];
                          return _BulleMessage(
                            message: message,
                            estMoi: message.idExpediteur == idUtilisateur,
                          );
                        },
                      ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      minLines: 1,
                      maxLines: 4,
                      textInputAction: TextInputAction.send,
                      onSubmitted: _envoyer,
                      decoration: InputDecoration(
                        hintText: 'Écrire un message…',
                        filled: true,
                        fillColor: AppColors.background,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide(color: AppColors.border),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    decoration: const BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white, size: 20),
                      onPressed: () => _envoyer(_controller.text),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BulleMessage extends StatelessWidget {
  final ChatMessage message;
  final bool estMoi;

  const _BulleMessage({required this.message, required this.estMoi});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: estMoi ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: estMoi ? AppColors.primary : AppColors.background,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(14),
            topRight: const Radius.circular(14),
            bottomLeft: Radius.circular(estMoi ? 14 : 2),
            bottomRight: Radius.circular(estMoi ? 2 : 14),
          ),
          border: estMoi ? null : Border.all(color: AppColors.border),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (!estMoi)
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  message.nomExpediteur,
                  style: AppTextStyles.labelSmall.copyWith(color: AppColors.textSecondary),
                ),
              ),
            Text(
              message.contenu,
              style: AppTextStyles.bodyMedium.copyWith(color: estMoi ? Colors.white : AppColors.textPrimary),
            ),
            const SizedBox(height: 2),
            Text(
              Formatters.formatTime(message.dateEnvoi),
              style: AppTextStyles.labelSmall.copyWith(
                color: estMoi ? Colors.white.withValues(alpha: 0.7) : AppColors.textHint,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
