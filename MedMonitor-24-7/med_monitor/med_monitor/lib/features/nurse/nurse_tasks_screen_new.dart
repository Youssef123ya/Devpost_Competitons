import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/task_provider.dart';
import '../../widgets/task_card.dart';
import '../../widgets/date_strip.dart';

class NurseTasksScreen extends StatefulWidget {
  final String nurseId;
  final bool fromPatientDetails;
  final String? patientId;
  final String? patientName;

  const NurseTasksScreen({
    super.key,
    required this.nurseId,
    this.fromPatientDetails = false,
    this.patientId,
    this.patientName,
  });

  @override
  State<NurseTasksScreen> createState() => _NurseTasksScreenState();
}

class _NurseTasksScreenState extends State<NurseTasksScreen> {
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE9EEF6),
      body: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: const BoxDecoration(
              color: Color(0xFF7CA1FF),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
            ),
            child: SafeArea(
              bottom: false,
              child: widget.fromPatientDetails
                ? Stack(
                    children: [
                      const Center(
                        child: Text(
                          "Tasks",
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ),
                      Positioned(
                        left: 0,
                        top: 0,
                        bottom: 0,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back, color: Colors.white, size: 28),
                          onPressed: () => Navigator.of(context).pop(),
                        ),
                      ),
                    ],
                  )
                : const Center(
                    child: Text(
                      "Tasks",
                      style: TextStyle(
                        fontSize: 26,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
            ),
          ),
          const SizedBox(height: 20),
          // Date (No Add Task Button for Nurse)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  DateFormat('MMMM d, yyyy').format(_selectedDate),
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
                const Text(
                  "Today",
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF3B5BB5),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Date Strip
          DateStrip(
            selectedDate: _selectedDate,
            onDateSelected: (date) {
              setState(() => _selectedDate = date);
            },
          ),
          const SizedBox(height: 10),
          // Tasks List
          Expanded(
            child: Consumer<TaskProvider>(
              builder: (context, taskProvider, child) {
                final tasksForDate = taskProvider.getTasksForDate(_selectedDate);

                if (tasksForDate.isEmpty) {
                  return _buildEmptyState();
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: tasksForDate.length,
                  itemBuilder: (context, index) {
                    return TaskCard(
                      task: tasksForDate[index],
                      isReadOnly: true,
                    );
                  },
                );              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Image.asset(
            'assets/nurse.png',
            width: 120,
            height: 120,
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) => const Icon(
              Icons.task_outlined,
              size: 80,
              color: Colors.grey,
            ),
          ),
          const SizedBox(height: 20),
          const Text(
            "No tasks added yet!",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF3B5BB5),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            "Your assigned tasks will appear here",
            style: TextStyle(fontSize: 14, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
