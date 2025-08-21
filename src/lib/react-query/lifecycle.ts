import {AppState} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import {focusManager, onlineManager} from '@tanstack/react-query';

export const bindAppLifecycleToReactQuery = () => {
  // Focus (AppState)
  AppState.addEventListener('change', (status) => {
    focusManager.setFocused(status === 'active');
  });

  // Online (NetInfo)
  onlineManager.setEventListener((setOnline) => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected));
    });
    return unsubscribe;
  });
};