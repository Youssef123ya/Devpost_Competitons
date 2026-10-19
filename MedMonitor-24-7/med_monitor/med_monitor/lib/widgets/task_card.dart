import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../features/doctor/doctor_add_task_screen.dart';
import '../models/task_model.dart';
import '../providers/task_provider.dart';

class TaskCard extends StatelessWidget {
  final TaskModel task;
  final bool isReadOnly;

  const TaskCard({super.key, required this.task, this.isReadOnly = false});

  @override
  Widget build(BuildContext context) {
    final taskProvider = Provider.of<TaskProvider>(context, listen: false);

    final messenger = ScaffoldMessenger.of(context);
    Future<void> deleteTask() async {
      final confirmed = await showDialog<bool>(
        context: context,
        builder: (context) {
          return AlertDialog(
            title: const Text('Delete Task'),
            content: const Text('Delete this task?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
            ],
          );
        },
      );

      if (confirmed != true) return;

      final success = await taskProvider.deleteTaskOnServer(task.id);
      if (success) {
        messenger.showSnackBar(
          const SnackBar(content: Text('Task deleted successfully')),
        );
      } else {
        messenger.showSnackBar(
          const SnackBar(content: Text('Failed to delete task')),
        );
      }
    }

    Future<void> editTask() async {
      final didUpdate = await Navigator.push<bool?>(
        context,
        MaterialPageRoute(
          builder: (_) => DoctorAddTaskScreen(existingTask: task),
        ),
      );
      if (didUpdate == true) {
        await taskProvider.fetchAllTasks();
      }
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: task.color,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        task.title,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        task.patientName.isNotEmpty ? task.patientName : task.patientId,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Colors.white70,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.access_time, color: Colors.white70, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '${task.startTime} to ${task.endTime}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.white,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  task.note,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Colors.white70,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          if (!isReadOnly)
            Column(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_horiz, color: Colors.white, size: 20),
                  color: Colors.white,
                  onSelected: (value) {
                    if (value == 'delete') {
                      deleteTask();
                    } else if (value == 'edit') {
                      editTask();
                    }
                  },
                  itemBuilder: (ctx) => [
                    PopupMenuItem(
                      value: 'edit',
                      child: Row(children: const [
                        Icon(Icons.edit, color: Color(0xFF4D86FF), size: 18),
                        SizedBox(width: 8),
                        Text('Edit', style: TextStyle(color: Colors.black87)),
                      ]),
                    ),
                    PopupMenuItem(
                      value: 'delete',
                      child: Row(children: const [
                        Icon(Icons.delete, color: Colors.red, size: 18),
                        SizedBox(width: 8),
                        Text('Delete', style: TextStyle(color: Colors.red)),
                      ]),
                    ),
                  ],
                ),
                Container(
                  margin: const EdgeInsets.only(top: 12),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  decoration: BoxDecoration(
                    border: Border(
                      left: BorderSide(color: Colors.white.withAlpha(77), width: 1),
                    ),
                  ),
                  child: RotatedBox(
                    quarterTurns: 3,
                    child: Text(
                      task.status,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                ),
              ],
            )
          else
            Container(
              margin: const EdgeInsets.only(left: 12),
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
              decoration: BoxDecoration(
                border: Border(
                  left: BorderSide(color: Colors.white.withAlpha(77), width: 1),
                ),
              ),
              child: RotatedBox(
                quarterTurns: 3,
                child: Text(
                  task.status,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
