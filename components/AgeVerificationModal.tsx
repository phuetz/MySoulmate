import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Calendar, Check, CircleAlert as AlertCircle } from 'lucide-react-native';

interface AgeVerificationModalProps {
  onVerify: (verified: boolean) => void;
}

export default function AgeVerificationModal({ onVerify }: AgeVerificationModalProps) {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [error, setError] = useState('');

  const handleVerify = () => {
    if (!day || !month || !year) {
      setError('Please enter your complete date of birth');
      return;
    }

    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    
    // Calculate age
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    if (isNaN(birthDate.getTime())) {
      setError('Please enter a valid date');
      return;
    }

    if (age < 18) {
      setError('You must be at least 18 years old to use this app');
      return;
    }

    onVerify(true);
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Calendar size={24} color="#FF6B8A" />
            <Text style={styles.modalTitle}>Age Verification</Text>
          </View>
          
          <Text style={styles.modalDescription}>
            You must be at least 18 years old to use MySoulmate. Please enter your date of birth to verify your age.
          </Text>
          
          <View style={styles.inputContainer}>
            <View style={styles.dateInputs}>
              <View style={styles.dateInputColumn}>
                <Text style={styles.dateLabel}>Day</Text>
                <TextInput
                  style={styles.dateInput}
                  value={day}
                  onChangeText={setDay}
                  placeholder="DD"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.dateInputColumn}>
                <Text style={styles.dateLabel}>Month</Text>
                <TextInput
                  style={styles.dateInput}
                  value={month}
                  onChangeText={setMonth}
                  placeholder="MM"
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              
              <View style={styles.dateInputColumn}>
                <Text style={styles.dateLabel}>Year</Text>
                <TextInput
                  style={styles.dateInput}
                  value={year}
                  onChangeText={setYear}
                  placeholder="YYYY"
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
            
            {error ? (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}
          </View>
          
          <View style={styles.privacyNote}>
            <Text style={styles.privacyText}>
              Your date of birth will not be stored or shared with others.
            </Text>
          </View>
          
          <TouchableOpacity style={styles.verifyButton} onPress={handleVerify}>
            <Check size={20} color="#FFFFFF" />
            <Text style={styles.verifyButtonText}>Verify Age</Text>
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
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 12,
  },
  modalDescription: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 22,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  dateInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInputColumn: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  dateInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 8,
  },
  privacyNote: {
    marginBottom: 24,
  },
  privacyText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
  },
  verifyButton: {
    backgroundColor: '#FF6B8A',
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});