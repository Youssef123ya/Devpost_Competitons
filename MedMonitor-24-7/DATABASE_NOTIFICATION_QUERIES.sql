-- MedMonitor Notification Debugging Queries
-- Run these queries in SQL Server Management Studio to verify notification records

-- ==========================================
-- 1. Check Recent Notification Records
-- ==========================================
SELECT TOP 20 
    Id, 
    NurseId, 
    Title, 
    TaskName, 
    PatientName, 
    Note, 
    IsRead, 
    CreatedAt
FROM Notifications
ORDER BY CreatedAt DESC;

-- ==========================================
-- 2. Check if Your Doctor/Nurse User IDs Exist
-- ==========================================
-- Get all Doctors
SELECT TOP 10 
    Id, 
    UserName, 
    FullName, 
    Email,
    Role 
FROM Users 
WHERE Role = 2  -- 2 = Doctor
ORDER BY FullName;

-- Get all Nurses
SELECT TOP 10 
    Id, 
    UserName, 
    FullName, 
    Email,
    Role 
FROM Users 
WHERE Role = 1  -- 1 = Nurse
ORDER BY FullName;

-- ==========================================
-- 3. Check AI Alert Notifications Specifically
-- ==========================================
SELECT 
    Id, 
    NurseId, 
    Title, 
    TaskName, 
    PatientName,
    Note,
    IsRead, 
    CreatedAt,
    DATEDIFF(MINUTE, CreatedAt, GETUTCDATE()) AS 'Minutes Ago'
FROM Notifications
WHERE Title LIKE '%AI Alert%' OR TaskName LIKE '%AI%'
ORDER BY CreatedAt DESC;

-- ==========================================
-- 4. Count Notifications by User (Recent 24 hours)
-- ==========================================
SELECT 
    NurseId,
    (SELECT UserName FROM Users WHERE Id = Notifications.NurseId) AS NurseUserName,
    COUNT(*) AS NotificationCount,
    MAX(CreatedAt) AS LastNotification
FROM Notifications
WHERE CreatedAt >= DATEADD(DAY, -1, GETUTCDATE())
GROUP BY NurseId
ORDER BY NotificationCount DESC;

-- ==========================================
-- 5. Verify Unread Notifications for a Specific User
-- ==========================================
-- Replace '581d5fe5-0001-0000-0000-000000000000' with the actual user ID
SELECT 
    Id, 
    Title, 
    TaskName, 
    PatientName,
    IsRead, 
    CreatedAt
FROM Notifications
WHERE NurseId = '581d5fe5-0001-0000-0000-000000000000'  -- ← CHANGE THIS TO YOUR USER ID
  AND IsRead = 0
ORDER BY CreatedAt DESC;

-- ==========================================
-- 6. Check Admission Requests (for patient mapping)
-- ==========================================
SELECT TOP 10
    Id,
    PatientId,
    PatientName,
    NurseName,
    (SELECT Id FROM Users WHERE UserName = AdmissionRequests.NurseName) AS NurseUserId,
    Status,
    CreatedAt
FROM AdmissionRequests
ORDER BY CreatedAt DESC;

-- ==========================================
-- 7. Test Query: Get All Unread AI Alerts
-- ==========================================
SELECT 
    n.Id, 
    n.NurseId,
    u.UserName AS NurseUserName,
    n.Title, 
    n.PatientName,
    n.Note,
    n.CreatedAt
FROM Notifications n
LEFT JOIN Users u ON n.NurseId = u.Id
WHERE n.Title LIKE '%AI Alert%' 
  AND n.IsRead = 0
ORDER BY n.CreatedAt DESC;

-- ==========================================
-- 8. Verify ChatHub User Mappings (if tracking exists)
-- ==========================================
-- Note: SignalR connection tracking might not be in DB, 
-- but check if there's a log table for connections
SELECT TOP 20 * FROM [YourLogTableIfExists]
WHERE Message LIKE '%ChatHub%' OR Message LIKE '%SignalR%'
ORDER BY LogDate DESC;

-- ==========================================
-- 9. COUNT TOTAL RECORDS
-- ==========================================
SELECT 
    'Notifications' AS TableName, COUNT(*) AS RecordCount FROM Notifications
UNION ALL
SELECT 'Users', COUNT(*) FROM Users
UNION ALL
SELECT 'AdmissionRequests', COUNT(*) FROM AdmissionRequests;

-- ==========================================
-- 10. Find Patient by PatientId (for verification)
-- ==========================================
SELECT TOP 5
    Id,
    PatientName,
    PatientPhone,
    PatientEmail,
    Gender,
    DateOfBirth
FROM AdmissionRequests
WHERE PatientId = '12345'  -- ← CHANGE THIS TO YOUR TEST PATIENT ID
ORDER BY CreatedAt DESC;
