
import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export const useDevice = () => {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const { width, height } = Dimensions.get('window');
      const aspectRatio = height / width;
      
      const isTabletDevice = width >= 600 && aspectRatio <= 1.6;
      
      setIsTablet(isTabletDevice);
    };

    
    detectDevice();

    
    const subscription = Dimensions.addEventListener('change', detectDevice);

    return () => {
      
      subscription?.remove();
    };
  }, []);

  return { isTablet };
};