import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, StyleSheet, Dimensions, Animated, Platform } from 'react-native';
import AnimatedGif from './AnimatedGif';
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
  const timeoutRefs = useRef([]);
  
  // Get difficulty settings
  const getDifficultySettings = () => {
    switch(difficulty) {
      case 'EASY':
        return {
          spawnIntervalMin: 7000, // 7 seconds minimum
          spawnIntervalMax: 10000, // 10 seconds maximum
          maxBats: 6,
          scale: 1.2, // Larger bats
          zIndexRange: [5, 10], // Closer to camera
          batTypeWeights: { small: 0.7, large: 0.25, ghost: 0.05 } // More small bats in easy mode
        };
      case 'HARD':
        return {
          spawnIntervalMin: 3000, // 3 seconds minimum
          spawnIntervalMax: 6000, // 6 seconds maximum
          maxBats: 8,
          scale: 0.9, // Smaller bats
          zIndexRange: [1, 15], // More depth variation
          batTypeWeights: { small: 0.4, large: 0.3, ghost: 0.3 } // More ghost bats in hard mode
        };
      case 'MEDIUM':
      default:
        return {
          spawnIntervalMin: 5000, // 5 seconds minimum
          spawnIntervalMax: 8000, // 8 seconds maximum
          maxBats: 7,
          scale: 1.0,
          zIndexRange: [3, 12],
          batTypeWeights: { small: 0.6, large: 0.3, ghost: 0.1 }
        };
    }
  };
  
  // Generate a random position for a bat
  const generateRandomPosition = () => {
    const settings = getDifficultySettings();
    
    return {
      x: Math.random() * width,
      y: Math.random() * (height - 200) + 100, // Keep bats in the middle area of the screen
      z: Math.random() * (settings.zIndexRange[1] - settings.zIndexRange[0]) + settings.zIndexRange[0]
    };
  };
  
  // Generate a random bat type based on difficulty
  const generateBatType = () => {
    const settings = getDifficultySettings();
    const types = ['small', 'large', 'ghost'];
    const weights = [
      settings.batTypeWeights.small,
      settings.batTypeWeights.large,
      settings.batTypeWeights.ghost
    ];
    
    const random = Math.random();
    let sum = 0;
    
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i];
      if (random < sum) {
        return types[i];
      }
    }
    
    return types[0]; // Default to small
  };

  // Spawn a new bat
  const spawnBat = () => {
    const settings = getDifficultySettings();
    
    // Don't spawn more bats than the max limit
    if (bats.length >= settings.maxBats) return;
    
    // Generate a random position
    const position = generateRandomPosition();
    
    // Calculate scale based on z-position (closer = larger)
    const zFactor = 1 - (position.z / settings.zIndexRange[1]);
    const sizeMultiplier = 0.5 + zFactor * 0.5; // Scale between 0.5 and 1.0
    
    // Generate random bat type
    const batType = generateBatType();
    
    // Adjust scale and properties based on bat type
    let typeScale = 1.0;
    let points = 10; // Default points value
    let speed = 1.0; // Default animation speed multiplier
    let opacity = 1.0; // Full opacity for all bats
    
    switch(batType) {
      case 'small':
        typeScale = 0.7;
        points = 15; // Smaller bats are worth more points
        speed = 1.3; // Faster movement
        break;
      case 'large':
        typeScale = 1.3;
        points = 10;
        speed = 0.8; // Slower movement
        opacity = 1.0; // Full opacity
        break;
      case 'ghost':
        typeScale = 1.0;
        points = 25; // Ghost bats are worth more points
        speed = 1.5; // Fastest movement
        opacity = 1.0; // Full opacity for better visibility
        break;
    }
    
    // Create a new bat object
    const newBat = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      position,
      scale: settings.scale * sizeMultiplier * typeScale,
      rotation: Math.random() * 30 - 15, // Random initial rotation
      createdAt: Date.now(),
      opacity: new Animated.Value(0), // Start invisible and fade in
      translateY: new Animated.Value(0),
      translateX: new Animated.Value(0),
      batType,
      points,
      speed,
      // Add lifespan to automatically remove bats after some time
      lifespan: 15000 + Math.random() * 10000 // 15-25 seconds lifespan
    };
    
    // Add the bat to our state
    setBats(prevBats => [...prevBats, newBat]);
    
    // Calculate animation durations based on speed
    const baseDuration = 1000 / speed;
    const horizontalDuration = 2000 / speed;
    
    // Calculate animation amplitudes based on bat type
    const verticalAmplitude = batType === 'small' ? 15 : (batType === 'large' ? 8 : 20);
    const horizontalAmplitude = batType === 'small' ? 25 : (batType === 'large' ? 15 : 35);
    
    // Animate the bat in
    Animated.parallel([
      // Fade in animation
      Animated.timing(newBat.opacity, {
        toValue: opacity,
        duration: 500,
        useNativeDriver: true
      }),
      // Vertical movement animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(newBat.translateY, {
            toValue: verticalAmplitude + (Math.random() * 5),
            duration: baseDuration + Math.random() * 500,
            useNativeDriver: true
          }),
          Animated.timing(newBat.translateY, {
            toValue: -verticalAmplitude - (Math.random() * 5),
            duration: baseDuration + Math.random() * 500,
            useNativeDriver: true
          })
        ])
      ),
      // Horizontal movement animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(newBat.translateX, {
            toValue: horizontalAmplitude + (Math.random() * 10),
            duration: horizontalDuration + Math.random() * 1000,
            useNativeDriver: true
          }),
          Animated.timing(newBat.translateX, {
            toValue: -horizontalAmplitude - (Math.random() * 10),
            duration: horizontalDuration + Math.random() * 1000,
            useNativeDriver: true
          })
        ])
      )
    ]).start();
    
    // Set a timeout to remove the bat after its lifespan
    const timeoutId = setTimeout(() => {
      // Only remove if the component is still mounted
      if (active) {
        setBats(prevBats => prevBats.filter(bat => bat.id !== newBat.id));
      }
    }, newBat.lifespan);
    
    // Store the timeout reference for cleanup
    timeoutRefs.current.push(timeoutId);
  };

  // Check if the crosshair hits a bat
  const checkBatHit = (crosshairPosition) => {
    // Find the first bat that intersects with the crosshair
    const hitBatIndex = bats.findIndex(bat => {
      // Calculate the distance between the crosshair and the bat center
      const dx = crosshairPosition.x - (bat.position.x + bat.translateX.__getValue());
      const dy = crosshairPosition.y - (bat.position.y + bat.translateY.__getValue());
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Calculate the hit radius based on the bat's scale and type
      let hitRadiusMultiplier = 1.0;
      
      // Adjust hit radius based on bat type
      if (bat.batType === 'small') {
        hitRadiusMultiplier = 0.8; // Smaller hit area for small bats
      } else if (bat.batType === 'ghost') {
        hitRadiusMultiplier = 0.7; // Even smaller hit area for ghost bats
      }
      
      const hitRadius = 40 * bat.scale * hitRadiusMultiplier;
      
      // Check if the distance is less than the hit radius
      return distance < hitRadius;
    });
    
    // If a bat was hit
    if (hitBatIndex !== -1) {
      // Get the hit bat
      const hitBat = bats[hitBatIndex];
      
      // Stop animations
      hitBat.opacity.stopAnimation();
      hitBat.translateY.stopAnimation();
      hitBat.translateX.stopAnimation();
      
      // Remove the bat from our state
      setBats(prevBats => prevBats.filter(bat => bat.id !== hitBat.id));
      
      // Call the onBatHit callback with the bat's points value
      if (onBatHit) {
        onBatHit(hitBat.points || 10);
      }
      
      return true;
    }
    
    return false;
  };

  // Spawn bats at random intervals based on difficulty
  useEffect(() => {
    if (!active) return;
    
    const settings = getDifficultySettings();
    let nextSpawnTimeout = null;
    
    // Function to schedule the next bat spawn
    const scheduleNextSpawn = () => {
      // Calculate random spawn interval within the min-max range
      const spawnInterval = Math.floor(
        settings.spawnIntervalMin + 
        Math.random() * (settings.spawnIntervalMax - settings.spawnIntervalMin)
      );
      
      // Schedule the next spawn
      nextSpawnTimeout = setTimeout(() => {
        // Only spawn if we're below the max bats limit
        if (bats.length < settings.maxBats) {
          spawnBat();
        }
        // Schedule the next spawn
        scheduleNextSpawn();
      }, spawnInterval);
    };
    
    // Spawn initial bats with a slight delay between each
    const initialBatCount = Math.min(3, settings.maxBats);
    for (let i = 0; i < initialBatCount; i++) {
      setTimeout(() => {
        spawnBat();
      }, i * 800); // 800ms between each initial bat
    }
    
    // Start the spawn cycle
    scheduleNextSpawn();
    
    // Cleanup function
    return () => {
      // Clear the spawn timeout
      if (nextSpawnTimeout) {
        clearTimeout(nextSpawnTimeout);
      }
      
      // Clear all bat removal timeouts
      timeoutRefs.current.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
      timeoutRefs.current = [];
      
      // Stop all animations
      bats.forEach(bat => {
        bat.opacity.stopAnimation();
        bat.translateY.stopAnimation();
        bat.translateX.stopAnimation();
      });
    };
  }, [active, difficulty, bats.length]);
  
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
      {/* Bats rendering removed - will be added later */}
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
    tintColor: '#FFFFFF', // Make the bat fully visible
  }
});

export default ARScene;
