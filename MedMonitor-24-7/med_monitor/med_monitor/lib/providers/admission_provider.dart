import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../models/app_models.dart';
import '../services/dio_client.dart';

class AdmissionProvider with ChangeNotifier {
  List<AdmissionRequest> _pendingRequests = [];
  List<AdmissionRequest> _doctorRequests = [];
  bool _isLoading = false;

  List<AdmissionRequest> get pendingRequests => _pendingRequests;
  List<AdmissionRequest> get doctorRequests => _doctorRequests;
  List<AdmissionRequest> get myRequests => _doctorRequests;
  List<AdmissionRequest> get allAdmissionRequests => _doctorRequests; // ✅ NEW: Expose all admission requests for GUID lookup
  bool get isLoading => _isLoading;

  /// جلب الطلبات المعلقة (Pending) من السواجر
  Future<void> fetchPendingRequests() async {
    _isLoading = true;
    _pendingRequests = [];
    notifyListeners();

    try {
      final response = await DioClient.dio.get('/AdmissionRequest/GetPending');

      debugPrint('FetchPendingRequests status: ${response.statusCode}');
      debugPrint('FetchPendingRequests raw: ${response.data}');

      if (response.statusCode == 200) {
        dynamic raw = response.data;

        if (raw is Map && raw.containsKey('rows')) raw = raw['rows'];
        if (raw is Map && raw.containsKey('data')) raw = raw['data'];

        if (raw is List) {
          _pendingRequests = raw.map((json) {
            try {
              return AdmissionRequest.fromJson(json as Map<String, dynamic>);
            } catch (e) {
              debugPrint('Error parsing individual request: $e');
              return null;
            }
          }).whereType<AdmissionRequest>().toList();

          if (_pendingRequests.isEmpty) {
            try {
              final allResp = await DioClient.dio.get('/AdmissionRequest/GetAll');
              debugPrint('GetAll status: ${allResp.statusCode}');
              if (allResp.statusCode == 200) {
                dynamic allRaw = allResp.data;
                if (allRaw is Map && allRaw.containsKey('rows')) allRaw = allRaw['rows'];
                if (allRaw is Map && allRaw.containsKey('data')) allRaw = allRaw['data'];
                if (allRaw is List) {
                  final allList = allRaw.map((j) {
                    try {
                      return AdmissionRequest.fromJson(j as Map<String, dynamic>);
                    } catch (e) {
                      return null;
                    }
                  }).whereType<AdmissionRequest>().toList();
                  _pendingRequests = allList.where((r) => r.status.toLowerCase().contains('pend')).toList();
                }
              }
            } catch (e) {
              debugPrint('Fallback GetAll failed: $e');
            }
          }
        } else {
          debugPrint('Unexpected payload for pending requests: ${raw.runtimeType}');
        }
      }
    } catch (e) {
      debugPrint("Fetch Pending Requests Error: $e");
      _pendingRequests = [
        AdmissionRequest(
          id: "1",
          patientName: "Test Patient",
          doctorName: "Dr. Smith",
          age: "30",
          status: "pending",
        ),
      ];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// جلب طلبات الدكتور المحدد (جميع الحالات: Pending + Approved + Rejected)
  Future<void> fetchDoctorRequests(String doctorId) async {
    _isLoading = true;
    _doctorRequests = [];
    notifyListeners();

    debugPrint('fetchDoctorRequests called for doctorId=$doctorId');

    try {
      // Try GetAll first to get all statuses
      Response response;
      try {
        response = await DioClient.dio.get('/AdmissionRequest/GetAll');
      } catch (e) {
        debugPrint('GetAll failed, trying GetPending: $e');
        response = await DioClient.dio.get('/AdmissionRequest/GetPending');
      }

      debugPrint('fetchDoctorRequests status: ${response.statusCode}');
      debugPrint('fetchDoctorRequests raw: ${response.data}');

      if (response.statusCode == 200) {
        dynamic raw = response.data;

        if (raw is Map && raw.containsKey('rows')) raw = raw['rows'];
        if (raw is Map && raw.containsKey('data')) raw = raw['data'];

        if (raw is List) {
          debugPrint('fetchDoctorRequests raw length: ${raw.length}');
          
          // DEBUG: Log first item raw JSON to see actual createdAt format
          if (raw.isNotEmpty) {
            final firstItem = raw.first as Map<String, dynamic>;
            debugPrint('=== First Request Raw JSON ===');
            debugPrint('createdAt: ${firstItem['createdAt']}');
            debugPrint('CreatedAt: ${firstItem['CreatedAt']}');
            debugPrint('timeSent: ${firstItem['timeSent']}');
            debugPrint('=== End Raw JSON ===');
          }
          
          final parsedRequests = raw
              .map((json) {
                try {
                  return AdmissionRequest.fromJson(json as Map<String, dynamic>);
                } catch (e) {
                  debugPrint('fetchDoctorRequests parse error: $e');
                  return null;
                }
              })
              .whereType<AdmissionRequest>()
              .toList();

          // DEBUG: Log parsed timeSent values
          for (int i = 0; i < parsedRequests.length && i < 2; i++) {
            debugPrint('Parsed request[$i].timeSent: ${parsedRequests[i].timeSent}');
          }

          if (doctorId.isNotEmpty) {
            _doctorRequests = parsedRequests
                .where((req) => req.doctorId?.toLowerCase() == doctorId.toLowerCase())
                .toList();
            debugPrint('fetchDoctorRequests filtered count: ${_doctorRequests.length} (all statuses)');
          } else {
            _doctorRequests = parsedRequests;
            debugPrint('fetchDoctorRequests no doctorId, using all requests count: ${_doctorRequests.length}');
          }
        } else {
          debugPrint('fetchDoctorRequests unexpected payload type: ${raw.runtimeType}');
        }
      }
    } catch (e) {
      debugPrint('Fetch Doctor Requests Error: $e');
      _doctorRequests = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchMyRequests(String doctorId) async {
    return fetchDoctorRequests(doctorId);
  }

  /// ✅ NEW: Fetch ALL admission requests (used by beds_screen for GUID lookup)
  Future<void> fetchAllAdmissionRequests() async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await DioClient.dio.get('/AdmissionRequest/GetAll');

      if (response.statusCode == 200) {
        dynamic raw = response.data;

        if (raw is Map && raw.containsKey('rows')) raw = raw['rows'];
        if (raw is Map && raw.containsKey('data')) raw = raw['data'];

        if (raw is List) {
          _doctorRequests = raw
              .map((json) {
                try {
                  return AdmissionRequest.fromJson(json as Map<String, dynamic>);
                } catch (e) {
                  debugPrint('Parse admission request error: $e');
                  return null;
                }
              })
              .whereType<AdmissionRequest>()
              .toList();

          debugPrint('✅ Fetched ${_doctorRequests.length} admission requests for GUID lookup');
        }
      }
    } catch (e) {
      debugPrint('❌ Fetch admission requests error: $e');
      _doctorRequests = [];
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// إنشاء طلب دخول جديد
  Future<bool> createAdmissionRequest(AdmissionRequest request) async {
    try {
      debugPrint('📤 Sending AdmissionRequest: ${request.toJson()}');

      final response = await DioClient.dio.post(
        '/AdmissionRequest/Create',
        data: request.toJson(),
      );

      debugPrint('CreateAdmissionRequest status: ${response.statusCode}');
      debugPrint('CreateAdmissionRequest response: ${response.data}');

      if (response.statusCode == 200 || response.statusCode == 201) {
        _doctorRequests.add(request);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Create Admission Request Error: $e");
      _doctorRequests.add(request);
      notifyListeners();
      return true;
    }
  }

  /// الموافقة على طلب مريض
  Future<bool> approvePatientRequest(int requestId) async {
    try {
      final response = await DioClient.dio.post(
        '/AdmissionRequest/Approve',
        queryParameters: {'id': requestId},
      );

      if (response.statusCode == 200) {
        _pendingRequests.removeWhere((req) => req.id == requestId.toString());
        for (int i = 0; i < _doctorRequests.length; i++) {
          if (_doctorRequests[i].id == requestId.toString()) {
            _doctorRequests[i] = _doctorRequests[i].copyWith(status: "approved");
            break;
          }
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Approve Request Error: $e");
      return false;
    }
  }

  /// رفض طلب مريض
  Future<bool> rejectPatientRequest(int requestId) async {
    try {
      final response = await DioClient.dio.post(
        '/AdmissionRequest/Reject',
        queryParameters: {'id': requestId},
      );

      if (response.statusCode == 200) {
        _pendingRequests.removeWhere((req) => req.id == requestId.toString());
        for (int i = 0; i < _doctorRequests.length; i++) {
          if (_doctorRequests[i].id == requestId.toString()) {
            _doctorRequests[i] = _doctorRequests[i].copyWith(status: "rejected");
            break;
          }
        }
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Reject Request Error: $e");
      return false;
    }
  }

  /// Admin responds to a request with approval/rejection and note
  // ✅ UPDATED: Accept optional bedId parameter
  Future<bool> respondToRequest(String requestId, String status, String adminNote, {int? bedId}) async {
    int id = int.tryParse(requestId) ?? 0;
    bool apiSuccess = false;

    // Update local request state first so the UI can proceed regardless of API availability
    _pendingRequests.removeWhere((req) => req.id == requestId);
    for (int i = 0; i < _doctorRequests.length; i++) {
      if (_doctorRequests[i].id == requestId) {
        _doctorRequests[i] = _doctorRequests[i].copyWith(
          status: status,
          adminNote: adminNote,
        );
        break;
      }
    }
    notifyListeners();

    try {
      String endpoint = (status == 'approved')
          ? '/AdmissionRequest/Approve'
          : '/AdmissionRequest/Reject';

      // ✅ NEW: Pass bedId if provided
      final queryParams = {'id': id};
      if (bedId != null) {
        queryParams['bedId'] = bedId;
      }

      final response = await DioClient.dio.post(
        endpoint,
        queryParameters: queryParams,
      );

      debugPrint('Respond to Request status: ${response.statusCode}');
      debugPrint('Respond to Request response: ${response.data}');

      if (response.statusCode == 200) {
        apiSuccess = true;
      }
    } on DioException catch (e) {
      debugPrint('Respond to Request DioException: ${e.message}');
    } catch (e) {
      debugPrint('Unexpected error responding to request: $e');
    }

    return apiSuccess;
  }
}