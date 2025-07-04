import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Modal } from 'react-native';
import { Star, Check, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';

interface PremiumFeatureModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  description: string;
}

export default function PremiumFeatureModal({ 
  visible, 
  onClose, 
  featureName, 
  description 
}: PremiumFeatureModalProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/settings');
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={20} color="#999999" />
          </TouchableOpacity>
          
          <View style={styles.modalHeader}>
            <Star size={30} color="#FFD700" />
            <Text style={styles.modalTitle}>Premium Feature</Text>
          </View>
          
          <Text style={styles.featureName}>{featureName}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
          
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Premium Benefits</Text>
            
            <View style={styles.benefitItem}>
              <Check size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Unlimited conversations</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Check size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Advanced personality customization</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Check size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Premium avatars and relationship types</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Check size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>NSFW content and roleplay</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Check size={18} color="#4CAF50" />
              <Text style={styles.benefitText}>Voice and video calls</Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.notNowButton} onPress={onClose}>
            <Text style={styles.notNowButtonText}>Not Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginTop: 8,
  },
  featureName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9C6ADE',
    textAlign: 'center',
    marginBottom: 8,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  benefitsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#333333',
    marginLeft: 10,
  },
  upgradeButton: {
    backgroundColor: '#9C6ADE',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  notNowButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  notNowButtonText: {
    color: '#666666',
    fontSize: 14,
  },
});