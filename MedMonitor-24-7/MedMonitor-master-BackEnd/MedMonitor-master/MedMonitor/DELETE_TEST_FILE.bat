@echo off
cd /d "c:\Nahda CS\PROJECT FINAL-NUB\fiels project\MedMonitor-master-BackEnd\MedMonitor-master\MedMonitor"
if exist AIAlertServiceTests.cs (
    del AIAlertServiceTests.cs
    echo ✅ تم حذف ملف الاختبارات
) else (
    echo ⚠️ الملف غير موجود
)
pause
