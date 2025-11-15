import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Play, Pause } from 'lucide-react-native';

/**
 * Lecteur de messages vocaux avec visualisation de forme d'onde
 * Inspiré de WhatsApp et Telegram
 */

interface VoiceMessagePlayerProps {
  audioUri: string;
  duration?: number;
  isUser: boolean;
}

export default function VoiceMessagePlayer({ audioUri, duration = 0, isUser }: VoiceMessagePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(duration * 1000);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  // Génération de hauteurs de barres aléatoires pour simuler une forme d'onde
  const [waveformHeights] = useState(() =>
    Array.from({ length: 30 }, () => Math.random() * 0.7 + 0.3)
  );

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  const playPauseAudio = async () => {
    try {
      if (sound) {
        if (isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      } else {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true },
          onPlaybackStatusUpdate
        );
        setSound(newSound);
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Failed to play audio:', error);
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded) {
      setPlaybackPosition(status.positionMillis);
      setPlaybackDuration(status.durationMillis || duration * 1000);

      if (status.didJustFinish) {
        setIsPlaying(false);
        setPlaybackPosition(0);
      }
    }
  };

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progress = playbackDuration > 0 ? playbackPosition / playbackDuration : 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.playButton, isUser ? styles.playButtonUser : styles.playButtonCompanion]}
        onPress={playPauseAudio}
        activeOpacity={0.7}
      >
        {isPlaying ? (
          <Pause size={20} color={isUser ? '#FFFFFF' : '#9C6ADE'} fill={isUser ? '#FFFFFF' : '#9C6ADE'} />
        ) : (
          <Play size={20} color={isUser ? '#FFFFFF' : '#9C6ADE'} fill={isUser ? '#FFFFFF' : '#9C6ADE'} />
        )}
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        <View style={styles.waveform}>
          {waveformHeights.map((height, index) => {
            const isPassed = index / waveformHeights.length < progress;
            return (
              <View
                key={index}
                style={[
                  styles.waveformBar,
                  {
                    height: height * 28,
                    backgroundColor: isPassed
                      ? isUser
                        ? 'rgba(255, 255, 255, 0.9)'
                        : '#9C6ADE'
                      : isUser
                      ? 'rgba(255, 255, 255, 0.4)'
                      : 'rgba(156, 106, 222, 0.3)',
                  },
                ]}
              />
            );
          })}
        </View>
        <Text style={[styles.duration, isUser ? styles.durationUser : styles.durationCompanion]}>
          {formatTime(isPlaying ? playbackPosition : playbackDuration)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    minWidth: 200,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  playButtonUser: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  playButtonCompanion: {
    backgroundColor: 'rgba(156, 106, 222, 0.15)',
  },
  waveformContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 32,
    marginBottom: 4,
  },
  waveformBar: {
    width: 3,
    borderRadius: 1.5,
    marginHorizontal: 1,
  },
  duration: {
    fontSize: 11,
    fontWeight: '500',
  },
  durationUser: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  durationCompanion: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
});
