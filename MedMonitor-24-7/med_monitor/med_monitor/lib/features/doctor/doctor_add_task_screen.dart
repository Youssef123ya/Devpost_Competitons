import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../models/task_model.dart';
import '../../models/user_model.dart';
import '../../models/app_models.dart';
import '../../providers/auth_provider.dart';
import '../../providers/task_provider.dart';
import '../../services/dio_client.dart';

// 🟢 Helper class to represent both UserModel and AdmissionRequest patients
class _PatientSearchResult {
  final String displayName;
  final String patientId;
  final String? email;
  final bool isFromAdmission;
  final UserModel? userModel;
  final AdmissionRequest? admissionRequest;

  _PatientSearchResult({
    required this.displayName,
    required this.patientId,
    this.email,
    required this.isFromAdmission,
    this.userModel,
    this.admissionRequest,
  });

  factory _PatientSearchResult.fromUser(UserModel user) {
    return _PatientSearchResult(
      displayName: user.userName ?? 'Unknown',
      patientId: user.id ?? '',
      email: user.email,
      isFromAdmission: false,
      userModel: user,
    );
  }

  factory _PatientSearchResult.fromAdmission(AdmissionRequest admission) {
    return _PatientSearchResult(
      displayName: admission.patientName,
      patientId: admission.patientId ?? '',
      email: null,
      isFromAdmission: true,
      admissionRequest: admission,
    );
  }
}

class DoctorAddTaskScreen extends StatefulWidget {
  final bool isEditing;
  final TaskModel? existingTask;
  final String? patientId;
  final String? patientName;
  final String? nurseId;
  final String? nurseName;

  const DoctorAddTaskScreen({
    super.key,
    this.isEditing = false,
    this.existingTask,
    this.patientId,
    this.patientName,
    this.nurseId,
    this.nurseName,
  });

  @override
  State<DoctorAddTaskScreen> createState() => _DoctorAddTaskScreenState();
}

