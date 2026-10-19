import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/task_provider.dart';
import '../../widgets/task_card.dart';
import '../../widgets/date_strip.dart';

class DoctorTasksScreen extends StatefulWidget {
  final bool fromPatientDetails;
  final bool showBackButton;
  final String? patientFilter;
  final String? patientId;
  final String? patientName;
  final String? nurseId;
  final String? nurseName;

  const DoctorTasksScreen({
    super.key,
    this.fromPatientDetails = false,
    this.showBackButton = false,
    this.patientFilter,
    this.patientId,
    this.patientName,
    this.nurseId,
    this.nurseName,
  });

  @override
  State<DoctorTasksScreen> createState() => _DoctorTasksScreenState();
}

class _DoctorTasksScreenState extends State<DoctorTasksScreen> {
  late DateTime _selectedDate;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<TaskProvider>(context, listen: false).fetchAllTasks();
    });
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
              child: widget.showBackButton || widget.fromPatientDetails
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
          // Date and Add Task Button
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
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
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7CA1FF),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                    ),
                  ),
                  onPressed: () async {
                    final taskProvider = Provider.of<TaskProvider>(context, listen: false);
                    await Navigator.pushNamed(
                      context,
                      '/add-task',
                      arguments: {
                        'isEditing': false,
                        if (widget.patientId != null) 'patientId': widget.patientId,
                        if (widget.patientName != null) 'patientName': widget.patientName,
                        if (widget.nurseId != null) 'nurseId': widget.nurseId,
                        if (widget.nurseName != null) 'nurseName': widget.nurseName,
                      },
                    );
                    if (!mounted) return;
                    await taskProvider.fetchAllTasks();
                  },
                  icon: const Icon(Icons.add, color: Colors.white, size: 20),
                  label: const Text(
                    "Add Task",
                    style: TextStyle(color: Colors.white, fontSize: 14),
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
                final allTasks = taskProvider.getTasksForDate(_selectedDate);
                final tasksForDate = widget.patientFilter != null && widget.patientFilter!.trim().isNotEmpty
                    ? allTasks.where((task) {
                        final filter = widget.patientFilter!.toLowerCase();
                        return task.patientName.toLowerCase().contains(filter) ||
                            task.nurseName.toLowerCase().contains(filter) ||
                            task.title.toLowerCase().contains(filter) ||
                            task.note.toLowerCase().contains(filter);
                      }).toList()
                    : allTasks;

                if (tasksForDate.isEmpty) {
                  return _buildEmptyState();
                }

                return ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                  itemCount: tasksForDate.length,
                  itemBuilder: (context, index) {
                    return TaskCard(
                      task: tasksForDate[index],
                      isReadOnly: false,
                    );
                  },
                );
              },
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
            'assets/doctor.png',
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
            "Create a task to get started",
            style: TextStyle(fontSize: 14, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}
