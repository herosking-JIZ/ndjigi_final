import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/providers/app_providers.dart';

/// Affiche une image servie par un endpoint backend protégé (ex: `/photos/:id/file`)
/// en attachant le token d'accès en `Authorization` header, ce qu'`Image.network`
/// seul ne fait pas.
class AuthenticatedImage extends ConsumerStatefulWidget {
  final String url;
  final BoxFit fit;
  final double? width;
  final double? height;
  final Widget Function(BuildContext context) placeholderBuilder;

  const AuthenticatedImage({
    required this.url,
    required this.placeholderBuilder,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    super.key,
  });

  @override
  ConsumerState<AuthenticatedImage> createState() => _AuthenticatedImageState();
}

class _AuthenticatedImageState extends ConsumerState<AuthenticatedImage> {
  String? _token;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadToken();
  }

  Future<void> _loadToken() async {
    final token = await ref.read(secureStorageProvider).getAccessToken();
    if (!mounted) return;
    setState(() {
      _token = token;
      _loading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return widget.placeholderBuilder(context);
    }

    if (_token == null || _token!.isEmpty) {
      return widget.placeholderBuilder(context);
    }

    return CachedNetworkImage(
      imageUrl: widget.url,
      httpHeaders: {'Authorization': 'Bearer $_token'},
      fit: widget.fit,
      width: widget.width,
      height: widget.height,
      placeholder: (context, url) => widget.placeholderBuilder(context),
      errorWidget: (context, url, error) => widget.placeholderBuilder(context),
    );
  }
}
