// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.


import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_trial/main.dart';

void main() {
  testWidgets('App initial route test', (WidgetTester tester) async {

    // Build app normally
    await tester.pumpWidget(const SmartKitchenApp());

    // Navigate manually to login
    await tester.tap(find.text('Get Started'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Next'));
    await tester.pumpAndSettle();

    // Check login screen
    expect(find.text("Enter Your Email"), findsOneWidget);
    expect(find.text("Enter Your Password"), findsOneWidget);
  });
}