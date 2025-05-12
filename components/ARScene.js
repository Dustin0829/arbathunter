import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import { Asset } from 'expo-asset';

// Get screen dimensions
const { width, height } = Dimensions.get('window');

/**
 * ARScene Component - Simulates AR by rendering animated bat images
 * @param {Object} props
 * @param {Boolean} props.active - Whether the AR scene is active
 * @param {Function} props.onBatHit - Callback when a bat is hit
 * @param {String} props.difficulty - Game difficulty level
 */
const ARScene = forwardRef(({ active = true, onBatHit, difficulty = 'MEDIUM' }, ref) => {
  // State for tracking bats
  const [bats, setBats] = useState([]);
  const spawnIntervalRef = useRef(null);
  
  // Get difficulty settings
  const getDifficultySettings = () => {
    switch(difficulty) {
      case 'EASY':
        return {
          spawnInterval: 6000, // 6 seconds
          maxBats: 6,
          scale: 1.2, // Larger bats
          zIndexRange: [5, 10] // Closer to camera
        };
      case 'HARD':
        return {
          spawnInterval: 3000, // 3 seconds
          maxBats: 10,
          scale: 0.8, // Smaller bats
          zIndexRange: [1, 15] // More depth variation
        };
      case 'MEDIUM':
      default:
        return {
          spawnInterval: 4500, // 4.5 seconds
          maxBats: 8,
          scale: 1.0,
          zIndexRange: [3, 12]
        };
    }
  };
  
  // Generate a random position for a bat
  const generateRandomPosition = () => {
    const settings = getDifficultySettings();
    const margin = 100;
    
    // Random position with depth simulation
    return {
      x: margin + Math.random() * (width - 2 * margin),
      y: margin + Math.random() * (height - 2 * margin),
      z: settings.zIndexRange[0] + Math.random() * 
         (settings.zIndexRange[1] - settings.zIndexRange[0])
    };
  };

  // Spawn a new bat
  const spawnBat = () => {
    if (!active) return;
    
    const settings = getDifficultySettings();
    
    // Don't spawn if we've reached the max
    if (bats.length >= settings.maxBats) return;
    
    const position = generateRandomPosition();
    const scale = settings.scale * (0.8 + Math.random() * 0.4); // Add some size variation
    
    // Calculate size based on z position (depth)
    // Bats further away (higher z) appear smaller
    const sizeMultiplier = 1 - ((position.z - settings.zIndexRange[0]) / 
                              (settings.zIndexRange[1] - settings.zIndexRange[0]) * 0.5);
    
    const newBat = {
      id: Date.now().toString(),
      position,
      scale: scale * sizeMultiplier,
      rotation: Math.random() * 30 - 15, // Random initial rotation
      createdAt: Date.now(),
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(0)
    };
    
    // Add the bat to our state
    setBats(prevBats => [...prevBats, newBat]);
    
    // Animate the bat in
    Animated.parallel([
      Animated.timing(newBat.opacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(newBat.translateY, {
            toValue: 10,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true
          }),
          Animated.timing(newBat.translateY, {
            toValue: -10,
            duration: 1000 + Math.random() * 1000,
            useNativeDriver: true
          })
        ])
      )
    ]).start();
  };
  
  // Check if the crosshair hits a bat
  const checkBatHit = (crosshairPosition) => {
    if (bats.length === 0) return false;
    
    // Define hit area size (larger for easier hits)
    const hitRadius = 50;
    
    // Find a bat that's hit by the crosshair
    const hitBatIndex = bats.findIndex(bat => {
      const dx = bat.position.x - crosshairPosition.x;
      const dy = bat.position.y - crosshairPosition.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Adjust hit radius based on bat scale (smaller bats have smaller hit areas)
      const adjustedHitRadius = hitRadius * bat.scale;
      
      return distance < adjustedHitRadius;
    });
    
    if (hitBatIndex !== -1) {
      // Remove the hit bat
      const hitBat = bats[hitBatIndex];
      
      // Stop animations
      hitBat.opacity.stopAnimation();
      hitBat.translateY.stopAnimation();
      
      // Remove the bat from our state
      setBats(prevBats => prevBats.filter(bat => bat.id !== hitBat.id));
      
      // Call the callback
      if (onBatHit) onBatHit();
      
      return true;
    }
    
    return false;
  };

  // Spawn bats at regular intervals
  useEffect(() => {
    if (!active) return;
    
    const settings = getDifficultySettings();
    
    // Spawn bats at regular intervals
    spawnIntervalRef.current = setInterval(() => {
      if (bats.length < settings.maxBats) {
        spawnBat();
      }
    }, settings.spawnInterval);
    
    // Initial spawn
    if (bats.length === 0) {
      spawnBat();
    }
    
    return () => {
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [active, difficulty]);
  
  // Clean up when component unmounts
  useEffect(() => {
    return () => {
      // Stop all animations
      bats.forEach(bat => {
        bat.opacity.stopAnimation();
        bat.translateY.stopAnimation();
      });
      
      if (spawnIntervalRef.current) {
        clearInterval(spawnIntervalRef.current);
      }
    };
  }, [bats]);
  
  // Expose the checkBatHit function to the parent component
  useImperativeHandle(
    ref,
    () => ({
      checkBatHit
    }),
    [bats]
  );
  
  return (
    <View style={styles.container}>
      {bats.map(bat => (
        <Animated.View 
          key={bat.id}
          style={[
            styles.batContainer,
            {
              left: bat.position.x,
              top: bat.position.y,
              zIndex: Math.round(bat.position.z),
              opacity: bat.opacity,
              transform: [
                { scale: bat.scale },
                { translateY: bat.translateY },
                { rotate: `${bat.rotation}deg` }
              ]
            }
          ]}
        >
          <Image 
            source={require('../assets/images/pixel bats.gif')} 
            style={styles.batImage}
            resizeMode="contain"
          />
        </Animated.View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 1,
    pointerEvents: 'none',
  },
  batContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  batImage: {
    width: '100%',
    height: '100%',
  }
});

export default ARScene;
