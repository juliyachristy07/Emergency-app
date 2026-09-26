import 'package:flutter_test/flutter_test.dart';
import 'package:emt_mobile_app/main.dart';

void main() {
  testWidgets('EMTMobileApp renders bottom navigation tabs', (WidgetTester tester) async {
    await tester.pumpWidget(const EMTMobileApp());

    // Verify presence of EMT Field title and bottom navigation bar tabs
    expect(find.text('EMERGENCE FLUTTER MODULE'), findsOneWidget);
    expect(find.text('EMT Field'), findsOneWidget);
    expect(find.text('Hospital Triage'), findsOneWidget);
    expect(find.text('Audit Trail'), findsOneWidget);
    expect(find.text('Schemas'), findsOneWidget);
  });
}
