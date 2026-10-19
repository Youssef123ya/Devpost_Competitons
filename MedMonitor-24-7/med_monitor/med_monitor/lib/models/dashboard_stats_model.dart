/// Dashboard statistics model matching the backend API response
/// 
/// Key Changes:
/// - availableBeds is now DYNAMIC: (totalUnits × bedsPerUnit) - occupiedBeds
/// - Added totalUnits, bedsPerUnit, totalBeds for transparency
/// 
/// Example:
/// - With 7 units × 12 beds = 84 total beds
/// - If 5 beds occupied: availableBeds = 84 - 5 = 79
/// - When admin adds Unit H (8 units): availableBeds = (8×12) - 5 = 91 automatically
class DashboardStatsModel {
  // ✅ BED METRICS — Now with dynamic calculation
  final int totalUnits;           // Number of medical units (A, B, C, D, E, F, G)
  final int bedsPerUnit;          // Fixed: 12 beds per unit
  final int totalBeds;            // Calculated: totalUnits × bedsPerUnit
  final int occupiedBeds;         // Count of occupied beds
  final int availableBeds;        // ✅ DYNAMIC: totalBeds - occupiedBeds

  // PATIENT & USER METRICS
  final int totalPatients;
  final int totalDoctors;
  final int totalNurses;
  final int totalRequests;

  // AGE GROUP STATISTICS
  final int newbornsCount;
  final int childrenCount;
  final int teenagersCount;
  final int adultsCount;
  final int elderlyCount;

  const DashboardStatsModel({
    // Bed metrics with defaults
    this.totalUnits = 7,
    this.bedsPerUnit = 12,
    this.totalBeds = 84,
    this.occupiedBeds = 0,
    this.availableBeds = 84,

    // Patient & user metrics
    this.totalPatients = 0,
    this.totalDoctors = 0,
    this.totalNurses = 0,
    this.totalRequests = 0,

    // Age statistics
    this.newbornsCount = 0,
    this.childrenCount = 0,
    this.teenagersCount = 0,
    this.adultsCount = 0,
    this.elderlyCount = 0,
  });

  /// Parse JSON response from backend API
  /// Handles both camelCase (Flutter) and PascalCase (C#) field names
  factory DashboardStatsModel.fromJson(Map<String, dynamic> json) {
    int parseInt(dynamic value) {
      if (value == null) return 0;
      if (value is int) return value;
      if (value is String) return int.tryParse(value) ?? 0;
      return 0;
    }

    return DashboardStatsModel(
      // Bed metrics (new fields for dynamic calculation)
      totalUnits: parseInt(json['totalUnits'] ?? json['TotalUnits'] ?? 7),
      bedsPerUnit: parseInt(json['bedsPerUnit'] ?? json['BedsPerUnit'] ?? 12),
      totalBeds: parseInt(json['totalBeds'] ?? json['TotalBeds'] ?? 84),
      occupiedBeds: parseInt(json['occupiedBeds'] ?? json['OccupiedBeds'] ?? 0),
      availableBeds: parseInt(json['availableBeds'] ?? json['AvailableBeds'] ?? 84),

      // Patient & user metrics
      totalPatients: parseInt(json['totalPatients'] ?? json['TotalPatients'] ?? 0),
      totalDoctors: parseInt(json['totalDoctors'] ?? json['TotalDoctors'] ?? 0),
      totalNurses: parseInt(json['totalNurses'] ?? json['TotalNurses'] ?? 0),
      totalRequests: parseInt(json['totalRequests'] ?? json['TotalRequests'] ?? 0),

      // Age statistics
      newbornsCount: parseInt(json['newbornsCount'] ?? json['NewbornsCount'] ?? 0),
      childrenCount: parseInt(json['childrenCount'] ?? json['ChildrenCount'] ?? 0),
      teenagersCount: parseInt(json['teenagersCount'] ?? json['TeenagersCount'] ?? 0),
      adultsCount: parseInt(json['adultsCount'] ?? json['AdultsCount'] ?? 0),
      elderlyCount: parseInt(json['elderlyCount'] ?? json['ElderlyCount'] ?? 0),
    );
  }

  /// Convert model to JSON for storage/transmission
  Map<String, dynamic> toJson() => {
    // Bed metrics
    'totalUnits': totalUnits,
    'bedsPerUnit': bedsPerUnit,
    'totalBeds': totalBeds,
    'occupiedBeds': occupiedBeds,
    'availableBeds': availableBeds,

    // Patient & user metrics
    'totalPatients': totalPatients,
    'totalDoctors': totalDoctors,
    'totalNurses': totalNurses,
    'totalRequests': totalRequests,

    // Age statistics
    'newbornsCount': newbornsCount,
    'childrenCount': childrenCount,
    'teenagersCount': teenagersCount,
    'adultsCount': adultsCount,
    'elderlyCount': elderlyCount,
  };

  @override
  String toString() => 'DashboardStatsModel('
      'totalUnits: $totalUnits, '
      'bedsPerUnit: $bedsPerUnit, '
      'totalBeds: $totalBeds, '
      'occupiedBeds: $occupiedBeds, '
      'availableBeds: $availableBeds, '
      'totalPatients: $totalPatients, '
      'totalDoctors: $totalDoctors, '
      'totalNurses: $totalNurses, '
      'totalRequests: $totalRequests)';
}
