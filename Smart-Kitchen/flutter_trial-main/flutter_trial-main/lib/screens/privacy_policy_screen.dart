import 'package:flutter/material.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Privacy Policy')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: const Text(
          'Cancellation Policy\n\n'
              'Your booking can be cancelled up to 24 hours before the scheduled time without any charges. '
              'Cancellations made less than 24 hours prior may incur a fee. '
              'Refunds, if applicable, will be processed within 5–7 business days. '
              'We encourage customers to review their booking details before confirming.\n\n'
              'Terms & Conditions\n\n'
              'All users must comply with the platform rules and regulations. '
              'Accounts must be used for personal purposes only. '
              'The company reserves the right to suspend or terminate accounts in case of violations. '
              'All content provided on this platform is for personal use and may not be redistributed. '
              'By using this service, you agree to our terms and acknowledge our privacy practices.\n\n'
              'Privacy Policy\n\n'
              'We value your privacy and are committed to protecting your personal information. '
              'Data collected may include your name, email, and usage information to improve our services. '
              'We do not share personal data with third parties without your consent. '
              'You have the right to request access, correction, or deletion of your data at any time. '
              'By using our services, you consent to the collection and use of information as described in this policy.',
          style: TextStyle(
            fontSize: 14,
            height: 1.5, // line spacing
          ),
        ),
      ),
    );
  }
}
