import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'dart:async';
import '../../models/ai_prediction_model.dart';
import '../../models/user_model.dart';

class AiAlertScreen extends StatefulWidget {
  final AiPredictionData prediction;
  final UserModel patient;

  const AiAlertScreen({
    super.key,
    required this.prediction,
    required this.patient,
  });

  @override
  State<AiAlertScreen> createState() => _AiAlertScreenState();
}

class _AiAlertScreenState extends State<AiAlertScreen> with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _shakeController;
  late Animation<double> _borderGlow;

  @override
  void initState() {
    super.initState();
    
    // 1. Pulsing Border Animation (for Critical)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat(reverse: true);

    _borderGlow = Tween<double>(begin: 1.0, end: 5.0).animate(_pulseController);

    // 2. Shaking Icon Animation
    _shakeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _shakeController.dispose();
    super.dispose();
  }

  bool get isCritical => widget.prediction.alertLevel.toLowerCase() == 'critical';

  @override
  Widget build(BuildContext context) {
    final bgColor = isCritical ? const Color(0xFF1A0A0A) : const Color(0xFF1A1410);
    final accentColor = isCritical ? const Color(0xFFFF4444) : const Color(0xFFFFD700);
    final timeStr = DateFormat('hh:mm a').format(DateTime.parse(widget.prediction.timestamp));

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: AnimatedBuilder(
          animation: _borderGlow,
          builder: (context, child) {
            return Container(
              margin: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border.all(
                  color: isCritical ? accentColor.withOpacity(_pulseController.value) : accentColor,
                  width: isCritical ? _borderGlow.value : 2,
                ),
                borderRadius: BorderRadius.circular(20),
              ),
              child: child,
            );
          },
          child: Padding(
            padding: const EdgeInsets.all(20.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // SECTION 1: HEADER
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        RotationTransition(
                          turns: Tween(begin: -0.05, end: 0.05).animate(_shakeController),
                          child: Icon(isCritical ? Icons.notifications_active : Icons.warning, color: accentColor, size: 32),
                        ),
                        const SizedBox(width: 12),
                        Text(
                          isCritical ? "CRITICAL CONDITION" : "WARNING ALERT",
                          style: TextStyle(color: accentColor, fontSize: 22, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Text(timeStr, style: const TextStyle(color: Colors.white54, fontSize: 14)),
                  ],
                ),
                const Divider(color: Colors.white24, height: 40),

                // SECTION 2: PATIENT INFO
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                  child: Row(
                    children: [
                      const CircleAvatar(backgroundColor: Colors.white24, child: Icon(Icons.person, color: Colors.white)),
                      const SizedBox(width: 16),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text("Patient: ${widget.patient.userName}", style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          Text("Unit: A | Bed: 1", style: const TextStyle(color: Colors.white70, fontSize: 14)),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // SECTION 3: PRIMARY CONCERN
                const Text("PRIMARY CONCERN:", style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Text(widget.prediction.mainReason, style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Row(
                  children: [
                    Text("STATUS:", style: TextStyle(color: accentColor, fontSize: 14, fontWeight: FontWeight.bold)),
                    const SizedBox(width: 8),
                    Icon(Icons.arrow_upward, color: accentColor, size: 16),
                    Text(" HIGH", style: TextStyle(color: accentColor, fontSize: 14, fontWeight: FontWeight.w900)),
                  ],
                ),
                const SizedBox(height: 24),

                // SECTION 4: ABNORMAL VITALS LIST
                Text("ABNORMAL VITALS (${widget.prediction.abnormalCount} detected):", style: const TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 12),
                Expanded(
                  child: ListView.separated(
                    itemCount: widget.prediction.abnormalVitals.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      return _buildVitalItem(widget.prediction.abnormalVitals[index], accentColor);
                    },
                  ),
                ),

                // SECTION 5: MODEL CONFIDENCE
                const SizedBox(height: 20),
                const Text("MODEL CONFIDENCE:", style: TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 8),
                _buildConfidenceBar(widget.prediction.confidence),

                // SECTION 6: ACTION TEXT
                const SizedBox(height: 24),
                Center(
                  child: Text(
                    isCritical ? "PLEASE REVIEW IMMEDIATELY" : "PLEASE CHECK SOON",
                    style: TextStyle(color: accentColor, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 1.2),
                  ),
                ),
                const SizedBox(height: 24),

                // SECTION 7: BUTTONS
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(backgroundColor: accentColor, foregroundColor: Colors.white, padding: const EdgeInsets.symmetric(vertical: 16)),
                        child: const Text("ACKNOWLEDGE", style: TextStyle(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    if (isCritical) ...[
                      const SizedBox(width: 12),
                      Container(
                        decoration: BoxDecoration(color: const Color(0xFF331111), borderRadius: BorderRadius.circular(8)),
                        child: IconButton(
                          onPressed: () {},
                          icon: const Icon(Icons.phone_in_talk, color: Colors.white),
                          padding: const EdgeInsets.all(14),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildVitalItem(String text, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(border: Border.all(color: Colors.white10), borderRadius: BorderRadius.circular(8)),
      child: Row(
        children: [
          Icon(Icons.close, color: color, size: 18),
          const SizedBox(width: 12),
          Expanded(child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 14))),
        ],
      ),
    );
  }

  Widget _buildConfidenceBar(double confidence) {
    Color barColor = confidence > 85 ? Colors.green : (confidence > 70 ? Colors.orange : Colors.red);
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: confidence / 100,
            minHeight: 12,
            backgroundColor: Colors.white10,
            color: barColor,
          ),
        ),
        const SizedBox(height: 4),
        Align(
          alignment: Alignment.centerRight,
          child: Text("${confidence.toStringAsFixed(1)}%", style: TextStyle(color: barColor, fontWeight: FontWeight.bold)),
        ),
      ],
    );
  }
}
