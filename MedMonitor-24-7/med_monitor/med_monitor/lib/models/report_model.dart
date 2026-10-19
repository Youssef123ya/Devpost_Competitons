class PatientReportModel {
  final int id;
  final String reportTitle;
  final String imageUrl;
  final String category; // Radiology, Laboratory, etc.

  PatientReportModel({
    required this.id,
    required this.reportTitle,
    required this.imageUrl,
    required this.category,
  });

  factory PatientReportModel.fromJson(Map<String, dynamic> json) {
    return PatientReportModel(
      id: json['id'] ?? 0,
      reportTitle: json['title'] ?? 'Report',
      imageUrl: json['imageUrl'] ?? '',
      category: json['category'] ?? 'Daily Reports',
    );
  }
}