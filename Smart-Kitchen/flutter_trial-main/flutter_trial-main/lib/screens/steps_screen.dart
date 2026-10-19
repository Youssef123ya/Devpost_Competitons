import 'package:flutter/material.dart';
import '../services/api_service.dart';

class StepsScreen extends StatefulWidget {
  final String recipeId;

  const StepsScreen({
    super.key,
    required this.recipeId,
  });

  @override
  State<StepsScreen> createState() => _StepsScreenState();
}

class _StepsScreenState extends State<StepsScreen> {
  late Future<List<Map<String, dynamic>>> stepsFuture;

  @override
  void initState() {
    super.initState();

    stepsFuture = ApiService().getRecipeSteps(
      widget.recipeId,
    );
  }

  Widget stepItem({
    required String title,
    required String desc,
    required bool isLast,
  }) {
    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [

          /// TIMELINE
          Column(
            children: [
              Container(
                width: 2,
                height: 10,
                color: Colors.grey.shade300,
              ),

              Container(
                width: 10,
                height: 10,
                decoration: const BoxDecoration(
                  color: Colors.black,
                  shape: BoxShape.circle,
                ),
              ),

              Expanded(
                child: Container(
                  width: 2,
                  color: isLast
                      ? Colors.transparent
                      : Colors.grey.shade300,
                ),
              ),
            ],
          ),

          const SizedBox(width: 12),

          /// CONTENT
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [

                Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),

                const SizedBox(height: 8),

                Text(
                  desc,
                  style: TextStyle(
                    color: Colors.grey.shade700,
                    height: 1.5,
                    fontSize: 14,
                  ),
                ),

                const SizedBox(height: 24),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,

      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
        title: const Text(
          "Instructions",
          style: TextStyle(
            fontWeight: FontWeight.w600,
          ),
        ),
      ),

      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: stepsFuture,

        builder: (context, snapshot) {

          if (snapshot.connectionState ==
              ConnectionState.waiting) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(
                snapshot.error.toString(),
              ),
            );
          }

          final steps = snapshot.data ?? [];

          if (steps.isEmpty) {
            return const Center(
              child: Text(
                "No steps found",
              ),
            );
          }

          return Padding(
            padding: const EdgeInsets.all(16),

            child: ListView.builder(
              itemCount: steps.length,

              itemBuilder: (context, index) {

                final step = steps[index];

                final title =
                    "Step ${step["stepNumber"] ?? index + 1}";

               final desc =
    step["stepDescription"]?.toString() ?? "";

                return stepItem(
                  title: title,
                  desc: desc,
                  isLast: index == steps.length - 1,
                );
              },
            ),
          );
        },
      ),
    );
  }
}