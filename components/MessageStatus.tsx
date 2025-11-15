import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Check, CheckCheck, Clock } from 'lucide-react-native';

/**
 * Indicateur de statut de message
 * Inspiré de WhatsApp - Affiche l'état d'envoi/livraison/lecture
 */

export type MessageStatusType = 'sending' | 'sent' | 'delivered' | 'read';

interface MessageStatusProps {
  status: MessageStatusType;
  isUser: boolean;
}

export default function MessageStatus({ status, isUser }: MessageStatusProps) {
  // N'afficher le statut que pour les messages de l'utilisateur
  if (!isUser) return null;

  const getStatusIcon = () => {
    switch (status) {
      case 'sending':
        return <Clock size={14} color="rgba(255, 255, 255, 0.7)" />;
      case 'sent':
        return <Check size={14} color="rgba(255, 255, 255, 0.7)" />;
      case 'delivered':
        return <CheckCheck size={14} color="rgba(255, 255, 255, 0.7)" />;
      case 'read':
        return <CheckCheck size={14} color="#4CAF50" />;
      default:
        return null;
    }
  };

  return <View style={styles.container}>{getStatusIcon()}</View>;
}

const styles = StyleSheet.create({
  container: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
