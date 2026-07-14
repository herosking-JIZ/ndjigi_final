import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/config/app_config.dart';
import 'app/bootstrap/bootstrap.dart';
import 'app/app.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await bootstrap(flavor: Flavor.dev);
  runApp(
    const ProviderScope(
      child: App(),
    ),
  );
}
