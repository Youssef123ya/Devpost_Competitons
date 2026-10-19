import 'package:flutter/material.dart';

class CustomCriticalAlert extends StatelessWidget {
  final String patientName;
  final String unitName;
  final String time; // 👈 ضفنا متغير الوقت هنا عشان يتغير حسب حالة السيرفر

  const CustomCriticalAlert({
    Key? key,
    required this.patientName,
    required this.unitName,
    required this.time,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 10,
                  offset: Offset(0, 5),
                )
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                /// 🔔 Header: Alert
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    Icon(Icons.notifications_active, color: Colors.red, size: 28),
                    SizedBox(width: 8),
                    Text(
                      "Alert",
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Colors.red,
                      ),
                    ),
                    Flexible(
                      child: Text(
                        "  :  Critical Patient Condition",
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                        ),
                        overflow: TextOverflow.visible,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),

                /// 📝 Body Text
                RichText(
                  textAlign: TextAlign.center,
                  text: TextSpan(
                    style: const TextStyle(fontSize: 16, color: Colors.black, height: 1.5),
                    children: [
                      const TextSpan(text: "Patient [ "),
                      TextSpan(
                        text: patientName, // 👈 الاسم المتغير
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                      const TextSpan(text: " ] in Unit [ "),
                      TextSpan(
                        text: unitName, // 👈 رقم اليونت المتغير
                        style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.red),
                      ),
                      const TextSpan(text: " ] has Critical Condition...\n"),
                      const TextSpan(
                        text: "Please Review Immediately",
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          color: Colors.red,
                          fontSize: 18,
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 8),

                /// ⏰ Time
                Align(
                  alignment: Alignment.centerRight,
                  child: Text(
                    "Time $time", // 👈 الوقت المتغير
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}