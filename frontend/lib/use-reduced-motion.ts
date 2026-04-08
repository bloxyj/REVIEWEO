import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

type ReducedMotionListener = (enabled: boolean) => void;

const listeners = new Set<ReducedMotionListener>();
let reducedMotionValue = false;
let initialized = false;

function notifyListeners(enabled: boolean) {
  reducedMotionValue = enabled;
  listeners.forEach((listener) => listener(enabled));
}

function initializeReducedMotionSubscription() {
  if (initialized) {
    return;
  }

  initialized = true;

  AccessibilityInfo.isReduceMotionEnabled()
    .then((enabled) => {
      notifyListeners(enabled);
    })
    .catch(() => undefined);

  AccessibilityInfo.addEventListener('reduceMotionChanged', notifyListeners);
}

function subscribe(listener: ReducedMotionListener) {
  initializeReducedMotionSubscription();
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

export function useReducedMotionPreference(): boolean {
  const [reducedMotion, setReducedMotion] = useState(reducedMotionValue);

  useEffect(() => subscribe(setReducedMotion), []);

  return reducedMotion;
}
