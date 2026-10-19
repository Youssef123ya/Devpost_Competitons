import 'package:flutter/material.dart';
import '../services/api_service.dart';
import 'gas_control_screen.dart';

class SensorsScreen extends StatefulWidget {
const SensorsScreen({super.key});

@override
State<SensorsScreen> createState() => _SensorsScreenState();
}

class _SensorsScreenState extends State<SensorsScreen> {
final ApiService apiService = ApiService();

bool isLoading = true;

bool dangerMode = false;
bool gasOn = false;


bool manualControlAllowed = true;

int gasValue = 0;
double tempValue = 0;
double humidityValue = 0;
bool flameDetected = false;
String alertMessage = "";


@override
void initState() {
super.initState();
loadSensorData();
}

Future<void> loadSensorData() async {
try {
final sensorData = await apiService.getSensorData();
debugPrint("SENSOR DATA => $sensorData");
debugPrint("GAS => ${sensorData["gasValue"]}");
debugPrint("TEMP => ${sensorData["temperature"]}");
debugPrint("HUM => ${sensorData["humidity"]}");
debugPrint("FLAME => ${sensorData["flame"]}");
debugPrint("ENABLED => ${sensorData["isEnabled"]}");
final alertData = await apiService.getAlert();

if (!mounted) return;



setState(() {
  gasValue = sensorData["gasValue"] ?? 0;

  tempValue =
    (sensorData["temperature"] as num?)?.toDouble() ?? 0.0;

humidityValue =
    (sensorData["humidity"] as num?)?.toDouble() ?? 0.0;
    flameDetected =
      sensorData["flame"]?.toString().toUpperCase() == "YES";

  gasOn = sensorData["isEnabled"] ?? false;

  

  dangerMode = alertData["isActive"] ?? false;

  alertMessage = alertData["message"] ?? "";

  
});
} catch (e) {
debugPrint("SENSOR ERROR: $e");
}

if (!mounted) return;

setState(() {
isLoading = false;
});
}

Future<void> handleGasToggle(bool value) async {
  try {
    await apiService.toggleGas(
      enableGas: value,
    );

    await loadSensorData();
  } catch (e) {
    debugPrint("TOGGLE GAS ERROR: $e");

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(e.toString()),
      ),
    );
  }
}



@override
Widget build(BuildContext context) {
if (isLoading) {
return const Scaffold(
body: Center(
child: CircularProgressIndicator(),
),
);
}

return Scaffold(
backgroundColor: const Color(0xffF8F8F8),
appBar: AppBar(
backgroundColor: Colors.white,
elevation: 0,
foregroundColor: Colors.black,
titleSpacing: 0,
title: const Row(
children: [
Icon(
Icons.cloud_outlined,
color: Colors.blue,
size: 18,
),
SizedBox(width: 8),
Text(
"Gas &Smoke\nMonitoring",
style: TextStyle(
fontSize: 15,
fontWeight: FontWeight.w600,
height: 1.2,
),
),
],
),
),
body: RefreshIndicator(
onRefresh: loadSensorData,
child: SingleChildScrollView(
physics: const AlwaysScrollableScrollPhysics(),
padding: const EdgeInsets.all(16),
child: Column(
children: [
Container(
width: double.infinity,
padding: const EdgeInsets.symmetric(
horizontal: 16,
vertical: 18,
),
decoration: BoxDecoration(
color: dangerMode
? Colors.red.withValues(alpha: 0.08)
    : Colors.green.withValues(alpha: 0.08),
borderRadius: BorderRadius.circular(18),
),
child: Column(
crossAxisAlignment: CrossAxisAlignment.start,
children: [
Text(
dangerMode
? "Danger detected!"
    : "Gas Levels are normal and Safe",
style: TextStyle(
color: dangerMode ? Colors.red : Colors.green,
fontWeight: FontWeight.bold,
fontSize: 15,
),
),
const SizedBox(height: 6),
Text(
alertMessage.isEmpty
    ? "No action needed"
    : alertMessage,
style: TextStyle(
color: Colors.grey.shade700,
),
),
],
),
),

const SizedBox(height: 18),

SensorCard(
title: "Gas Sensor",
value: "$gasValue",
unit: "PPM",
icon: Icons.local_fire_department,
progress: gasValue >= 1000 ? .85 : .12,
color: gasValue >= 1000 ? Colors.red : Colors.green,
levelText: gasValue >= 1000
? "High Level"
    : "Natural Level",
),

const SizedBox(height: 12),

SensorCard(
  title: "Temperature sensor",
  value: tempValue.toStringAsFixed(1),
unit: "°C",
icon: Icons.device_thermostat,
progress: tempValue >= 50 ? .80 : .10,
color: tempValue >= 50 ? Colors.red : Colors.green,
levelText: tempValue >= 50
? "High level"
    : "Normal level",
),

const SizedBox(height: 12),

SensorCard(
  title: "Humidity sensor",
  value: humidityValue.toStringAsFixed(1),
unit: "%",
icon: Icons.water_drop,
progress: humidityValue >= 70 ? .80 : .20,
color: humidityValue >= 70 ? Colors.red : Colors.green,
levelText: humidityValue >= 70
? "High level"
    : "Normal level",
),
const SizedBox(height: 12),

SensorCard(
  title: "Flame Sensor",
  value: flameDetected ? "YES" : "NO",
  unit: "",
  icon: Icons.local_fire_department,
  progress: flameDetected ? 1.0 : 0.0,
  color: flameDetected ? Colors.red : Colors.green,
  levelText: flameDetected
      ? "Flame Detected"
      : "No Flame Detected",
),
const SizedBox(height: 20),

const Align(
alignment: Alignment.centerLeft,
child: Text(
"System Control",
style: TextStyle(
fontSize: 18,
fontWeight: FontWeight.bold,
),
),
),

const SizedBox(height: 16),

ControlTile(
title: "Gas",
icon: Icons.gas_meter_rounded,
value: gasOn,
enabled: manualControlAllowed,
onChanged: (value) async {
await handleGasToggle(value);

if (!value) {
if (!context.mounted) return;

Navigator.push(
context,
MaterialPageRoute(
builder: (context) =>
const GasControlScreen(),
),
);
}
},
),

const SizedBox(height: 14),





],
),
),
),
);
}
}

