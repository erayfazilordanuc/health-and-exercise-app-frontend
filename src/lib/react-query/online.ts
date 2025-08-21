import NetInfo from '@react-native-community/netinfo';
import {onlineManager} from '@tanstack/react-query';

// Uygulama bootstrap’inde 1 kez çağır (App.tsx)
export function setupReactQueryOnlineManager() {
  onlineManager.setEventListener(setOnline => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setOnline(!!state.isConnected);
    });
    return () => unsubscribe();
  });
}
