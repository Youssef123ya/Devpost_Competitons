# Audio Alert Fix - Deployment Commands Reference

## System Requirements Check
```bash
# Verify Flutter installation
flutter --version

# Check Android SDK
flutter doctor

# List connected devices
adb devices
```

## Step 1: Clean and Prepare
```bash
cd c:\PROJECTFINAL-NUB\fiels project\med_monitor\med_monitor

# Clean build cache
flutter clean

# Get dependencies
flutter pub get
```

## Step 2: Deploy to Android Device
```bash
# Connect real Android device via USB with debugging enabled

# Deploy with verbose logging
flutter run -v

# Alternative: Run on specific device
flutter run -v -d <device_id>
```

## Step 3: Monitor Logs in Real-Time
**In another terminal window:**
```bash
# Stream only Flutter logs (audio related)
adb logcat -s flutter | find "🔊"

# OR capture all Flutter logs to file
adb logcat -s flutter > audio_logs.txt

# Then stop with Ctrl+C
```

## Step 4: Trigger Test Alerts
```
From backend/admin console:
1. Send WARNING alert (severity='warning')
   Expected: Sound plays, logs show player.playing=true
   
2. Send CRITICAL alert (severity='critical')
   Expected: Sound plays, logs show player.playing=true
   
3. Send INFO alert (severity='info')
   Expected: NO sound, but notification appears in list
```

## Log Analysis Commands
```bash
# Extract only player state logs
adb logcat -s flutter | findstr "AFTER play"

# Extract position logs
adb logcat -s flutter | findstr "PositionStream"

# Get all audio initialization logs
adb logcat -s flutter | findstr "🔊"

# Save to file for sharing
adb logcat -s flutter > debug_logs.txt
(wait 30 seconds)
# Press Ctrl+C to stop
```

## Build Variants

### Standard Debug Build (Fast, for testing)
```bash
flutter run -v
```

### Profile Build (Performance testing)
```bash
flutter run -v --profile
```

### Release Build (Optimized)
```bash
flutter run -v --release
# Note: Debug prints may be stripped in release
```

## Troubleshooting Commands

### Clear App Data (Full Reset)
```bash
adb shell pm clear com.example.med_monitor
# Then reinstall: flutter run -v
```

### Kill and Restart App
```bash
adb shell am force-stop com.example.med_monitor
# Then restart: flutter run -v
```

### Check Device Audio Settings
```bash
adb shell dumpsys audio
```

### Verify Assets in APK
```bash
# Build APK
flutter build apk -v

# Check APK contents
unzip build/app/outputs/apk/debug/app-debug.apk -l | findstr "notification"
```

## File Locations Checklist

✅ Source Files (Already Modified):
- `lib/services/notification_sound_service.dart` - Audio playback logic
- `lib/services/signalr_service.dart` - Alert delivery (RESTORED)
- `lib/main.dart` - Audio initialization at startup
- `lib/providers/notification_provider.dart` - Async notification delivery
- `android/app/src/main/AndroidManifest.xml` - Added MODIFY_AUDIO_SETTINGS

✅ Asset Files (Already Created):
- `assets/notification.wav` - Primary alert sound (1.0 sec, 1000 Hz)
- `assets/notification_alt.wav` - Backup alert sound (1.0 sec, 1200 Hz)

✅ Configuration:
- `pubspec.yaml` - Assets registered under `assets:` section

## Quick Test Script (Save as test_audio.bat)
```batch
@echo off
cd c:\PROJECTFINAL-NUB\fiels project\med_monitor\med_monitor
echo Cleaning...
flutter clean
echo Getting dependencies...
flutter pub get
echo Deploying to device...
flutter run -v
echo.
echo Once app is running, send test alerts from backend.
echo Logs will appear in this console.
pause
```

Then run: `test_audio.bat`

## Expected Console Output

### On Startup:
```
[✓] Built build/app/outputs/apk/debug/app-debug.apk.
[Main] Notification audio initialization completed
[E2E:Flutter][SignalR] ✅ CONNECTED SUCCESSFULLY
[E2E:Flutter][SignalR] Event handlers registered for ReceiveTaskNotification
```

### When Alert Arrives:
```
[E2E:Flutter][SignalR] ReceiveTaskNotification EVENT RECEIVED!
[SignalR Event] Parsed JSON: {taskName: '...', alertLevel: 'warning', ...}
[E2E:Flutter][SignalR] Calling addNotification()...
[E2E:Flutter][SignalR] ✅ addNotification() completed successfully
🔊 Playing alert sound...
🔊 [BEFORE setAsset] Player state: playing=false, processingState=ready, volume=0.0
🔊 Asset bundle loaded: assets/notification.wav
🔊 [AFTER setAsset] Player state: playing=false, processingState=ready, duration=1000ms
🔊 Volume set to 1.0 (100%)
🔊 Calling play()...
🔊 [AFTER play()] Player state: playing=true, processingState=ready, volume=1.0
🔊 [PositionStream] Current position: 123ms / 1000ms
🔊 [PositionStream] Current position: 234ms / 1000ms
🔊 [AFTER 500ms delay] Player state: playing=true
🔊 Alert sound played successfully
```

## Common Issues and Fixes

### Issue: "flutter: command not found"
**Fix**: Add Flutter to PATH
```bash
# Add to your environment or use full path:
C:\path\to\flutter\bin\flutter run -v
```

### Issue: "No connected devices"
**Fix**: Enable USB debugging on device
1. Settings → Developer Options → USB Debugging (ON)
2. Connect via USB
3. Run: `adb devices`

### Issue: "Gradle build failed"
**Fix**: Clean and rebuild
```bash
flutter clean
flutter pub get
flutter run -v
```

### Issue: "Waiting for another flutter command"
**Fix**: Kill existing flutter process
```bash
# Windows
taskkill /IM dart.exe /F

# Or just open new terminal
```

## Success Indicators

✅ Audio alerts play when warnings/critical alerts arrive
✅ Multiple consecutive alerts each produce sound
✅ Console logs show proper state progression
✅ No crashes or errors
✅ Notification list updates simultaneously with sound
✅ Info alerts do NOT produce sound

## Next Phase

If audio still doesn't play after testing:
1. Share captured `audio_logs.txt` with console output
2. Check if `player.playing=true` appears in logs
3. If yes: Likely just_audio issue → may need package replacement
4. If no: Check asset loading, permissions, device settings

See: **AUDIO_ALERT_FIX_PHASE_2_COMPLETE.md** for troubleshooting details