class SensorCard extends StatelessWidget {
final String title;
final String value;
final String unit;
final double progress;
final Color color;
final String levelText;
final IconData icon;

const SensorCard({
super.key,
required this.title,
required this.value,
required this.unit,
required this.progress,
required this.color,
required this.levelText,
required this.icon,
});

@override
Widget build(BuildContext context) {
return Container(
padding: const EdgeInsets.symmetric(
horizontal: 16,
vertical: 14,
),
decoration: BoxDecoration(
color: Colors.white,
borderRadius: BorderRadius.circular(16),
border: Border.all(
color: Colors.grey.shade300,
),
),
child: Column(
crossAxisAlignment: CrossAxisAlignment.start,
children: [
Row(
mainAxisAlignment:
MainAxisAlignment.spaceBetween,
children: [
Text(
title,
style: const TextStyle(
fontSize: 15,
fontWeight: FontWeight.w500,
),
),
Icon(
icon,
color: Colors.grey.shade700,
),
],
),

const SizedBox(height: 10),

RichText(
text: TextSpan(
children: [
TextSpan(
text: value,
style: const TextStyle(
color: Colors.black,
fontSize: 28,
fontWeight: FontWeight.bold,
),
),
TextSpan(
text: " $unit",
style: TextStyle(
color: Colors.grey.shade700,
fontSize: 20,
),
),
],
),
),

const SizedBox(height: 12),

LinearProgressIndicator(
value: progress,
minHeight: 5,
borderRadius: BorderRadius.circular(30),
color: color,
backgroundColor: Colors.grey.shade300,
),

const SizedBox(height: 10),

Text(
levelText,
style: TextStyle(
color: color,
fontWeight: FontWeight.w600,
),
),
],
),
);
}
}

class ControlTile extends StatelessWidget {
final String title;
final IconData icon;
final bool value;
final bool enabled;
final Function(bool) onChanged;

const ControlTile({
super.key,
required this.title,
required this.icon,
required this.value,
required this.onChanged,
this.enabled = true,
});

@override
Widget build(BuildContext context) {
return Container(
padding: const EdgeInsets.symmetric(
horizontal: 16,
vertical: 10,
),
decoration: BoxDecoration(
color: Colors.white,
borderRadius: BorderRadius.circular(14),
border: Border.all(
color: Colors.grey.shade300,
),
),
child: Row(
children: [
Icon(
icon,
color: enabled ? Colors.blue : Colors.grey,
),

const SizedBox(width: 12),

Expanded(
child: Text(
title,
style: TextStyle(
fontSize: 16,
fontWeight: FontWeight.w500,
color: enabled ? Colors.black : Colors.grey,
),
),
),

Switch(
value: value,
activeColor: Colors.blue,
onChanged: enabled ? onChanged : null,
),
],
),
);
}
}

