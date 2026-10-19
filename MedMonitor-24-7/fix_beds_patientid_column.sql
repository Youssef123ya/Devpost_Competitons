-- Add PatientId column back to Beds table if it doesn't exist
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'Beds' AND COLUMN_NAME = 'PatientId'
)
BEGIN
    ALTER TABLE [Beds]
    ADD [PatientId] NVARCHAR(MAX) NULL;
    
    PRINT 'PatientId column added successfully';
END
ELSE
BEGIN
    PRINT 'PatientId column already exists';
END;

-- Update test beds with the known GUID that has vital signs
UPDATE [Beds]
SET [PatientId] = '2bb80e09-1a79-42b3-9357-299b7b75f316'
WHERE [Id] IN (2786, 2787, 2788, 2789, 2790);

PRINT 'Updated 5 beds with PatientId';

-- Verify the update
SELECT TOP 10 [Id], [BedNumber], [Status], [PatientId], [PatientName]
FROM [Beds]
WHERE [PatientId] IS NOT NULL OR [Id] IN (2786, 2787, 2788, 2789, 2790);
