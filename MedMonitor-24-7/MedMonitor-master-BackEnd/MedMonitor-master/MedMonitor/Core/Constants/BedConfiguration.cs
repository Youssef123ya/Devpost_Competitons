namespace MedMonitor.Core.Constants
{
    /// <summary>
    /// Configuration constants for hospital bed management.
    /// Centralized location for bed/unit settings for easy maintenance.
    /// </summary>
    public static class BedConfiguration
    {
        /// <summary>
        /// Number of beds per medical unit (e.g., Unit A, B, C, etc.)
        /// Change this if hospital configuration changes (e.g., 12 → 15 beds per unit)
        /// </summary>
        public const int BEDS_PER_UNIT = 12;

        /// <summary>
        /// Total number of medical units in the hospital
        /// Units are: A, B, C, D, E, F, G
        /// If more units are added later, update this value
        /// </summary>
        public const int TOTAL_UNITS = 7;

        /// <summary>
        /// Calculate total beds in hospital
        /// Formula: TOTAL_UNITS × BEDS_PER_UNIT
        /// </summary>
        public static int TotalBeds => TOTAL_UNITS * BEDS_PER_UNIT; // 7 × 12 = 84

        /// <summary>
        /// List of valid unit names
        /// Update this if new units are added
        /// </summary>
        public static readonly string[] UnitNames = { "A", "B", "C", "D", "E", "F", "G" };
    }
}
