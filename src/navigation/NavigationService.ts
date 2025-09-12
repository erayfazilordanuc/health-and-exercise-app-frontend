// navigation/NavigationService.ts
import {createNavigationContainerRef} from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

let pendingNav: {name: string; params?: any} | null = null;

export function navSafe(name: string, params?: any) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  } else {
    pendingNav = {name, params}; // hazır olunca çalıştır
  }
}

export function flushPendingNav() {
  if (pendingNav && navigationRef.isReady()) {
    const {name, params} = pendingNav;
    (navigationRef.navigate as any)(name, params);
    pendingNav = null;
  }
}
