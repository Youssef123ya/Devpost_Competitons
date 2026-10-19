import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

class DateStrip extends StatelessWidget {
  final DateTime selectedDate;
  final Function(DateTime) onDateSelected;

  const DateStrip({
    Key? key,
    required this.selectedDate,
    required this.onDateSelected,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    List<DateTime> days = List.generate(14, (index) => DateTime.now().add(Duration(days: index)));

    return SizedBox(
      height: 100,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: days.length,
        itemBuilder: (context, index) {
          DateTime dayDate = days[index];
          bool isSelected = dayDate.year == selectedDate.year &&
              dayDate.month == selectedDate.month &&
              dayDate.day == selectedDate.day;

          return GestureDetector(
            onTap: () => onDateSelected(dayDate),
            child: Container(
              width: 70,
              margin: const EdgeInsets.symmetric(horizontal: 5, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF3B5BB5) : Colors.white,
                borderRadius: BorderRadius.circular(15),
                border: isSelected
                    ? null
                    : Border.all(color: Colors.grey.shade300, width: 1),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    DateFormat('MMM').format(dayDate),
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected ? Colors.white70 : Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    dayDate.day.toString(),
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? Colors.white : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    DateFormat('E').format(dayDate).toUpperCase(),
                    style: TextStyle(
                      fontSize: 11,
                      color: isSelected ? Colors.white70 : Colors.grey,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