class _DoctorAddTaskScreenState extends State<DoctorAddTaskScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _noteController = TextEditingController();
  final TextEditingController _patientNameController = TextEditingController();
  String _patientSearchText = '';
  
  // 🟢 Store search results which can be either Users or AdmissionRequests
  List<_PatientSearchResult> _filteredPatients = [];
  _PatientSearchResult? _selectedPatientResult;

  List<UserModel> _nurses = [];
  List<UserModel> _patients = []; // Registered patients (role==0)
  List<AdmissionRequest> _admissionPatients = []; // Approved admission request patients
  
  UserModel? _selectedNurse;
  UserModel? _selectedPatient;
  bool _isLoadingUsers = false;
  String? _userLoadError;

  DateTime _selectedDate = DateTime.now();
  String _startTime = "9:00 AM";
  String _endTime = "10:00 AM";
  String _remind = "10 minutes before";

  bool get _isEditMode => widget.existingTask != null;
  String _repeat = "Never";
  Color _selectedColor = const Color(0xFF3B5BB5);

  final List<String> _remindOptions = [
    "5 minutes before",
    "10 minutes before",
    "15 minutes before",
    "30 minutes before",
    "1 hour before"
  ];

  final List<String> _repeatOptions = ["Never", "Daily", "Weekly", "Monthly"];
  final List<Color> _colorOptions = [
    const Color(0xFF3B5BB5),
    const Color(0xFF7CA1FF),
    const Color(0xFF9E9E9E),
  ];

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime(2121),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() => _selectedDate = picked);
    }
  }

  Future<void> _selectTime(BuildContext context, bool isStartTime) async {
    final TimeOfDay? picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.now(),
    );
    if (picked != null) {
      setState(() {
        String formattedTime = picked.format(context);
        if (isStartTime) {
          _startTime = formattedTime;
        } else {
          _endTime = formattedTime;
        }
      });
    }
  }

  @override
  void initState() {
    super.initState();
    if (_isEditMode) {
      final task = widget.existingTask!;
      _titleController.text = task.title;
      _noteController.text = task.note;
      _selectedDate = task.date;
      _startTime = task.startTime;
      _endTime = task.endTime;
      _remind = task.remind.isNotEmpty ? task.remind : _remind;
      _repeat = task.repeat.isNotEmpty ? task.repeat : _repeat;
      _patientNameController.text = task.patientName;
      _patientSearchText = task.patientName;
      _selectedColor = task.color;
    }

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadUsers();
    });
  }

  void _prefillFieldsForEdit() {
    final task = widget.existingTask!;
    _titleController.text = task.title;
    _noteController.text = task.note;
    _selectedDate = task.date;
    _startTime = task.startTime;
    _endTime = task.endTime;
    _remind = task.remind;
    _repeat = task.repeat;
    _selectedColor = task.color;
    _patientNameController.text = task.patientName;
    _patientSearchText = task.patientName;
  }

  Future<void> _saveTask() async {
    final provider = Provider.of<TaskProvider>(context, listen: false);
    final messenger = ScaffoldMessenger.of(context);
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final selectedNurseId = _selectedNurse?.id ?? widget.nurseId ?? widget.existingTask?.nurseId ?? '';

    // 🟢 Only use patientId when the selected patient comes from a registered user.
    // AdmissionRequest entries may contain a national ID or admission record identifier,
    // which should not be sent as the task patientId unless it is a valid user GUID.
    final selectedPatientId = _selectedPatientResult != null
        ? (_selectedPatientResult!.isFromAdmission ? '' : _selectedPatientResult!.patientId)
        : _selectedPatient?.id ?? widget.patientId ?? widget.existingTask?.patientId ?? '';

    final nurseName = _selectedNurse?.userName ?? widget.nurseName ?? widget.existingTask?.nurseName ?? '';
    final patientName = _patientNameController.text.trim();
    final doctorId = widget.existingTask?.doctorId ?? authProvider.currentUser?.id ?? '1';

    debugPrint('=== SAVE TASK DEBUG ===');
    debugPrint('Nurse ID: $selectedNurseId | type: ${selectedNurseId.runtimeType}');
    debugPrint('Patient ID: $selectedPatientId | type: ${selectedPatientId.runtimeType}');
    debugPrint('Patient name text: $patientName');
    debugPrint('From Admission: ${_selectedPatientResult?.isFromAdmission}');

    if (_titleController.text.isEmpty) {
      messenger.showSnackBar(
        const SnackBar(content: Text("Title is required!")),
      );
      return;
    }

    if (_isLoadingUsers) {
      messenger.showSnackBar(
        const SnackBar(content: Text("Please wait while users are loading.")),
      );
      return;
    }

    if (selectedNurseId.isEmpty) {
      messenger.showSnackBar(
        const SnackBar(content: Text("Please select a nurse.")),
      );
      return;
    }

    // Patient selection is optional. If doctor typed a name but didn't select
    // an existing user, we'll send null for patientId and allow backend to accept it.
    if (selectedPatientId.isEmpty) {
      debugPrint('No patient selected; task will be created/updated without patientId');
    }

    final task = TaskModel(
      id: _isEditMode ? widget.existingTask!.id : '0',
      title: _titleController.text,
      note: _noteController.text,
      date: _selectedDate,
      startTime: _startTime,
      endTime: _endTime,
      remind: _remind,
      repeat: _repeat,
      nurseName: nurseName,
      patientName: patientName,
      nurseId: selectedNurseId,
      patientId: selectedPatientId,
      doctorId: doctorId,
      color: _selectedColor,
      status: _isEditMode ? widget.existingTask!.status : "To Do",
    );

    if (_isEditMode) {
      final updated = await provider.updateTaskOnServer(task);
      if (!mounted) return;

      if (updated) {
        messenger.showSnackBar(
          const SnackBar(content: Text("Task updated successfully")),
        );
        Navigator.pop(context, true);
      } else {
        messenger.showSnackBar(
          const SnackBar(content: Text("Failed to update task")),
        );
      }
      return;
    }

    final errorMessage = await provider.createTaskOnServer(task);
    if (!mounted) return;

    if (errorMessage == null) {
      messenger.showSnackBar(
        const SnackBar(content: Text("Task created successfully")),
      );
      if (Navigator.canPop(context)) {
        Navigator.pop(context, true);
      } else {
        Navigator.pushReplacementNamed(context, '/tasks');
      }
    } else {
      messenger.showSnackBar(
        SnackBar(content: Text(errorMessage)),
      );
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _noteController.dispose();
    _patientNameController.dispose();
    super.dispose();
  }

  Future<void> _loadUsers() async {
    setState(() {
      _isLoadingUsers = true;
      _userLoadError = null;
    });

    try {
      // 🟢 Load registered users (role==0 for patients, role==3 for nurses)
      final response = await DioClient.dio.get('/Users');
      List<dynamic> usersList = [];

      if (response.data is Map && response.data['rows'] is List) {
        usersList = response.data['rows'] as List;
      } else if (response.data is Map && response.data['data'] is List) {
        usersList = response.data['data'] as List;
      } else if (response.data is List) {
        usersList = response.data as List;
      } else {
        throw Exception('Unexpected /Users response format');
      }

      final allUsers = usersList
          .map((item) {
            try {
              return UserModel.fromJson(item as Map<String, dynamic>);
            } catch (_) {
              return null;
            }
          })
          .whereType<UserModel>()
          .toList();

      final nurses = allUsers.where((u) => u.role == 3).toList();
      final patients = allUsers.where((u) => u.role == 0).toList();

      setState(() {
        _nurses = nurses;
        _patients = patients;
      });

      // 🟢 Load approved admission requests as additional patient source
      await _loadAdmissionPatients();

      _setInitialSelections();
    } catch (e) {
      setState(() {
        _userLoadError = 'Failed to load users. Please try again.';
      });
      debugPrint('Error loading users: $e');
    } finally {
      setState(() {
        _isLoadingUsers = false;
      });
    }
  }

  Future<void> _loadAdmissionPatients() async {
    try {
      final response = await DioClient.dio.get('/AdmissionRequest/GetAll');
      List<dynamic> admissionList = [];

      if (response.data is Map && response.data['rows'] is List) {
        admissionList = response.data['rows'] as List;
      } else if (response.data is Map && response.data['data'] is List) {
        admissionList = response.data['data'] as List;
      } else if (response.data is List) {
        admissionList = response.data as List;
      }

      final allAdmissions = admissionList
          .map((item) {
            try {
              return AdmissionRequest.fromJson(item as Map<String, dynamic>);
            } catch (e) {
              debugPrint('Error parsing admission: $e');
              return null;
            }
          })
          .whereType<AdmissionRequest>()
          .toList();

      // Filter for approved requests only (status == 2 from API, or "approved" from fromJson parsing)
      final approvedAdmissions = allAdmissions.where((a) {
        final statusStr = a.status.toLowerCase();
        return statusStr == 'approved' || statusStr == '2';
      }).toList();

      setState(() {
        _admissionPatients = approvedAdmissions;
        debugPrint('Loaded ${approvedAdmissions.length} approved admission patients');
      });
    } catch (e) {
      debugPrint('Error loading admission patients: $e');
      // This is not critical, continue without admission patients
      setState(() {
        _admissionPatients = [];
      });
    }
  }

  void _setInitialSelections() {
    final nurseId = widget.nurseId ?? widget.existingTask?.nurseId;
    final patientId = widget.patientId ?? widget.existingTask?.patientId;
    final patientName = widget.patientName ?? widget.existingTask?.patientName;

    if (nurseId != null && nurseId.isNotEmpty) {
      final matchingNurses = _nurses.where((user) => user.id == nurseId).toList();
      if (matchingNurses.isNotEmpty) {
        _selectedNurse = matchingNurses.first;
      }
    }

    if (_selectedNurse == null && widget.nurseName?.isNotEmpty == true) {
      final matchingNurses = _nurses
          .where((user) => user.userName?.toLowerCase() == widget.nurseName!.toLowerCase())
          .toList();
      if (matchingNurses.isNotEmpty) {
        _selectedNurse = matchingNurses.first;
      }
    }

    // 🟢 Try to find patient from registered users first
    if (patientId != null && patientId.isNotEmpty) {
      final matchingPatients = _patients.where((user) => user.id == patientId).toList();
      if (matchingPatients.isNotEmpty) {
        _selectedPatient = matchingPatients.first;
        _selectedPatientResult = _PatientSearchResult.fromUser(_selectedPatient!);
        _patientNameController.text = _selectedPatient?.userName ?? '';
        _patientSearchText = _selectedPatient?.userName ?? '';
        return;
      }

      // Try to find patient from admission requests
      final matchingAdmissions =
          _admissionPatients.where((req) => req.patientId == patientId).toList();
      if (matchingAdmissions.isNotEmpty) {
        _selectedPatientResult = _PatientSearchResult.fromAdmission(matchingAdmissions.first);
        _patientNameController.text = matchingAdmissions.first.patientName;
        _patientSearchText = matchingAdmissions.first.patientName;
        return;
      }
    }

    // Fallback: match by name if ID doesn't match
    if (patientName?.isNotEmpty == true) {
      final matchingPatients = _patients
          .where((user) => user.userName?.toLowerCase() == patientName!.toLowerCase())
          .toList();
      if (matchingPatients.isNotEmpty) {
        _selectedPatient = matchingPatients.first;
        _selectedPatientResult = _PatientSearchResult.fromUser(_selectedPatient!);
        _patientNameController.text = _selectedPatient?.userName ?? '';
        _patientSearchText = _selectedPatient?.userName ?? '';
        return;
      }

      // Try admission requests
      final matchingAdmissions = _admissionPatients
          .where((req) => req.patientName.toLowerCase() == patientName!.toLowerCase())
          .toList();
      if (matchingAdmissions.isNotEmpty) {
        _selectedPatientResult = _PatientSearchResult.fromAdmission(matchingAdmissions.first);
        _patientNameController.text = matchingAdmissions.first.patientName;
        _patientSearchText = matchingAdmissions.first.patientName;
        return;
      }
    }
  }

  Widget _buildPatientAutocompleteField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Patient Name',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B5BB5),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF7CA1FF), width: 2),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          child: TextFormField(
            controller: _patientNameController,
            onChanged: (value) {
              setState(() {
                _patientSearchText = value;
                _selectedPatientResult = null;
                if (value.trim().isEmpty) {
                  _filteredPatients = [];
                } else {
                  // 🟢 Search in both registered users and admission request patients
                  final results = <_PatientSearchResult>[];

                  // Search in registered patients (from /Users)
                  for (final patient in _patients) {
                    final userName = patient.userName ?? '';
                    final email = patient.email ?? '';
                    if (userName.toLowerCase().contains(value.toLowerCase()) ||
                        email.toLowerCase().contains(value.toLowerCase())) {
                      results.add(_PatientSearchResult.fromUser(patient));
                    }
                  }

                  // Search in admission request patients
                  for (final admission in _admissionPatients) {
                    if (admission.patientName.toLowerCase().contains(value.toLowerCase())) {
                      results.add(_PatientSearchResult.fromAdmission(admission));
                    }
                  }

                  _filteredPatients = results;
                }
              });
            },
            decoration: InputDecoration(
              hintText: 'Type patient name...',
              hintStyle: const TextStyle(color: Color(0xFFBBBBBB)),
              border: InputBorder.none,
              suffixIcon: const Icon(Icons.search, color: Color(0xFF3B5BB5)),
            ),
            style: const TextStyle(color: Color(0xFF3B5BB5)),
          ),
        ),
        if (_patientSearchText.isNotEmpty && _filteredPatients.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade300),
              boxShadow: [
                BoxShadow(
                  color: const Color.fromRGBO(0, 0, 0, 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            constraints: const BoxConstraints(maxHeight: 220),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _filteredPatients.length,
              itemBuilder: (context, index) {
                final result = _filteredPatients[index];
                final sourceLabel = result.isFromAdmission ? ' (Admission)' : '';
                return ListTile(
                  title: Text(
                    '${result.displayName}$sourceLabel',
                    style: const TextStyle(color: Color(0xFF3B5BB5)),
                  ),
                  subtitle: result.email != null
                      ? Text(result.email!, style: const TextStyle(fontSize: 12))
                      : null,
                  onTap: () {
                    setState(() {
                      _selectedPatientResult = result;
                      _patientNameController.text = result.displayName;
                      _patientSearchText = result.displayName;
                      _filteredPatients = [];
                    });
                  },
                );
              },
            ),
          ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildUserDropdownField(
    String label,
    UserModel? selectedUser,
    List<UserModel> items,
    ValueChanged<UserModel?> onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B5BB5),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF7CA1FF), width: 2),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<UserModel>(
              value: selectedUser != null && items.any((user) => user.id == selectedUser.id) ? selectedUser : null,
              hint: Text(
                items.isEmpty ? 'Loading $label...' : 'Select $label',
                style: const TextStyle(color: Color(0xFFBBBBBB)),
              ),
              isExpanded: true,
              items: items.map((user) {
                return DropdownMenuItem<UserModel>(
                  value: user,
                  child: Text(user.userName ?? 'Unknown', style: const TextStyle(color: Color(0xFF3B5BB5))),
                );
              }).toList(),
              onChanged: items.isEmpty ? null : onChanged,
            ),
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFE9EEF6),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF3B5BB5), size: 28),
          onPressed: () => Navigator.pop(context),
        ),
        centerTitle: true,
        title: Text(
          widget.existingTask != null ? "Edit Task" : "Add Tasks",
          style: const TextStyle(
            color: Color(0xFF3B5BB5),
            fontSize: 26,
            fontWeight: FontWeight.bold,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Image.asset(
              'assets/team.png',
              width: 40,
              height: 40,
              fit: BoxFit.contain,
              errorBuilder: (context, error, stackTrace) => const Icon(Icons.people),
            ),
          )
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildInputField(
              "Title",
              "Enter title here",
              controller: _titleController,
            ),
            _buildInputField(
              "Note",
              "Enter description here",
              controller: _noteController,
              maxLines: 3,
            ),
            _buildInputField(
              "Date",
              DateFormat.yMd().format(_selectedDate),
              onTap: () => _selectDate(context),
              suffixIcon: Icons.calendar_month,
              readOnly: true,
            ),
            Row(
              children: [
                Expanded(
                  child: _buildInputField(
                    "Start time",
                    _startTime,
                    onTap: () => _selectTime(context, true),
                    suffixIcon: Icons.access_time,
                    readOnly: true,
                  ),
                ),
                const SizedBox(width: 15),
                Expanded(
                  child: _buildInputField(
                    "End time",
                    _endTime,
                    onTap: () => _selectTime(context, false),
                    suffixIcon: Icons.access_time,
                    readOnly: true,
                  ),
                ),
              ],
            ),
            _buildDropdownField("Remind", _remind, _remindOptions, (value) {
              setState(() => _remind = value);
            }),
            _buildDropdownField("Repeat", _repeat, _repeatOptions, (value) {
              setState(() => _repeat = value);
            }),
            if (_isLoadingUsers)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: const [
                    CircularProgressIndicator(),
                    SizedBox(width: 12),
                    Text('Loading nurses and patients...'),
                  ],
                ),
              )
            else if (_userLoadError != null)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 12.0),
                child: Text(
                  _userLoadError!,
                  style: const TextStyle(color: Colors.red),
                ),
              )
            else ...[
              _buildUserDropdownField(
                "Nurse",
                _selectedNurse,
                _nurses,
                (value) => setState(() => _selectedNurse = value),
              ),
              _buildPatientAutocompleteField(),
            ],
            const SizedBox(height: 20),
            _buildColorPicker(),
            const SizedBox(height: 30),
            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF7CA1FF),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(15),
                  ),
                ),
                onPressed: _saveTask,
                child: Text(
                  widget.existingTask != null ? "Update task" : "Create task",
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }

  Widget _buildInputField(
    String label,
    String hint, {
    TextEditingController? controller,
    IconData? suffixIcon,
    VoidCallback? onTap,
    ValueChanged<String>? onChanged,
    bool readOnly = false,
    int maxLines = 1,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B5BB5),
          ),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF7CA1FF), width: 2),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            child: TextFormField(
              controller: controller,
              readOnly: readOnly || onTap != null,
              maxLines: maxLines,
              minLines: 1,
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: const TextStyle(color: Color(0xFFBBBBBB)),
                border: InputBorder.none,
                suffixIcon: suffixIcon != null
                    ? Icon(suffixIcon, color: const Color(0xFF2E55A7))
                    : null,
              ),
              onChanged: onChanged,
              style: const TextStyle(color: Color(0xFF3B5BB5)),
            ),
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildDropdownField(
    String label,
    String value,
    List<String> options,
    Function(String) onChanged,
  ) {
    final safeValue = options.any((item) => item == value) ? value : null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B5BB5),
          ),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFF7CA1FF), width: 2),
          ),
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: DropdownButtonHideUnderline(
            child: DropdownButton<String>(
              value: safeValue,
              isExpanded: true,
              items: options.map((String val) {
                return DropdownMenuItem<String>(
                  value: val,
                  child: Text(val, style: const TextStyle(color: Color(0xFF3B5BB5))),
                );
              }).toList(),
              onChanged: (String? newValue) {
                if (newValue != null) onChanged(newValue);
              },
            ),
          ),
        ),
        const SizedBox(height: 15),
      ],
    );
  }

  Widget _buildColorPicker() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Color",
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF3B5BB5),
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: _colorOptions.map((color) {
            bool isSelected = _selectedColor == color;
            return Padding(
              padding: const EdgeInsets.only(right: 20),
              child: GestureDetector(
                onTap: () => setState(() => _selectedColor = color),
                child: Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: color,
                    shape: BoxShape.circle,
                    border: isSelected
                        ? Border.all(color: Colors.white, width: 3)
                        : null,
                  ),
                  child: isSelected
                      ? const Icon(Icons.check, color: Colors.white, size: 24)
                      : null,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}
