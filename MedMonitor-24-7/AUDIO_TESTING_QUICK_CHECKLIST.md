# Quick Testing Checklist for Audio Alerts

## Pre-Test Setup
- [ ] Real Android device connected via USB with debugging enabled
- [ ] Flutter installed and `flutter --version` works
- [ ] Backend service running and accessible
- [ ] Test patient/bed data in database

## Deployment
- [ ] Run: `cd c:\PROJECTFINAL-NUB\fiels project\med_monitor\med_monitor`
- [ ] Run: `flutter clean`
- [ ] Run: `flutter pub get`
- [ ] Run: `flutter run -v` (watch console for logs)
- [ ] Wait for app to fully load on device

## Log Verification (Startup)
After app loads, check Flutter console for these logs:
```
✅ [Main] Notification audio initialization completed
✅ [E2E:Flutter][SignalR] ✅ CONNECTED SUCCESSFULLY
✅ [E2E:Flutter][SignalR] Event handlers registered
```

## Test 1: Send Warning Alert
1. Trigger AI Alert from backend with `severity = 'warning'`
2. Watch device: Does sound play?
3. Check Flutter console for logs:
   - [ ] `[BEFORE setAsset] Player state:`
   - [ ] `[AFTER setAsset] Player state: ... duration=1000ms`
   - [ ] `[AFTER play()] Player state: playing=true`
   - [ ] `[AFTER 500ms delay] Player state:`
   - [ ] `[PositionStream] Current position:` (multiple entries)
4. Notification list updates?

## Test 2: Send Critical Alert
1. Trigger AI Alert from backend with `severity = 'critical'`
2. Watch device: Does sound play (different from warning if applicable)?
3. Check logs for same sequence as Test 1

## Test 3: Send Info Alert (Should NOT play sound)
1. Trigger AI Alert from backend with `severity = 'info'`
2. Watch device: Sound should NOT play
3. Notification list updates but NO audio logs appear

## Test 4: Multiple Alerts in Quick Succession
1. Trigger 3 Warning alerts in quick succession (5-10 second intervals)
2. Each alert should play sound
3. No crashes or audio "stuck" errors

## Troubleshooting

### Scenario: No sound plays, but logs show play()=true
- Audio library issue, SystemSound fallback should have triggered
- Check device volume settings (not on silent/vibrate-only)
- Check if SystemSound log appears instead
- Consider package replacement (see Phase 2 Complete doc)

### Scenario: No logs at all, no sound
- SignalR not connected (check [SignalR] ✅ CONNECTED log)
- Alert not reaching NotificationProvider
- Check backend alert transmission logs
- Test SignalR with non-audio notification first

### Scenario: Sound plays but very quiet
- Check Android device mixer settings
- May need to set audio stream type or audio focus mode
- Contact user for device audio settings check

### Scenario: Vibration instead of sound
- Assets failed to load, fallback vibration activated
- This is OK! Alerts are still being delivered
- Check for asset codec compatibility issues

## Log Capture for Analysis
Run in terminal while testing:
```bash
adb logcat -s flutter | Tee-Object audio_test_logs.txt
# Keep running while doing tests, Ctrl+C to stop
```
Share the captured log file for detailed analysis.

## Success Criteria
- [ ] Warning alert plays sound
- [ ] Critical alert plays sound  
- [ ] Info alert does NOT play sound
- [ ] Multiple consecutive alerts all produce sound
- [ ] No crashes or errors
- [ ] Notification list updates in sync with audio

## Status After Testing
- [ ] All tests passed → Audio system is working
- [ ] Some tests failed → Share logs for diagnosis
- [ ] No sound at all → Check device permissions and volume
- [ ] Vibration only → Asset loading issue, need codec check
