import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:collection/collection.dart';
import '../../models/vital_sign_model.dart';
import '../../providers/vital_sign_provider.dart';
import '../../providers/admission_provider.dart';
import '../../models/patient.dart';

// --- الكلاسات المساعدة (UI Models) ---
class DayItem {
  final int day;
  final String weekday;
  final String month;
  const DayItem({required this.day, required this.weekday, required this.month});
}

class VitalCell {
  final String time;
  final dynamic value;
  final Color backgroundColor;

  const VitalCell({
    required this.time,
    required this.value,
    required this.backgroundColor,
  });
}

class VitalRowData {
  final String label;
  final List<VitalCell> cells;
  const VitalRowData({required this.label, required this.cells});
}

class VitalSignsScreen extends StatefulWidget {
  const VitalSignsScreen({super.key});

  @override
  State<VitalSignsScreen> createState() => _VitalSignsScreenState();
}

class _VitalSignsScreenState extends State<VitalSignsScreen> {
  int _selectedDay = DateTime.now().day;
  static const Color _primaryThemeBlue = Color(0xFF719EFF);
  static const Color _accentDarkBlue = Color(0xFF2E55A7);
  static const Color _bgColor = Color(0xFFEDF3FF);

  final ScrollController _headerScrollController = ScrollController();
  final List<ScrollController> _rowScrollControllers = List.generate(6, (_) => ScrollController());
  bool _hasFetchedVitals = false;

  @override
  void initState() {
    super.initState();
  }

  @override
  void dispose() {
    for (final controller in _rowScrollControllers) {
      controller.dispose();
    }
    _headerScrollController.dispose();
    super.dispose();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_hasFetchedVitals) return;

    final args = ModalRoute.of(context)?.settings.arguments;
    String patientId = '';
    String patientName = '';

    if (args is Patient) {
      patientId = args.id;
      patientName = args.name;
    } else if (args is String) {
      patientId = args;
    } else if (args is Map<String, dynamic>) {
      patientId = (args['patientId'] ?? args['id'] ?? '').toString();
      patientName = (args['patientName'] ?? args['name'] ?? '').toString();
    } else if (args != null) {
      patientId = args.toString();
    }

    debugPrint('🔍 VitalSignsScreen - Initial patientId: $patientId, name: $patientName, args: $args');

