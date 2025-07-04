import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Switch, ScrollView, Alert, TextInput } from 'react-native';
import { Save, Mail, Bell, CreditCard, Globe, Lock, Database, Sliders } from 'lucide-react-native';

export default function AdminSettingsScreen() {
  // Email notification settings
  const [emailSettings, setEmailSettings] = useState({
    newUsers: true,
    newOrders: true,
    subscriptionRenewals: true,
    subscriptionCancellations: true,
    paymentFailures: true
  });

  // System settings
  const [systemSettings, setSystemSettings] = useState({
    enableUserRegistration: true,
    enablePublicProducts: true,
    maintenanceMode: false,
    debugMode: false
  });

  // Payment settings
  const [paymentSettings, setPaymentSettings] = useState({
    enabledPaymentGateways: {
      stripe: true,
      paypal: false
    },
    autoRenewDefault: true,
    sendPaymentReminders: true
  });

  const [apiSettings, setApiSettings] = useState({
    apiKey: 'sk_test_••••••••••••••••••••••',
    webhookSecret: 'whsec_••••••••••••••••••••••',
    endpointUrl: 'https://api.example.com/webhook'
  });

  const [isApiKeyVisible, setIsApiKeyVisible] = useState(false);
  const [isWebhookSecretVisible, setIsWebhookSecretVisible] = useState(false);

  // Handle email setting changes
  const handleEmailSettingChange = (setting: string, value: boolean) => {
    setEmailSettings({
      ...emailSettings,
      [setting]: value
    });
  };

  // Handle system setting changes
  const handleSystemSettingChange = (setting: string, value: boolean) => {
    if (setting === 'maintenanceMode' && value) {
      Alert.alert(
        'Enable Maintenance Mode',
        'This will make the site inaccessible to regular users. Only administrators will be able to access the site. Continue?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Continue', 
            onPress: () => {
              setSystemSettings({
                ...systemSettings,
                [setting]: value
              });
            }
          }
        ]
      );
    } else {
      setSystemSettings({
        ...systemSettings,
        [setting]: value
      });
    }
  };

  // Handle payment setting changes
  const handlePaymentGatewayChange = (gateway: string, value: boolean) => {
    setPaymentSettings({
      ...paymentSettings,
      enabledPaymentGateways: {
        ...paymentSettings.enabledPaymentGateways,
        [gateway]: value
      }
    });
  };

  // Handle payment setting changes
  const handlePaymentSettingChange = (setting: string, value: boolean) => {
    setPaymentSettings({
      ...paymentSettings,
      [setting]: value
    });
  };

  // Handle API setting changes
  const handleApiSettingChange = (setting: string, value: string) => {
    setApiSettings({
      ...apiSettings,
      [setting]: value
    });
  };

  const handleSaveSettings = () => {
    // In a real application, this would save settings to the backend
    Alert.alert('Success', 'Settings saved successfully');
  };

  const toggleApiKeyVisibility = () => {
    setIsApiKeyVisible(!isApiKeyVisible);
  };

  const toggleWebhookSecretVisibility = () => {
    setIsWebhookSecretVisible(!isWebhookSecretVisible);
  };

  const regenerateApiKey = () => {
    Alert.alert(
      'Regenerate API Key',
      'Are you sure you want to regenerate the API key? This will invalidate the current key and may break existing integrations.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Regenerate', 
          style: 'destructive',
          onPress: () => {
            // In a real app, this would call an API to regenerate the key
            setApiSettings({
              ...apiSettings,
              apiKey: 'sk_test_' + Math.random().toString(36).substring(2, 15)
            });
            Alert.alert('Success', 'API key regenerated successfully');
          }
        }
      ]
    );
  };

  const testWebhook = () => {
    // In a real app, this would send a test event to the webhook URL
    Alert.alert(
      'Send Test Webhook',
      'This will send a test event to your webhook endpoint. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Test',
          onPress: () => {
            Alert.alert('Success', 'Test webhook sent successfully');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Settings</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSaveSettings}
        >
          <Save size={18} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.contentContainer}>
        {/* Email Notification Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Mail size={20} color="#FF6B8A" />
            <Text style={styles.sectionTitle}>Email Notifications</Text>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>New User Registrations</Text>
            <Switch
              value={emailSettings.newUsers}
              onValueChange={(value) => handleEmailSettingChange('newUsers', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>New Orders</Text>
            <Switch
              value={emailSettings.newOrders}
              onValueChange={(value) => handleEmailSettingChange('newOrders', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Subscription Renewals</Text>
            <Switch
              value={emailSettings.subscriptionRenewals}
              onValueChange={(value) => handleEmailSettingChange('subscriptionRenewals', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Subscription Cancellations</Text>
            <Switch
              value={emailSettings.subscriptionCancellations}
              onValueChange={(value) => handleEmailSettingChange('subscriptionCancellations', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Payment Failures</Text>
            <Switch
              value={emailSettings.paymentFailures}
              onValueChange={(value) => handleEmailSettingChange('paymentFailures', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* System Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sliders size={20} color="#9C6ADE" />
            <Text style={styles.sectionTitle}>System Settings</Text>
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Enable User Registration</Text>
              <Text style={styles.settingDescription}>Allow new users to register</Text>
            </View>
            <Switch
              value={systemSettings.enableUserRegistration}
              onValueChange={(value) => handleSystemSettingChange('enableUserRegistration', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Public Product Listings</Text>
              <Text style={styles.settingDescription}>Allow non-logged-in users to view products</Text>
            </View>
            <Switch
              value={systemSettings.enablePublicProducts}
              onValueChange={(value) => handleSystemSettingChange('enablePublicProducts', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Maintenance Mode</Text>
              <Text style={styles.settingDescription}>Temporarily disable public access to the site</Text>
            </View>
            <Switch
              value={systemSettings.maintenanceMode}
              onValueChange={(value) => handleSystemSettingChange('maintenanceMode', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Debug Mode</Text>
              <Text style={styles.settingDescription}>Enable detailed error reporting and logging</Text>
            </View>
            <Switch
              value={systemSettings.debugMode}
              onValueChange={(value) => handleSystemSettingChange('debugMode', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* Payment Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CreditCard size={20} color="#2196F3" />
            <Text style={styles.sectionTitle}>Payment Settings</Text>
          </View>
          
          <Text style={styles.subsectionTitle}>Payment Gateways</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Stripe</Text>
            <Switch
              value={paymentSettings.enabledPaymentGateways.stripe}
              onValueChange={(value) => handlePaymentGatewayChange('stripe', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>PayPal</Text>
            <Switch
              value={paymentSettings.enabledPaymentGateways.paypal}
              onValueChange={(value) => handlePaymentGatewayChange('paypal', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <Text style={styles.subsectionTitle}>Subscription Options</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Auto-Renew by Default</Text>
              <Text style={styles.settingDescription}>Enable auto-renewal by default for new subscriptions</Text>
            </View>
            <Switch
              value={paymentSettings.autoRenewDefault}
              onValueChange={(value) => handlePaymentSettingChange('autoRenewDefault', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLabelContainer}>
              <Text style={styles.settingLabel}>Payment Reminders</Text>
              <Text style={styles.settingDescription}>Send reminders before subscription renewals</Text>
            </View>
            <Switch
              value={paymentSettings.sendPaymentReminders}
              onValueChange={(value) => handlePaymentSettingChange('sendPaymentReminders', value)}
              trackColor={{ false: '#E1E1E1', true: '#FF6B8A' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* API Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Globe size={20} color="#4CAF50" />
            <Text style={styles.sectionTitle}>API Configuration</Text>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>API Key</Text>
            <View style={styles.secretInputContainer}>
              <TextInput
                style={styles.secretInput}
                value={isApiKeyVisible ? apiSettings.apiKey : 'sk_test_••••••••••••••••••••••'}
                editable={false}
              />
              <TouchableOpacity 
                style={styles.visibilityButton}
                onPress={toggleApiKeyVisibility}
              >
                <Text style={styles.visibilityButtonText}>
                  {isApiKeyVisible ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.regenerateButton}
                onPress={regenerateApiKey}
              >
                <Text style={styles.regenerateButtonText}>Regenerate</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Webhook Secret</Text>
            <View style={styles.secretInputContainer}>
              <TextInput
                style={styles.secretInput}
                value={isWebhookSecretVisible ? apiSettings.webhookSecret : 'whsec_••••••••••••••••••••••'}
                editable={false}
              />
              <TouchableOpacity 
                style={styles.visibilityButton}
                onPress={toggleWebhookSecretVisibility}
              >
                <Text style={styles.visibilityButtonText}>
                  {isWebhookSecretVisible ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.formGroup}>
            <Text style={styles.label}>Webhook URL</Text>
            <TextInput
              style={styles.input}
              value={apiSettings.endpointUrl}
              onChangeText={(value) => handleApiSettingChange('endpointUrl', value)}
              placeholder="https://your-api.com/webhook"
            />
            <TouchableOpacity 
              style={styles.testButton}
              onPress={testWebhook}
            >
              <Text style={styles.testButtonText}>Test Webhook</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Security Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Lock size={20} color="#FF3B30" />
            <Text style={styles.sectionTitle}>Security</Text>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity style={styles.securityButton}>
              <Text style={styles.securityButtonText}>Reset Admin Password</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity style={styles.securityButton}>
              <Text style={styles.securityButtonText}>View Audit Logs</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity 
              style={[styles.securityButton, styles.dangerButton]}
              onPress={() => {
                Alert.alert(
                  'Revoke All Sessions',
                  'This will log out all users. Are you sure?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Revoke All', style: 'destructive' }
                  ]
                );
              }}
            >
              <Text style={styles.dangerButtonText}>Revoke All Sessions</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Database Settings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Database size={20} color="#9C6ADE" />
            <Text style={styles.sectionTitle}>Database</Text>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity 
              style={styles.databaseButton}
              onPress={() => {
                Alert.alert(
                  'Backup Database',
                  'This will create a backup of the current database. Continue?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Backup Now' }
                  ]
                );
              }}
            >
              <Text style={styles.databaseButtonText}>Backup Database</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity style={styles.databaseButton}>
              <Text style={styles.databaseButtonText}>View Backup History</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity style={styles.databaseButton}>
              <Text style={styles.databaseButtonText}>Restore from Backup</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.formGroup}>
            <TouchableOpacity 
              style={[styles.databaseButton, styles.dangerButton]}
              onPress={() => {
                Alert.alert(
                  'Clear All Data',
                  'WARNING: This will permanently delete all data in the database. This action cannot be undone!',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Clear All Data', 
                      style: 'destructive',
                      onPress: () => {
                        // Second confirmation
                        Alert.alert(
                          'Final Warning',
                          'Are you absolutely sure you want to delete all data? This cannot be undone.',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Yes, Delete Everything', style: 'destructive' }
                          ]
                        );
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.dangerButtonText}>Clear All Data</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 10,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginTop: 8,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  settingDescription: {
    fontSize: 12,
    color: '#666666',
    marginTop: 2,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  secretInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  secretInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#E1E1E1',
  },
  visibilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
  },
  visibilityButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333333',
  },
  regenerateButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    backgroundColor: '#FFF0F3',
    borderRadius: 6,
  },
  regenerateButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FF6B8A',
  },
  testButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  securityButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  securityButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  databaseButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  databaseButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333333',
  },
  dangerButton: {
    backgroundColor: '#FFF0F0',
  },
  dangerButtonText: {
    color: '#FF3B30',
    fontWeight: '500',
  },
});