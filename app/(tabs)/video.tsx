import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import {
  Video as VideoIcon,
  Mic,
  MicOff,
  PhoneOff,
  RotateCcw,
  Circle,
  StopCircle,
  Filter,
} from 'lucide-react-native';
import { Camera, CameraType, useCameraPermissions, WhiteBalance } from 'expo-camera';
import { Video } from 'expo-av';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { LinearGradient } from 'expo-linear-gradient';

export default function VideoScreen() {
  const { companion, isPremium, updateInteractions, addVideoCall } =
    useAppState();
  const [isCallActive, setIsCallActive] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [cameraPosition, setCameraPosition] = useState('front');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<Camera | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideos, setRecordedVideos] = useState<string[]>([]);
  const videoFilters = [
    { name: 'Normal', value: WhiteBalance.auto },
    { name: 'Warm', value: WhiteBalance.sunny },
    { name: 'Cool', value: WhiteBalance.fluorescent }
  ];
  const [filterIndex, setFilterIndex] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isCallActive) {
      intervalRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);

        // Increment interactions counter every minute
        if (callDuration > 0 && callDuration % 60 === 0) {
          updateInteractions(3); // Video calls count as more meaningful interactions
        }
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCallActive, callDuration]);

  const startCall = async () => {
    if (!permission || !permission.granted) {
      const perm = await requestPermission();
      if (!perm.granted) {
        return;
      }
    }

    if (!isPremium) {
      // Allow a short free preview before showing premium modal
      setIsCallActive(true);
      setTimeout(() => {
        endCall();
        setShowPremiumModal(true);
      }, 30000); // 30 seconds preview
    } else {
      setIsCallActive(true);
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    if (isRecording) {
      stopRecording();
    }
    if (callDuration > 0) {
      addVideoCall(callDuration);
    }
    setCallDuration(0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const flipCamera = () => {
    setCameraPosition((prev) => (prev === 'front' ? 'back' : 'front'));
  };

  const startRecording = async () => {
    if (!cameraRef.current) return;
    try {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync();
      setRecordedVideos((prev) => [video.uri, ...prev]);
    } catch (err) {
      console.log('Failed to record video', err);
    } finally {
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {isCallActive ? (
        // Active call view
        <View style={styles.callContainer}>
          {/* Companion video (full screen) */}
          <Image
            source={{ uri: companion.videoUrl || companion.avatarUrl }}
            style={styles.remoteVideo}
            resizeMode="cover"
          />

          {/* Overlay gradient for better UI visibility */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.controlsGradient}
            pointerEvents="none"
          />

          {/* Call duration display */}
          <View style={styles.durationContainer}>
            <Text style={styles.durationText}>{formatTime(callDuration)}</Text>
          </View>

          {/* User video (small overlay) */}
          <View style={styles.localVideoContainer}>
            <Camera
              ref={cameraRef}
              style={styles.localVideo}
              type={
                cameraPosition === 'front' ? CameraType.front : CameraType.back
              }
              whiteBalance={videoFilters[filterIndex].value}
              ratio="16:9"
            />
          </View>

          {/* Call controls */}
          <View style={styles.activeCallControls}>
            <TouchableOpacity style={styles.controlButton} onPress={flipCamera}>
              <RotateCcw size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={toggleMute}>
              {isMuted ? (
                <MicOff size={24} color="#FFFFFF" />
              ) : (
                <Mic size={24} color="#FFFFFF" />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setFilterIndex((filterIndex + 1) % videoFilters.length)}
            >
              <Filter size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <StopCircle size={24} color="#FFFFFF" />
              ) : (
                <Circle size={24} color="#FF3B30" />
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.endCallButton} onPress={endCall}>
              <PhoneOff size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterLabelContainer} pointerEvents="none">
            <Text style={styles.filterLabel}>{videoFilters[filterIndex].name}</Text>
          </View>
        </View>
      ) : (
        // Call setup view
        <View style={styles.setupContainer}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Video Call</Text>
          </View>

          <View style={styles.companionContainer}>
            <Image
              source={{ uri: companion.avatarUrl }}
              style={styles.avatarLarge}
            />
            <Text style={styles.companionName}>{companion.name}</Text>
            <Text style={styles.companionStatus}>Available for video call</Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>
              Video Call with {companion.name}
            </Text>
            <Text style={styles.infoText}>
              Connect face-to-face with your AI companion through a simulated
              video call experience.
              {!isPremium && ' Free preview limited to 30 seconds.'}
            </Text>
          </View>

          <TouchableOpacity style={styles.startCallButton} onPress={startCall}>
            <VideoIcon size={24} color="#FFFFFF" style={styles.startCallIcon} />
            <Text style={styles.startCallText}>Start Video Call</Text>
          </TouchableOpacity>

          {recordedVideos.length > 0 && (
            <View style={styles.recordingsContainer}>
              {recordedVideos.map((uri, index) => (
                <View key={index} style={styles.recordingItem}>
                  <Video
                    source={{ uri }}
                    style={styles.recordingVideo}
                    useNativeControls
                    resizeMode="cover"
                  />
                  <Text style={styles.recordingLabel}>
                    Recording {index + 1}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      <PremiumFeatureModal
        visible={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        featureName="Unlimited Video Calls"
        description="Enjoy unlimited video calls with your AI companion and unlock more realistic interactions."
      />
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  setupContainer: {
    flex: 1,
    alignItems: 'center',
  },
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 10,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  companionContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  avatarLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E1E1E1',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  companionName: {
    fontSize: 26,
    fontWeight: '600',
    color: '#333333',
    marginTop: 20,
  },
  companionStatus: {
    fontSize: 16,
    color: '#4CAF50',
    marginTop: 6,
  },
  infoContainer: {
    marginTop: 40,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
  startCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B8A',
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 32,
    marginTop: 40,
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  startCallIcon: {
    marginRight: 8,
  },
  startCallText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  callContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  remoteVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  controlsGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 200,
  },
  durationContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 100,
    right: 20,
    width: 100,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  activeCallControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 12,
  },
  recordingsContainer: {
    marginTop: 30,
    width: '100%',
    paddingHorizontal: 20,
  },
  recordingItem: {
    marginBottom: 20,
  },
  recordingVideo: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#000',
  },
  recordingLabel: {
    color: '#333',
    marginTop: 4,
    textAlign: 'center',
  },
  filterLabelContainer: {
    position: 'absolute',
    bottom: 110,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  filterLabel: {
    color: '#FFFFFF',
    fontSize: 12,
  },
});
