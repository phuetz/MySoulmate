import React, { useState, useEffect } from 'react';
import { Image, View, ActivityIndicator, StyleSheet, ImageStyle } from 'react-native';
import * as FileSystem from 'expo-file-system';

interface CachedImageProps {
  uri: string;
  style?: ImageStyle;
  placeholder?: React.ReactNode;
}

export default function CachedImage({ uri, style, placeholder }: CachedImageProps) {
  const [source, setSource] = useState<{ uri: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const cacheDir = FileSystem.cacheDirectory + 'images/';
        await FileSystem.makeDirectoryAsync(cacheDir, { intermediates: true });
        const name = encodeURIComponent(uri);
        const path = cacheDir + name;
        const info = await FileSystem.getInfoAsync(path);
        if (!info.exists) {
          await FileSystem.downloadAsync(uri, path);
        }
        if (isMounted) {
          setSource({ uri: path });
        }
      } catch (err) {
        console.warn('Image cache failed, using remote uri', err);
        if (isMounted) {
          setSource({ uri });
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [uri]);

  if (loading) {
    return (
      <View style={[styles.placeholder, style]}> 
        {placeholder || <ActivityIndicator />}
      </View>
    );
  }

  return <Image source={source!} style={style} />;
}

const styles = StyleSheet.create({
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E1E1E1'
  }
});
