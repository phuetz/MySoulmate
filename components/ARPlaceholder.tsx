import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { CompanionData } from '@/context/AppStateContext';
import { Sparkles, Camera, CircleAlert as AlertCircle } from 'lucide-react-native';

interface ARPlaceholderProps {
  companion: CompanionData;
}

export default function ARPlaceholder({ companion }: ARPlaceholderProps) {
  const [backgroundIndex, setBackgroundIndex] = useState(0);
  
  // Sample backgrounds for placeholder
  const backgrounds = [
    'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
    'https://images.pexels.com/photos/2724749/pexels-photo-2724749.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1'
  ];

  const changeBackground = () => {
    setBackgroundIndex((backgroundIndex + 1) % backgrounds.length);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AR Visualization</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.previewContainer}>
          <Image 
            source={{ uri: backgrounds[backgroundIndex] }} 
            style={styles.backgroundImage}
            resizeMode="cover"
          />
          
          <Image 
            source={{ uri: companion.avatarUrl }} 
            style={styles.companionImage}
            resizeMode="contain"
          />
          
          <TouchableOpacity 
            style={styles.changeBackgroundButton}
            onPress={changeBackground}
          >
            <Text style={styles.changeBackgroundText}>Change Background</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoContainer}>
          <View style={styles.infoHeader}>
            <Sparkles size={24} color="#FF6B8A" />
            <Text style={styles.infoTitle}>AR Preview Mode</Text>
          </View>
          
          <Text style={styles.infoDescription}>
            This is a preview of how your companion would look in AR. For the full AR experience with 
            real-time camera integration, please use a compatible mobile device with AR support.
          </Text>
          
          <View style={styles.featureList}>
            <Text style={styles.featureListTitle}>Full AR Features:</Text>
            
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Place your companion in your real environment
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Resize and rotate your companion in 3D space
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Take photos with your companion in AR
              </Text>
            </View>
            
            <View style={styles.featureItem}>
              <View style={styles.featureBullet} />
              <Text style={styles.featureText}>
                Interact with your companion in your environment
              </Text>
            </View>
          </View>
          
          <View style={styles.compatibilityNote}>
            <AlertCircle size={20} color="#9C6ADE" />
            <Text style={styles.compatibilityText}>
              AR features work best on iOS devices with ARKit support or Android devices with ARCore support.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const { width: screenWidth } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
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
  contentContainer: {
    flex: 1,
  },
  previewContainer: {
    position: 'relative',
    width: '100%',
    height: 300,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  companionImage: {
    position: 'absolute',
    width: 150,
    height: 250,
    bottom: 0,
    right: screenWidth / 2 - 75,
  },
  changeBackgroundButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  changeBackgroundText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  infoContainer: {
    flex: 1,
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
    marginLeft: 12,
  },
  infoDescription: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 24,
    marginBottom: 20,
  },
  featureList: {
    marginBottom: 20,
  },
  featureListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B8A',
    marginTop: 6,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
    lineHeight: 20,
  },
  compatibilityNote: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F7',
    padding: 16,
    borderRadius: 12,
    alignItems: 'flex-start',
  },
  compatibilityText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});