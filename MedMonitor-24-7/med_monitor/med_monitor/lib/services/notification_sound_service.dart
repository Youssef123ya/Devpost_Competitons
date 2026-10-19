import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show SystemSound, SystemSoundType, rootBundle, HapticFeedback;
import 'package:just_audio/just_audio.dart';

class NotificationSoundService {
  static final NotificationSoundService _instance = NotificationSoundService._internal();
  static bool _isAudioInitialized = false;
  late final AudioPlayer _audioPlayer;
  static const List<String> _assetCandidates = [
    'assets/notification.mp3',
    'assets/notification.wav',
    'assets/notification_alt.wav',
    'assets/notification.ogg',
  ];

  factory NotificationSoundService() {
    return _instance;
  }

  NotificationSoundService._internal() {
    _audioPlayer = AudioPlayer();
  }

  /// Initialize audio on web after first user interaction
  /// This works around browser autoplay restrictions
  Future<void> initializeAudio() async {
    if (_isAudioInitialized) {
      debugPrint('🔊 Audio already initialized');
      return;
    }

    try {
      if (kIsWeb) {
        debugPrint('🔊 [Web] Initializing audio for web browser...');
        try {
          await _audioPlayer.setAsset('assets/notification.mp3');
          await _audioPlayer.setVolume(1.0);
          _isAudioInitialized = true;
          debugPrint('🔊 [Web] Audio initialized successfully with asset');
        } catch (e) {
          _isAudioInitialized = true;
          debugPrint('🔊 [Web] Audio initialized (asset not available, but system ready). Error: $e');
        }
      } else {
        debugPrint('🔊 [Mobile] Initializing audio...');
        try {
          await _audioPlayer.setVolume(1.0);
          await _audioPlayer.setAsset('assets/notification.wav');
          _isAudioInitialized = true;
          debugPrint('🔊 [Mobile] Audio initialized successfully with notification.wav');
        } catch (e) {
          _isAudioInitialized = true;
          debugPrint('⚠️ [Mobile] Audio initialized without preloaded asset. Error: $e');
        }
      }
    } catch (e) {
      _isAudioInitialized = true;
      debugPrint('⚠️ Audio initialization warning: $e (continuing anyway)');
    }
  }

  /// Check if audio is initialized
  bool get isAudioInitialized => _isAudioInitialized;

  /// Play notification sound when new task is assigned
  /// Only plays if audio has been initialized (works around browser autoplay restrictions)
  Future<void> playNotificationSound() async {
    debugPrint('🔊 Playing alert sound...');
    final platform = kIsWeb ? 'Web' : (defaultTargetPlatform == TargetPlatform.android ? 'Android' : defaultTargetPlatform.toString());
    debugPrint('🔊 [Platform] Running on: $platform');
    try {
      if (kIsWeb && !_isAudioInitialized) {
        debugPrint('⚠️ Audio not yet initialized on web (browser autoplay restriction). Initialize with initializeAudio() first.');
        return;
      }

      for (final assetPath in _assetCandidates) {
        try {
          debugPrint('🔊 Attempting to play asset: $assetPath');
          debugPrint('🔊 [BEFORE setAsset] Player state: playing=${_audioPlayer.playing}, processingState=${_audioPlayer.processingState}, volume=${_audioPlayer.volume}');
          
          await rootBundle.load(assetPath);
          debugPrint('🔊 Asset bundle loaded: $assetPath');
          
          await _audioPlayer.setAsset(assetPath);
          debugPrint('🔊 [AFTER setAsset] Player state: playing=${_audioPlayer.playing}, processingState=${_audioPlayer.processingState}, duration=${_audioPlayer.duration}, volume=${_audioPlayer.volume}');
          
          // Set audio session category for notification (iOS) / audio mode (Android)
          try {
            await _audioPlayer.setAudioSource(_audioPlayer.audioSource!);
            debugPrint('🔊 Audio source set successfully');
          } catch (e) {
            debugPrint('⚠️ Could not set audio source: $e');
          }
          
          // Ensure volume is max
          await _audioPlayer.setVolume(1.0);
          debugPrint('🔊 Volume set to 1.0 (100%)');
          
          // Add a listener to track state changes during playback
          _audioPlayer.playerStateStream.listen((state) {
            debugPrint('🔊 [PlayerStateListener] playing=${state.playing}, processingState=${state.processingState}');
          });
          
          // Add a listener to track position during playback
          _audioPlayer.positionStream.listen((position) {
            debugPrint('🔊 [PositionStream] Current position: ${position.inMilliseconds}ms / ${_audioPlayer.duration?.inMilliseconds ?? 0}ms');
          });
          
          debugPrint('🔊 Calling play()...');
          await _audioPlayer.play();
          debugPrint('🔊 [AFTER play()] Player state: playing=${_audioPlayer.playing}, processingState=${_audioPlayer.processingState}, volume=${_audioPlayer.volume}');
          debugPrint('🔊 Notification sound played from asset: $assetPath');
          debugPrint('🔊 Alert sound played successfully');
          
          // Wait a bit to ensure sound starts
          await Future.delayed(Duration(milliseconds: 500));
          debugPrint('🔊 [AFTER 500ms delay] Player state: playing=${_audioPlayer.playing}, processingState=${_audioPlayer.processingState}, duration=${_audioPlayer.duration}');
          
          return;
        } catch (e, stack) {
          debugPrint('⚠️ Could not load/play asset $assetPath: $e');
          debugPrint('⚠️ Stack trace: $stack');
        }
      }

      debugPrint('🔊 No bundled asset available, trying platform system sound fallback');
      try {
        SystemSound.play(SystemSoundType.alert);
        debugPrint('🔊 Notification sound played via SystemSound fallback');
        debugPrint('🔊 Alert sound played successfully');
        return;
      } catch (e) {
        debugPrint('⚠️ SystemSound fallback failed: $e');
      }
      
      // Ultimate fallback: Haptic feedback (vibration)
      debugPrint('🔊 Trying haptic vibration as last resort fallback...');
      try {
        await HapticFeedback.heavyImpact();
        debugPrint('🔊 Haptic feedback triggered successfully');
        // Do multiple vibrations for alert
        await Future.delayed(Duration(milliseconds: 200));
        await HapticFeedback.heavyImpact();
        debugPrint('🔊 Alert vibration pattern completed');
        debugPrint('🔊 Alert notification delivered via vibration');
      } catch (e) {
        debugPrint('⚠️ Haptic feedback also failed: $e');
      }
    } catch (e, stack) {
      debugPrint('⚠️ Could not play notification sound: $e');
      debugPrint('⚠️ Stack trace: $stack');
    }
  }

  /// Dispose audio player
  Future<void> dispose() async {
    await _audioPlayer.dispose();
  }
}
