import 'package:flutter/material.dart';

/// Display an empty bed card with hospital bed illustration
class EmptyBedCard extends StatelessWidget {
  final int bedIndex;
  final VoidCallback onAddPatient;

  const EmptyBedCard({
    Key? key,
    required this.bedIndex,
    required this.onAddPatient,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onAddPatient,
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: const Color(0xFF6B8DD6),
            width: 1.5,
            style: BorderStyle.solid,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Hospital bed icon
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: const Color(0xFFE8F0FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Bed outline
                  Container(
                    width: 40,
                    height: 30,
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: const Color(0xFF719EFF),
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  // Bed details
                  Positioned(
                    top: 12,
                    left: 8,
                    right: 8,
                    child: Container(
                      height: 4,
                      decoration: BoxDecoration(
                        color: const Color(0xFF719EFF),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
                  // Legs indicator
                  Positioned(
                    bottom: 6,
                    left: 8,
                    right: 8,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: List.generate(
                        3,
                        (i) => Container(
                          width: 1.5,
                          height: 3,
                          color: const Color(0xFF719EFF),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // "No Patient added yet" text
            Text(
              'No Patient added yet',
              style: TextStyle(
                color: Color(0xFF6B8DD6),
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),

            // "Click to add patient" button text
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFE8F0FF),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                'Click to add patient',
                style: TextStyle(
                  color: Color(0xFF5B9EFF),
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
