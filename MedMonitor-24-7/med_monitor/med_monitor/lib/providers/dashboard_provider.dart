import 'package:flutter/material.dart';
import '../models/dashboard_stats_model.dart';
import '../services/api_service.dart';

class DashboardProvider with ChangeNotifier {
  DashboardStatsModel? _stats;
  bool _isLoading = false;
  String? _error;

  DashboardStatsModel? get stats => _stats;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Fetch dashboard stats from API
  /// Returns true if successful, false otherwise
  Future<bool> fetchStats() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final stats = await ApiService.getDashboardStats();
      
      if (stats != null) {
        _stats = stats;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = "Failed to fetch dashboard stats";
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Refresh stats with optional delay (for UI synchronization)
  Future<bool> refreshStats({Duration? delay}) async {
    if (delay != null) {
      await Future.delayed(delay);
    }
    return fetchStats();
  }
}
