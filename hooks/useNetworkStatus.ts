import { useState, useEffect } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const updateState = (state: NetInfoState) => {
      setIsConnected(state.isConnected && Boolean(state.isInternetReachable));
    };
    const unsubscribe = NetInfo.addEventListener(updateState);

    NetInfo.fetch().then(updateState).catch(() => setIsConnected(false));

    return () => unsubscribe();
  }, []);

  return { isConnected };
}
