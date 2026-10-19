class VitalSignModel {
  final int id;
  final String patientId;
  final double temperature;
  final int heartRate;
  final String bloodPressure; // ✅ غيرناها لـ String عشان تقبل "120/80"
  final int? spO2;
  final int? etCO2;
  final int? pulse;
  final int? respiratoryRate;
  final DateTime recordedAt;

  VitalSignModel({
    required this.id,
    required this.patientId,
    required this.temperature,
    required this.heartRate,
    required this.bloodPressure,
    this.spO2,
    this.etCO2,
    this.pulse,
    this.respiratoryRate,
    required this.recordedAt,
  });

  static int? _parseInt(dynamic value) {
    if (value == null) return null;
    if (value is int) return value;
    if (value is double) return value.toInt();
    if (value is String) {
      final normalized = value.replaceAll(RegExp(r'[^0-9-]'), '');
      return int.tryParse(normalized);
    }
    return null;
  }

  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      final normalized = value.replaceAll(',', '.').replaceAll(RegExp(r'[^0-9.-]'), '');
      return double.tryParse(normalized) ?? 0.0;
    }
    return 0.0;
  }

  static String _parseString(dynamic value) {
    if (value == null) return '';
    return value.toString();
  }

  static DateTime _parseDateTime(dynamic value) {
    if (value is String) {
      try {
        var dateStr = value.trim();
        if (!dateStr.contains('Z') && !dateStr.contains('+') && !dateStr.contains('-00:00')) {
          dateStr = dateStr.replaceAll(' ', 'T') + 'Z';
        }
        final parsed = DateTime.tryParse(dateStr);
        if (parsed != null) return parsed;
      } catch (_) {
        // Fallback below
      }
    }
    return DateTime.now();
  }

  factory VitalSignModel.fromJson(Map<String, dynamic> json) {
    final bpValue = json['bloodPressure'] ?? json['blood_pressure'] ?? json['BloodPressure'] ?? json['nbp'] ?? json['NBP'];

    return VitalSignModel(
      id: _parseInt(json['id'] ?? json['Id'] ?? json['ID']) ?? 0,
      patientId: _parseString(json['patientId'] ?? json['patient_id'] ?? json['PatientId']),
      temperature: _parseDouble(json['temperature'] ?? json['Temperature'] ?? json['temp'] ?? json['Temp']),
      heartRate: _parseInt(json['heartRate'] ?? json['heart_rate'] ?? json['HeartRate']) ?? 0,
      bloodPressure: _parseString(bpValue).isEmpty ? '0' : _parseString(bpValue),
      spO2: _parseInt(json['spO2'] ?? json['spo2'] ?? json['sp_o2'] ?? json['SpO2']),
      etCO2: _parseInt(json['etCO2'] ?? json['et_co2'] ?? json['EtCO2']),
      pulse: _parseInt(json['pulse'] ?? json['Pulse']),
      respiratoryRate: _parseInt(json['respiratoryRate'] ?? json['respiratory_rate'] ?? json['RespiratoryRate']),
      recordedAt: _parseDateTime(json['recordedAt'] ?? json['recorded_at'] ?? json['RecordedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'patientId': patientId,
      'temperature': temperature,
      'heartRate': heartRate,
      'bloodPressure': bloodPressure,
      'spO2': spO2,
      'etCO2': etCO2,
      'pulse': pulse,
      'respiratoryRate': respiratoryRate,
      'recordedAt': recordedAt.toIso8601String(),
    };
  }
}