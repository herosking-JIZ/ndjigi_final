import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../course/data/course_repository.dart';
import '../../../course/data/models/course.dart';

final filtreHistoriqueProvider = StateProvider<String>((ref) => 'Tous');

/// L'API applique elle-même le scope du chauffeur connecté.
final chauffeurHistoriqueProvider = FutureProvider.autoDispose<List<Course>>((
  ref,
) async {
  final courses = await ref.watch(courseRepositoryProvider).getHistorique();
  final filtre = ref.watch(filtreHistoriqueProvider);
  if (filtre == 'VTC') {
    return courses.where((course) => course.typeTrajet == 'vtc').toList();
  }
  if (filtre == 'Covoiturage') {
    return courses
        .where((course) => course.typeTrajet == 'covoiturage')
        .toList();
  }
  return courses;
});
