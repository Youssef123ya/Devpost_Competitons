import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'activity_log_screen.dart';

class GasControlScreen extends StatefulWidget {
  const GasControlScreen({super.key});

  @override
  State<GasControlScreen> createState() => _GasControlScreenState();
}

class _GasControlScreenState extends State<GasControlScreen> {
  final ApiService apiService = ApiService();

  bool locked = true;
  bool isLoading = false;

  Future<void> unlockGas() async {
    setState(() {
      isLoading = true;
    });

    try {
      await apiService.toggleGas(
        enableGas: true,
      );

      if (!mounted) return;

      setState(() {
        locked = false;
      });

      Navigator.pop(context);
    } catch (e) {
      debugPrint("UNLOCK GAS ERROR: $e");

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(e.toString()),
        ),
      );
    }

    if (!mounted) return;

    setState(() {
      isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xffF7F7F7),
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(30),
                decoration: BoxDecoration(
                  color: const Color(0xffEEF3F6),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Icon(
                  Icons.lock,
                  size: 70,
                  color: Colors.blue,
                ),
              ),

              const SizedBox(height: 25),

              const Text(
                "Gas is Safety Locked",
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),

              const SizedBox(height: 10),

              const Text(
                "No gas flow detected. All burners are secure.",
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey,
                  fontSize: 14,
                  height: 1.5,
                ),
              ),

              const SizedBox(height: 35),

              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  isLoading
                      ? const CircularProgressIndicator()
                      : Switch(
                    value: !locked,
                    activeColor: Colors.blue,
                    onChanged: (value) async {
                      if (value) {
                        await unlockGas();
                      }
                    },
                  ),
                ],
              ),

              const SizedBox(height: 35),

              GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const ActivityLogScreen(),
                    ),
                  );
                },
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(
                    vertical: 16,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xffEEF3F6),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: const Center(
                    child: Text(
                      "View Activity Log",
                      style: TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}