import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useAnimatedEntry = (loading: boolean, delay: number = 0) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading, fadeAnim, scaleAnim, delay]);

  return { fadeAnim, scaleAnim };
};
