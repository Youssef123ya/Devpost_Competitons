enum TaskStatus { new_task, inProgress, completed, cancelled }
enum UserRole { superAdmin, doctor, nurse, patient }

// تحويل الرقم اللي جاي من الباك لـ Enum
TaskStatus getTaskStatus(int value) => TaskStatus.values[value - 1];
UserRole getUserRole(int value) => UserRole.values[value - 1];