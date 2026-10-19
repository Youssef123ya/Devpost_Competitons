import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../models/task_model.dart';
import '../models/user_model.dart';
import '../services/dio_client.dart';

class TaskProvider extends ChangeNotifier {
  final List<TaskModel> _tasks = [];
  final Map<String, String> _userNamesById = {};
  final Map<String, int> _taskColors = {};
  static const String _taskColorKeyPrefix = 'task_color_';
  bool _isLoading = false;

  List<TaskModel> get tasks => _tasks;
  bool get isLoading => _isLoading;

  List<TaskModel> getTasksForDate(DateTime date) {
    return _tasks.where((t) =>
      t.date.year == date.year &&
      t.date.month == date.month &&
      t.date.day == date.day
    ).toList();
  }

  String _taskColorPrefKey(String taskId) => '$_taskColorKeyPrefix$taskId';

  Color getTaskColor(String taskId) {
    return _taskColors[taskId] != null ? Color(_taskColors[taskId]!) : Colors.blue;
  }

  Future<void> _loadSavedTaskColors() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keys = prefs.getKeys().where((k) => k.startsWith(_taskColorKeyPrefix));
      for (final key in keys) {
        final colorValue = prefs.getInt(key);
        if (colorValue != null) {
          final taskId = key.substring(_taskColorKeyPrefix.length);
          _taskColors[taskId] = colorValue;
        }
      }
    } catch (e) {
      debugPrint('SharedPreferences load task colors error: $e');
    }
  }

  Future<void> _saveTaskColorToPrefs(String taskId, Color color) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setInt(_taskColorPrefKey(taskId), color.value);
      _taskColors[taskId] = color.value;
    } catch (e) {
      debugPrint('SharedPreferences save task color error: $e');
    }
  }

  Future<void> _loadUserNames() async {
    try {
      final response = await DioClient.dio.get('/Users');
      List<dynamic> usersList = [];

      if (response.data is Map && response.data['rows'] is List) {
        usersList = response.data['rows'] as List;
      } else if (response.data is Map && response.data['data'] is List) {
        usersList = response.data['data'] as List;
      } else if (response.data is List) {
        usersList = response.data as List;
      }

      final allUsers = usersList
          .whereType<Map<String, dynamic>>()
          .map(UserModel.fromJson)
          .toList();

      for (final user in allUsers) {
        if (user.id != null && user.userName != null && user.userName!.isNotEmpty) {
          _userNamesById[user.id!] = user.userName!;
        }
      }
    } catch (e) {
      debugPrint('Dio Error (Load user names): $e');
    }
  }

  void addTask(TaskModel task) {
    _tasks.add(task);
    notifyListeners();
  }

  void removeTask(String taskId) {
    _tasks.removeWhere((t) => t.id == taskId);
    notifyListeners();
  }

  void updateTask(TaskModel updatedTask) {
    final index = _tasks.indexWhere((t) => t.id == updatedTask.id);
    if (index != -1) {
      _tasks[index] = updatedTask;
      notifyListeners();
    }
  }

  void clear() {
    _tasks.clear();
    notifyListeners();
  }

  Future<void> fetchAllTasks() async {
    _isLoading = true;
    notifyListeners();

    await _loadSavedTaskColors();
    await _loadUserNames();

    try {
      final response = await DioClient.dio.get('/Task/GetAll');
      if (response.statusCode == 200) {
        final data = response.data;
        final rawTasks = data is Map && data['rows'] is List
            ? data['rows'] as List
            : data is Map && data['data'] is List
                ? data['data'] as List
                : data is List
                    ? data
                    : [];
        _tasks
          ..clear()
          ..addAll(rawTasks
              .whereType<Map<String, dynamic>>()
              .map((item) {
                final task = TaskModel.fromJson(item);
                final patientName = _userNamesById[task.patientId] ?? task.patientName;
                final nurseName = _userNamesById[task.nurseId] ?? task.nurseName;
                return task.copyWith(
                  patientName: patientName.isNotEmpty ? patientName : task.patientId,
                  nurseName: nurseName.isNotEmpty ? nurseName : task.nurseId,
                  color: getTaskColor(task.id),
                );
              }));
        debugPrint('Tasks loaded: ${_tasks.length}');
        debugPrint('Tasks: ${_tasks.map((t) => t.title).toList()}');
      }
    } catch (e) {
      debugPrint('Dio Error (Fetch Tasks): $e');
      _tasks.clear();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<String?> createTaskOnServer(TaskModel task) async {
    try {
      final requestBody = task.toJson();
      
      // 🔴 STEP 1: PRINT THE EXACT JSON BEING SENT
      print('');
      print('╔════════════════════════════════════════════════════════════════╗');
      print('║          📤 TASK PROVIDER - createTaskOnServer()               ║');
      print('╚════════════════════════════════════════════════════════════════╝');
      print('📤 POST ${DioClient.baseUrl}/Task/Create');
      print('');
      print('🟢 STEP 1: EXACT REQUEST BODY JSON BEING SENT:');
      print(jsonEncode(requestBody));
      print('');
      print('📋 Field Details:');
      print('  - id: ${requestBody['id']} (type: ${requestBody['id'].runtimeType})');
      print('  - title: ${requestBody['title']} (type: ${requestBody['title'].runtimeType})');
      print('  - notes: ${requestBody['notes']} (type: ${requestBody['notes'].runtimeType})');
      print('  - startTime: ${requestBody['startTime']} (type: ${requestBody['startTime'].runtimeType})');
      print('  - endTime: ${requestBody['endTime']} (type: ${requestBody['endTime'].runtimeType})');
      print('  - status: ${requestBody['status']} (type: ${requestBody['status'].runtimeType})');
      print('  - doctorId: ${requestBody['doctorId']} (type: ${requestBody['doctorId'].runtimeType})');
      print('  - nurseId: ${requestBody['nurseId']} (type: ${requestBody['nurseId'].runtimeType})');
      print('  - patientId: ${requestBody['patientId']} (type: ${requestBody['patientId'].runtimeType})');
      print('');
      print('⏳ Sending POST request...');
      print('─' * 64);
      
      final response = await DioClient.dio.post(
        '/Task/Create',
        data: requestBody,
      );
      
      print('─' * 64);
      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.data}');
      print('');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('✅ SUCCESS: Task created');
        final responseData = response.data;
        final createdTask = responseData is Map<String, dynamic>
            ? TaskModel.fromJson(responseData)
            : task;
        final taskToAdd = createdTask.copyWith(
          nurseName: task.nurseName,
          patientName: task.patientName,
          color: task.color,
        );
        addTask(taskToAdd);
        await _saveTaskColorToPrefs(taskToAdd.id, taskToAdd.color);
        print('╚════════════════════════════════════════════════════════════════╝');
        print('');
        return null;
      }
      final unexpectedMessage = 'Unexpected status code ${response.statusCode}: ${response.data}';
      print('❌ FAILED: $unexpectedMessage');
      print('╚════════════════════════════════════════════════════════════════╝');
      print('');
      return unexpectedMessage;
    } on DioError catch (e) {
      print('─' * 64);
      print('❌ DIO ERROR: ${e.type} - ${e.message}');
      String errorMessage = 'Failed to create task';
      final responseData = e.response?.data;
      if (responseData != null) {
        print('📥 Error status: ${e.response?.statusCode}');
        print('📥 Error response body: $responseData');
        if (responseData is Map<String, dynamic> && responseData['message'] != null) {
          errorMessage = responseData['message'].toString();
        } else {
          errorMessage = responseData.toString();
        }
      }
      print('╚════════════════════════════════════════════════════════════════╝');
      print('');
      debugPrint('Dio Error (Create Task): $e');
      return errorMessage;
    } catch (e) {
      print('─' * 64);
      print('❌ ERROR: ${e.runtimeType} - $e');
      print('╚════════════════════════════════════════════════════════╝');
      print('');
      debugPrint('Dio Error (Create Task): $e');
      return e.toString();
    }
  }

  Future<bool> updateTaskOnServer(TaskModel task) async {
    try {
      final response = await DioClient.dio.put(
        '/Task/Update',
        data: task.toJson(),
      );
      if (response.statusCode == 200) {
        updateTask(task);
        await _saveTaskColorToPrefs(task.id, task.color);
        return true;
      }
    } catch (e) {
      debugPrint('Dio Error (Update Task): $e');
    }
    return false;
  }

  Future<bool> deleteTaskOnServer(String taskId) async {
    try {
      final response = await DioClient.dio.delete(
        '/Task/Delete',
        queryParameters: {'id': int.tryParse(taskId) ?? 0},
      );
      if (response.statusCode == 200) {
        removeTask(taskId);
        return true;
      }
    } catch (e) {
      debugPrint('Dio Error (Delete Task): $e');
    }
    return false;
  }
}