    if (patientId.isNotEmpty || patientName.isNotEmpty) {
      _hasFetchedVitals = true;
      WidgetsBinding.instance.addPostFrameCallback((_) async {
        if (!mounted) return;

        final provider = Provider.of<VitalSignProvider>(context, listen: false);
        final admissionProvider = Provider.of<AdmissionProvider>(context, listen: false);

        try {
          if (admissionProvider.allAdmissionRequests.isEmpty) {
            debugPrint('🔄 Admission requests empty, fetching all...');
            await admissionProvider.fetchAllAdmissionRequests();
          }

          final idToTry = await _resolvePatientId(patientId, patientName, admissionProvider);
          if (idToTry.isNotEmpty) {
            await provider.fetchPatientSigns(idToTry);
            debugPrint('✅ VitalSignsScreen - Fetching patient signs for resolved patientId: $idToTry');
          } else {
            debugPrint('❌ No patientId available after resolution attempts');
          }
        } catch (e) {
          debugPrint('Error resolving patientId via AdmissionProvider: $e');
          if (patientId.isNotEmpty) {
            await provider.fetchPatientSigns(patientId);
          }
        }

        debugPrint('=== VITAL SIGNS DEBUG ===');
        debugPrint('RECORDS COUNT: ${provider.allSigns.length}');
        if (provider.allSigns.isNotEmpty) {
          final r = provider.allSigns.first;
          debugPrint('FIRST RECORD:');
          debugPrint('  recordedAt UTC: ${r.recordedAt}');
          debugPrint('  recordedAt LOCAL: ${r.recordedAt.toLocal()}');
          debugPrint('  localHour: ${r.recordedAt.toLocal().hour}');
          debugPrint('  HR: ${r.heartRate}');
          debugPrint('  SpO2: ${r.spO2}');
          debugPrint('  BP: ${r.bloodPressure}');
          debugPrint('  Pulse: ${r.pulse}');
          debugPrint('  RR: ${r.respiratoryRate}');
          debugPrint('  Temp: ${r.temperature}');
        }
        debugPrint('========================');
      });
    } else {
      _hasFetchedVitals = true;
      debugPrint('❌ VitalSignsScreen - Invalid or missing patientId/name, skipping fetch');
    }
  }

  List<VitalRowData> _processData(List<VitalSignModel> allSigns) {
    final now = DateTime.now();
    final selectedDate = DateTime(now.year, now.month, _selectedDay);
    final isToday = DateTime(now.year, now.month, now.day) == selectedDate;
    final currentHour = now.hour;

    final hours = List.generate(24, (index) => index);

    final recordsByHour = <int, VitalSignModel>{};
    for (var record in allSigns) {
      final local = record.recordedAt.toLocal();
      final recordHour = local.hour;

      if (local.year != selectedDate.year ||
          local.month != selectedDate.month ||
          local.day != selectedDate.day) {
        continue;
      }

      if (recordHour < 0 || recordHour > 23) {
        continue;
      }

      if (!recordsByHour.containsKey(recordHour) ||
          local.isAfter(recordsByHour[recordHour]!.recordedAt.toLocal())) {
        recordsByHour[recordHour] = record;
      }
    }

    Color backgroundForHour(int hour) {
      if (hour == currentHour && isToday) {
        return _accentDarkBlue;
      }
      if (recordsByHour.containsKey(hour)) {
        return _primaryThemeBlue;
      }
      if (!isToday) {
        return Colors.grey.shade200;
      }
      return hour < currentHour ? Colors.grey.shade200 : Colors.blue.shade50;
    }

    String hourLabel(int hour) {
      if (hour == 0) return '12 AM';
      if (hour == 12) return '12 PM';
      if (hour < 12) return '$hour AM';
      return '${hour - 12} PM';
    }

    return [
      VitalRowData(
        label: 'HR',
        cells: hours.map((hour) {
          final record = recordsByHour[hour];
          return VitalCell(
            time: hourLabel(hour),
            value: getValue(record, 'HR'),
            backgroundColor: backgroundForHour(hour),
          );
        }).toList(),
      ),
      VitalRowData(
        label: 'SpO2',
        cells: hours.map((hour) {
          final record = recordsByHour[hour];
          return VitalCell(
            time: hourLabel(hour),
            value: getValue(record, 'SpO2'),
            backgroundColor: backgroundForHour(hour),
          );
        }).toList(),
      ),
      VitalRowData(
        label: 'NBP',
        cells: hours.map((hour) {
          final record = recordsByHour[hour];
          return VitalCell(
            time: hourLabel(hour),
            value: getValue(record, 'NBP'),
            backgroundColor: backgroundForHour(hour),
          );
        }).toList(),
      ),
      VitalRowData(
        label: 'Pulse',
        cells: hours.map((hour) {
          final record = recordsByHour[hour];
          return VitalCell(
            time: hourLabel(hour),
            value: getValue(record, 'Pulse'),
            backgroundColor: backgroundForHour(hour),
          );
        }).toList(),
      ),
      VitalRowData(
        label: 'RR',
        cells: hours.map((hour) {
          final record = recordsByHour[hour];
          return VitalCell(
            time: hourLabel(hour),
            value: getValue(record, 'RR'),
            backgroundColor: backgroundForHour(hour),
          );
        }).toList(),
      ),
      VitalRowData(
        label: 'Temp',
        cells: hours.map((hour) {
          final record = recordsByHour[hour];
          return VitalCell(
            time: hourLabel(hour),
            value: getValue(record, 'Temp'),
            backgroundColor: backgroundForHour(hour),
          );
        }).toList(),
      ),
    ];
  }

  VitalSignModel? getRecordForHour(
    List<VitalSignModel> records,
    DateTime selectedDate,
    int targetHour,
  ) {
    for (final r in records) {
      final local = r.recordedAt.toLocal();
      if (local.year == selectedDate.year &&
          local.month == selectedDate.month &&
          local.day == selectedDate.day &&
          local.hour == targetHour) {
        return r;
      }
    }
    return null;
  }

  String getValue(VitalSignModel? r, String vital) {
    if (r == null) return '—';
    switch (vital) {
      case 'HR':
        return r.heartRate > 0 ? r.heartRate.toString() : '—';
      case 'SpO2':
        return (r.spO2 != null && r.spO2! > 0) ? r.spO2!.toString() : '—';
      case 'NBP':
        final bp = r.bloodPressure.trim();
        return bp.isNotEmpty && bp != '0' ? bp : '—';
      case 'Pulse':
        return (r.pulse != null && r.pulse! > 0) ? r.pulse!.toString() : '—';
      case 'RR':
        return (r.respiratoryRate != null && r.respiratoryRate! > 0) ? r.respiratoryRate!.toString() : '—';
      case 'Temp':
        return r.temperature != 0.0 ? r.temperature.toString() : '—';
      default:
        return '—';
    }
  }

  Future<String> _resolvePatientId(
    String rawPatientId,
    String patientName,
    AdmissionProvider admissionProvider,
  ) async {
    final guidMatcher = RegExp(r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$');

    if (rawPatientId.isNotEmpty && guidMatcher.hasMatch(rawPatientId)) {
      return rawPatientId;
    }

    String normalizedName = patientName.trim().toLowerCase();
    String? fallbackId;

    for (var req in admissionProvider.allAdmissionRequests) {
      final reqName = (req.patientName ?? '').trim().toLowerCase();
      final reqId = (req.patientId ?? '').trim();

      if (normalizedName.isNotEmpty && reqName == normalizedName) {
        if (guidMatcher.hasMatch(reqId)) {
          return reqId;
        }
        fallbackId ??= reqId;
      }

      if (rawPatientId.isNotEmpty && reqId == rawPatientId) {
        if (guidMatcher.hasMatch(reqId)) {
          return reqId;
        }
        fallbackId ??= reqId;
      }
    }

    return fallbackId ?? rawPatientId;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      body: Consumer<VitalSignProvider>(
        builder: (context, provider, child) {
          final rows = _processData(provider.allSigns);

          return Column(
            children: [
              _buildHeader(context),
              const SizedBox(height: 8),
              _buildWeekStrip(),
              const SizedBox(height: 8),
              _buildHoursHeader(),
              const SizedBox(height: 8),
              Expanded(
                child: provider.isLoading
                    ? const Center(child: CircularProgressIndicator(color: _primaryThemeBlue))
                    // ✅ FIX 2: Always show 6 rows, even with no data
                    : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: rows.length,
                  itemBuilder: (context, index) => Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: _buildVitalRow(rows[index], index),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  // --- Widgets المساعدة التي كانت ناقصة وتسببت في الإيرورز ---

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.only(top: 22, bottom: 12),
      decoration: const BoxDecoration(
          color: _primaryThemeBlue,
          borderRadius: BorderRadius.only(bottomLeft: Radius.circular(15), bottomRight: Radius.circular(15))
      ),
      child: SafeArea(
        child: Row(
          children: [
            IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 22),
              onPressed: () => Navigator.pop(context),
            ),
            const Expanded(
              child: Text(
                'Vital Signs',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.white, fontSize: 19, fontWeight: FontWeight.bold),
              ),
            ),
            const SizedBox(width: 48),
          ],
        ),
      ),
    );
  }

  Widget _buildWeekStrip() {
    final now = DateTime.now();
    final daysInMonth = DateUtils.getDaysInMonth(now.year, now.month);
    final monthName = DateFormat('MMM').format(now);
    final days = List.generate(daysInMonth, (index) {
      final date = DateTime(now.year, now.month, index + 1);
      return DayItem(
        day: date.day,
        weekday: DateFormat('EEE').format(date).toUpperCase(),
        month: monthName,
      );
    });

    return SizedBox(
      height: 85,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: days.length,
        itemBuilder: (context, index) {
          final d = days[index];
          final isSelected = d.day == _selectedDay;
          return GestureDetector(
            onTap: () => setState(() => _selectedDay = d.day),
            child: Container(
              width: 50,
              margin: const EdgeInsets.symmetric(horizontal: 4),
              decoration: BoxDecoration(
                color: isSelected ? _accentDarkBlue : Colors.transparent,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(d.month, style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : Colors.black87)),
                  Text('${d.day}', style: TextStyle(fontSize: 16, color: isSelected ? Colors.white : Colors.black87, fontWeight: FontWeight.bold)),
                  Text(d.weekday, style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : Colors.black87)),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildVitalRow(VitalRowData row, int rowIndex) {
    return Row(
      children: [
        Container(
          width: 70,
          height: 85,
          decoration: BoxDecoration(color: _accentDarkBlue, borderRadius: BorderRadius.circular(12)),
          alignment: Alignment.center,
          child: Text(
            row.label,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: SizedBox(
            height: 85,
            child: ListView.separated(
              controller: _rowScrollControllers[rowIndex],
              scrollDirection: Axis.horizontal,
              itemCount: row.cells.length,
              separatorBuilder: (_, __) => const SizedBox(width: 6),
              itemBuilder: (context, index) => _buildCell(row.cells[index]),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildHoursHeader() {
    final hours = List.generate(24, (index) => index);

    String hourLabel(int hour) {
      if (hour == 0) return '12 AM';
      if (hour == 12) return '12 PM';
      if (hour < 12) return '$hour AM';
      return '${hour - 12} PM';
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: [
          const SizedBox(width: 70),
          const SizedBox(width: 6),
          Expanded(
            child: SizedBox(
              height: 38,
              child: ListView.separated(
                controller: _headerScrollController,
                scrollDirection: Axis.horizontal,
                itemCount: hours.length,
                separatorBuilder: (_, __) => const SizedBox(width: 6),
                itemBuilder: (context, index) {
                  final hour = hours[index];
                  final isCurrentHour = hour == DateTime.now().hour;
                  final label = hourLabel(hour);
                  return Container(
                    width: 62,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: isCurrentHour ? _accentDarkBlue : _primaryThemeBlue,
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      label,
                      textAlign: TextAlign.center,
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCell(VitalCell cell) {
    final textColor = cell.backgroundColor == _primaryThemeBlue ? Colors.white : Colors.black87;

    return Container(
      width: 52,
      decoration: BoxDecoration(color: cell.backgroundColor, borderRadius: BorderRadius.circular(10)),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: [
          Text(cell.time, style: TextStyle(color: textColor, fontSize: 9, fontWeight: FontWeight.bold)),
          Container(height: 1.5, width: 30, color: textColor),
          Text(
            '${cell.value}',
            style: TextStyle(color: textColor, fontSize: 11, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }
}