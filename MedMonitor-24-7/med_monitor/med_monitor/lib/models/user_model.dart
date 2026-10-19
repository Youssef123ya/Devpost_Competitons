class UserModel {
  final String? id;
  final String? email;
  final String? phoneNumber;
  final String? userName;
  final String? token;
  final String? tockenAgora;
  final String? tockenUserAgoraChat;
  final int? role;
  final int? gender;
  final String? imageUrl; // ✅ الاسم المعتمد في السواجر
  final String? specialization;
  final String? dateOfBirth;

  UserModel({
    this.id, this.email, this.phoneNumber, this.userName,
    this.token, this.tockenAgora, this.tockenUserAgoraChat,
    this.role, this.gender, this.imageUrl, this.specialization,
    this.dateOfBirth,
  });

  // ✅ إضافة imagePath كـ getter عشان يشتغل مع كود الـ NurseHomeScreen بدون تعديل
  String? get imagePath => imageUrl;

  UserModel copyWith({
    String? id,
    String? userName,
    String? email,
    String? phoneNumber,
    String? dateOfBirth,
    int? gender,
    String? specialization,
    String? imageUrl,
    int? role,
    String? token,
  }) {
    return UserModel(
      id: id ?? this.id,
      userName: userName ?? this.userName,
      email: email ?? this.email,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      dateOfBirth: dateOfBirth ?? this.dateOfBirth,
      gender: gender ?? this.gender,
      specialization: specialization ?? this.specialization,
      imageUrl: imageUrl ?? this.imageUrl,
      role: role ?? this.role,
      token: token ?? this.token,
      tockenAgora: this.tockenAgora,
      tockenUserAgoraChat: this.tockenUserAgoraChat,
    );
  }

  int get age {
    if (dateOfBirth == null || dateOfBirth!.isEmpty) return 0;
    try {
      DateTime birthDate = DateTime.parse(dateOfBirth!);
      DateTime today = DateTime.now();
      int age = today.year - birthDate.year;
      if (today.month < birthDate.month || (today.month == birthDate.month && today.day < birthDate.day)) {
        age--;
      }
      return age;
    } catch (e) {
      return 0;
    }
  }

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final idValue = json['id'] ?? json['Id'] ?? json['userId'] ?? json['UserId'] ?? json['userID'] ?? json['UserID'];
    final emailValue = json['email'] ?? json['Email'];
    final phoneValue = json['phoneNumber'] ?? json['phone'] ?? json['PhoneNumber'] ?? json['phoneNumber'];
    final userNameValue = json['userName'] ?? json['UserName'] ?? json['username'] ?? json['Username'];
    final roleValue = json['role'] ?? json['Role'];
    final genderValue = json['gender'] ?? json['Gender'];
    final imageUrlValue = json['imageUrl'] ?? json['imageUrl'] ?? json['imagePath'] ?? json['ImageUrl'];

    return UserModel(
      id: idValue?.toString(),
      email: emailValue?.toString(),
      phoneNumber: phoneValue?.toString(),
      userName: userNameValue?.toString(),
      token: json['token'] ?? json['Token']?.toString(),
      tockenAgora: json['tockenAgora'] ?? json['tokenAgora']?.toString(),
      tockenUserAgoraChat: json['tockenUserAgoraChat'] ?? json['tokenUserAgoraChat']?.toString(),
      // ✅ تحويل آمن للـ role و gender عشان لو جم String من السيرفر
      role: roleValue is String ? int.tryParse(roleValue) : roleValue as int?,
      gender: genderValue is String ? int.tryParse(genderValue) : genderValue as int?,
      imageUrl: imageUrlValue?.toString(), // ✅ دعم الاسمين
      specialization: json['specialization']?.toString() ?? json['Specialization']?.toString(),
      dateOfBirth: json['dateOfBirth']?.toString() ?? json['DateOfBirth']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,
      "email": email,
      "phoneNumber": phoneNumber,
      "userName": userName,
      "token": token,
      "role": role,
      "gender": gender,
      "imageUrl": imageUrl,
      "specialization": specialization,
      "dateOfBirth": dateOfBirth,
    };
  }
}