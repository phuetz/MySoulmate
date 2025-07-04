import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Image, Platform, Dimensions } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Sparkles, X, Camera as CameraIcon, RotateCcw, Share2, Download, Heart } from 'lucide-react-native';
import { useAppState } from '@/context/AppStateContext';
import PremiumFeatureModal from '@/components/PremiumFeatureModal';
import { useARAvailability } from '@/hooks/useARAvailability';
import ARPlaceholder from '@/components/ARPlaceholder';

export default function ARViewScreen() {
  const { companion, isPremium, updateInteractions } = useAppState();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<CameraType>(CameraType.Back);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const { isARSupported, isLoading } = useARAvailability();

  // AR scene controls
  const [avatarScale, setAvatarScale] = useState(1);
  const [avatarPosition, setAvatarPosition] = useState({ x: 0, y: 0 });
  const [avatarRotation, setAvatarRotation] = useState(0);

  // Track interaction time for analytics
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    // Record AR interaction every minute
    timer = setInterval(() => {
      updateInteractions(2); // AR interactions are meaningful
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  const handleToggleCamera = () => {
    setCameraType(current => current === CameraType.Back ? CameraType.Front : CameraType.Back);
  };

  const handleCapture = async () => {
    if (!isPremium) {
      setShowPremiumModal(true);
      return;
    }

    setIsCapturing(true);
    try {
      // This would be a real capture in a production app
      // For demo purposes, we'll simulate a captured image
      setTimeout(() => {
        setCapturedImage(companion.avatarUrl);
        setIsCapturing(false);
        
        // Increment interactions for capturing AR image
        updateInteractions(5);
      }, 1000);
    } catch (error) {
      console.error('Failed to take picture:', error);
      setIsCapturing(false);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  const handleSave = () => {
    if (capturedImage) {
      Alert.alert(
        'Save Image',
        'In a production app, this would save the AR image to your device gallery.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleShare = () => {
    if (capturedImage) {
      Alert.alert(
        'Share Image',
        'In a production app, this would open the share dialog to share your AR image.',
        [{ text: 'OK' }]
      );
    }
  };

  const discardCapture = () => {
    setCapturedImage(null);
  };

  // Location markers for positioning the avatar
  const placeMarkers = [
    { id: 1, label: 'Living Room', x: 100, y: 200 },
    { id: 2, label: 'Bedroom', x: 250, y: 150 },
    { id: 3, label: 'Kitchen', x: 180, y: 300 }
  ];

  // Request camera permission if not granted
  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera permission to enable the AR experience. This allows you to see your AI companion in your real environment.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Checking AR availability...</Text>
      </View>
    );
  }

  // Show placeholder for web or unsupported devices
  if (!isARSupported) {
    return <ARPlaceholder companion={companion} />;
  }

  // Show captured image view
  if (capturedImage) {
    return (
      <View style={styles.captureContainer}>
        <Image 
          source={{ uri: capturedImage }} 
          style={styles.capturedImage}
          resizeMode="contain"
        />
        
        <View style={styles.captureOverlay}>
          <TouchableOpacity style={styles.closeButton} onPress={discardCapture}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <View style={styles.captureActions}>
            <TouchableOpacity style={styles.captureActionButton} onPress={handleSave}>
              <Download size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureActionButton} onPress={handleShare}>
              <Share2 size={24} color="#FFFFFF" />
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        style={styles.camera}
        facing={cameraType}
      >
        {/* AR View Overlay */}
        <View style={styles.arOverlay}>
          {/* Simulated avatar in AR - in a real app, this would be rendered using AR frameworks */}
          <Image 
            source={{ uri: companion.avatarUrl }} 
            style={[
              styles.arAvatar,
              {
                transform: [
                  { scale: avatarScale },
                  { translateX: avatarPosition.x },
                  { translateY: avatarPosition.y },
                  { rotate: `${avatarRotation}deg` }
                ]
              }
            ]}
          />
          
          {/* Place markers to position avatar */}
          {placeMarkers.map(marker => (
            <TouchableOpacity 
              key={marker.id}
              style={[styles.placeMarker, { left: marker.x, top: marker.y }]}
              onPress={() => setAvatarPosition({ x: marker.x - 40, y: marker.y - 100 })}
            >
              <Sparkles size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ))}
        </View>
        
        {/* AR Controls */}
        <View style={styles.arControls}>
          <Text style={styles.arHint}>
            Tap on the sparkles to place your companion
          </Text>
          
          <View style={styles.scaleControls}>
            <TouchableOpacity 
              style={styles.scaleButton}
              onPress={() => setAvatarScale(Math.max(0.5, avatarScale - 0.1))}
            >
              <Text style={styles.scaleButtonText}>-</Text>
            </TouchableOpacity>
            
            <Text style={styles.scaleLabel}>Size</Text>
            
            <TouchableOpacity 
              style={styles.scaleButton}
              onPress={() => setAvatarScale(Math.min(2, avatarScale + 0.1))}
            >
              <Text style={styles.scaleButtonText}>+</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.rotateButton}
            onPress={() => setAvatarRotation((avatarRotation + 45) % 360)}
          >
            <RotateCcw size={20} color="#FFFFFF" />
            <Text style={styles.rotateButtonText}>Rotate</Text>
          </TouchableOpacity>
        </View>
        
        {/* Top controls */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.closeButton} onPress={() => {}}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          <Text style={styles.title}>AR View</Text>
          
          <TouchableOpacity style={styles.cameraToggleButton} onPress={handleToggleCamera}>
            <RotateCcw size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
        
        {/* Bottom controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.heartButton}>
            <Heart size={24} color="#FF6B8A" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.captureButton, isCapturing && styles.capturingButton]} 
            onPress={handleCapture}
            disabled={isCapturing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.infoButton}>
            <Text style={styles.infoButtonText}>?</Text>
          </TouchableOpacity>
        </View>
      </CameraView>
      
      <PremiumFeatureModal 
        visible={showPremiumModal} 
        onClose={() => setShowPremiumModal(false)}
        featureName="AR Photo Capture"
        description="Capture and save AR moments with your companion to share with friends or keep as memories."
      />
    </View>
  );
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  permissionButton: {
    backgroundColor: '#FF6B8A',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  arOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
  },
  arAvatar: {
    width: 120,
    height: 200,
    position: 'absolute',
    zIndex: 20,
    // Default position is center of screen
    left: screenWidth / 2 - 60,
    top: screenHeight / 2 - 100,
  },
  placeMarker: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 138, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  arControls: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 30,
  },
  arHint: {
    color: '#FFFFFF',
    fontSize: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
  },
  scaleControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  scaleButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scaleButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scaleLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    marginHorizontal: 12,
  },
  rotateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  rotateButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 8,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 30,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  cameraToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
    zIndex: 30,
  },
  heartButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  capturingButton: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
  },
  infoButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  captureContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  capturedImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  captureOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  captureActions: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 60,
  },
  captureActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});