import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../providers/nurse_provider.dart'; // ✅ الربط مع البروفايدر

class AppColors {
  static const Color primaryBlue = Color(0xFF7CA1FF);
  static const Color darkBlue = Color(0xFF2C56B3);
  static const Color scaffoldBg = Color(0xFFE9EEF6);
  static const Color cardBg = Color(0xFF2C56B3);
}

class NurseTaskScreen extends StatefulWidget {
  final String nurseId; // ✅ استلام الـ ID لحل إيرور الهوم سكرين

  const NurseTaskScreen({
    Key? key,
    required this.nurseId,
  }) : super(key: key);

  @override
  State<NurseTaskScreen> createState() => _NurseTaskScreenState();
}

class _NurseTaskScreenState extends State<NurseTaskScreen> {
  DateTime selectedDate = DateTime.now();
  late List<DateTime> days;

  @override
  void initState() {
    super.initState();
    _generateDays();

    // ✅ جلب المهام الحقيقية من الـ API عند فتح الشاشة
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NurseProvider>(context, listen: false).fetchNurseTasks(widget.nurseId);
    });
  }

  void _generateDays() {
    days = List.generate(
      14,
          (index) => DateTime.now().add(Duration(days: index)),
    );
  }

  @override
  Widget build(BuildContext context) {
    String formattedTopDate = DateFormat('MMMM d, yyyy').format(selectedDate);

    return Scaffold(
      backgroundColor: AppColors.scaffoldBg,
      body: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // الـ Header الأزرق
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 20),
            decoration: const BoxDecoration(
              color: AppColors.primaryBlue,
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(30)),
            ),
            child: const SafeArea(
              bottom: false,
              child: Center(
                child: Text(
                  "Tasks",
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // تاريخ اليوم والتقويم
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(formattedTopDate, style: const TextStyle(fontSize: 14, color: Colors.grey)),
                const Text(
                  "Today",
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.black87),
                ),
              ],
            ),
          ),

          const SizedBox(height: 15),

          // شريط الأيام الأفقي
          SizedBox(
            height: 100,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 10),
              itemCount: days.length,
              itemBuilder: (context, index) {
                DateTime dayDate = days[index];
                bool isSelected = dayDate.day == selectedDate.day &&
                    dayDate.month == selectedDate.month &&
                    dayDate.year == selectedDate.year;

                return GestureDetector(
                  onTap: () => setState(() => selectedDate = dayDate),
                  child: _buildCalendarDay(
                    DateFormat('MMM').format(dayDate),
                    dayDate.day.toString(),
                    DateFormat('E').format(dayDate).toUpperCase(),
                    isSelected: isSelected,
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 20),

          // قائمة المهام (Dynamic from API)
          Expanded(
            child: Consumer<NurseProvider>(
              builder: (context, nurseProvider, child) {
                if (nurseProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator(color: AppColors.primaryBlue));
                }

                if (nurseProvider.nurseTasks.isEmpty) {
                  return _buildEmptyState();
                }

                return ListView.builder(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 100), // مساحة للـ Nav Bar
                  itemCount: nurseProvider.nurseTasks.length,
                  itemBuilder: (context, index) {
                    final task = nurseProvider.nurseTasks[index];
                    return _buildTaskCard(task);
                  },
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarDay(String month, String day, String weekday, {bool isSelected = false}) {
    return Container(
      width: 60,
      margin: const EdgeInsets.symmetric(horizontal: 5, vertical: 5),
      decoration: BoxDecoration(
        color: isSelected ? AppColors.darkBlue : Colors.white,
        borderRadius: BorderRadius.circular(15),
        border: isSelected ? null : Border.all(color: Colors.grey.shade300),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(month, style: TextStyle(color: isSelected ? Colors.white70 : Colors.grey, fontSize: 12)),
          Text(day, style: TextStyle(color: isSelected ? Colors.white : Colors.black, fontSize: 20, fontWeight: FontWeight.bold)),
          Text(weekday, style: TextStyle(color: isSelected ? Colors.white70 : Colors.grey, fontSize: 12)),
        ],
      ),
    );
  }

  Widget _buildTaskCard(Map<String, dynamic> task) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: AppColors.cardBg,
        borderRadius: BorderRadius.circular(20),
      ),
      child: IntrinsicHeight(
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // استخدام الحقول حسب السواجر (Title أو TaskName)
                  Text(task['title'] ?? task['name'] ?? "Task",
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Icon(Icons.access_time, color: Colors.white70, size: 18),
                      const SizedBox(width: 8),
                      Text('${task['startTime'] ?? '00:00'} to ${task['endTime'] ?? '00:00'}',
                          style: const TextStyle(color: Colors.white, fontSize: 14)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(task['note'] ?? task['description'] ?? "No description provided.",
                      style: const TextStyle(color: Colors.white70, fontSize: 15)),
                ],
              ),
            ),
            const VerticalDivider(color: Colors.white38, thickness: 1, indent: 5, endIndent: 5),
            const SizedBox(width: 10),
            RotatedBox(
              quarterTurns: 3,
              child: Text(
                task['status'] == 1 ? "DONE" : "TO DO", // الحالة من الـ API
                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Text(
        "No tasks assigned for you yet.",
        style: TextStyle(color: AppColors.darkBlue, fontSize: 16),
      ),
    );
  }
}