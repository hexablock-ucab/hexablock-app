import 'package:flutter_test/flutter_test.dart';
import 'package:hexablock_app/composition_root.dart';

void main() {
  testWidgets('should_show_the_suite_name_when_the_app_starts', (tester) async {
    final app = const CompositionRoot().buildApp();

    await tester.pumpWidget(app);

    expect(find.text('HexaBlock Suite'), findsOneWidget);
  });
}
